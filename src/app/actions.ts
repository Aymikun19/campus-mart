"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { MAX_PHOTOS } from "@/lib/market";

const schema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().max(2000).default(""),
  price: z.coerce.number().min(0).max(100_000_000),
  category: z.enum(["books", "electronics", "fashion", "hostel", "food", "services", "other"]),
  condition: z.enum(["new", "like-new", "used"]),
  campus: z.string().trim().max(60).optional(),
  whatsapp: z.string().trim().regex(/^\+?[\d\s-]{10,16}$/, "Enter a valid phone number"),
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
type Supa = Awaited<ReturnType<typeof requireUser>>["supabase"];

/** Validates and uploads new photos; returns their storage paths. */
async function uploadPhotos(supabase: Supa, userId: string, files: File[]): Promise<{ paths?: string[]; error?: string }> {
  const paths: string[] = [];
  for (const file of files) {
    if (!ALLOWED.includes(file.type)) return { error: "Photos must be JPG, PNG or WebP" };
    if (file.size > 3 * 1024 * 1024) return { error: `${file.name} is over 3 MB` };
    const path = `${userId}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file, { contentType: file.type });
    if (error) return { error: `Upload failed: ${error.message}` };
    paths.push(path);
  }
  return { paths };
}

const filesFrom = (form: FormData) => form.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);

export async function createListing(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const files = filesFrom(form);
  if (files.length > MAX_PHOTOS) return { error: `Add up to ${MAX_PHOTOS} photos` };
  const up = await uploadPhotos(supabase, user.id, files);
  if (up.error) return { error: up.error };

  const { price, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("listings")
    .insert({
      ...rest,
      price_kobo: Math.round(price * 100),
      image_path: up.paths![0] ?? null,
      image_paths: up.paths,
      seller_name: user.user_metadata?.full_name ?? user.email?.split("@")[0],
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/");
  redirect(`/l/${data.id}`);
}

export async function updateListing(id: string, _prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data: current } = await supabase.from("listings").select("image_path, image_paths").eq("id", id).eq("seller_id", user.id).maybeSingle();
  if (!current) return { error: "Listing not found" };

  const existing: string[] = current.image_paths?.length ? current.image_paths : current.image_path ? [current.image_path] : [];
  const keep = form.getAll("keep").map(String).filter((p) => existing.includes(p));
  const files = filesFrom(form);
  if (keep.length + files.length > MAX_PHOTOS) return { error: `A listing can have up to ${MAX_PHOTOS} photos` };
  const up = await uploadPhotos(supabase, user.id, files);
  if (up.error) return { error: up.error };
  const photos = [...keep, ...up.paths!];

  const { price, ...rest } = parsed.data;
  const { error } = await supabase
    .from("listings")
    .update({ ...rest, price_kobo: Math.round(price * 100), image_path: photos[0] ?? null, image_paths: photos })
    .eq("id", id);
  if (error) return { error: error.message };
  const removed = existing.filter((p) => !keep.includes(p));
  if (removed.length) await supabase.storage.from("listing-images").remove(removed);
  revalidatePath("/");
  revalidatePath("/me");
  redirect(`/l/${id}`);
}

export async function markSold(id: string, buyerId: string | null): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("mark_sold", { p_listing: id, p_buyer: buyerId });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath(`/l/${id}`);
  return {};
}

export async function relist(id: string) {
  const { supabase } = await requireUser();
  await supabase.rpc("relist", { p_listing: id });
  revalidatePath("/");
  revalidatePath("/me");
}

export async function confirmPurchase(listingId: string, conversationId: string) {
  const { supabase } = await requireUser();
  await supabase.rpc("confirm_purchase", { p_listing: listingId });
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath(`/l/${listingId}`);
}

export async function startConversation(listingId: string) {
  const { supabase } = await requireUser(`/l/${listingId}`);
  const { data, error } = await supabase.rpc("start_conversation", { p_listing: listingId });
  if (error) throw new Error(error.message);
  redirect(`/messages/${data}`);
}

export async function deleteListing(id: string, paths: string[]) {
  const { supabase } = await requireUser();
  await supabase.from("listings").delete().eq("id", id);
  if (paths.length) await supabase.storage.from("listing-images").remove(paths);
  revalidatePath("/");
  revalidatePath("/me");
}

export async function toggleSaved(listingId: string, save: boolean) {
  const { supabase } = await requireUser();
  if (save) await supabase.from("saved").upsert({ listing_id: listingId }, { onConflict: "user_id,listing_id", ignoreDuplicates: true });
  else await supabase.from("saved").delete().eq("listing_id", listingId);
  revalidatePath("/saved");
}
