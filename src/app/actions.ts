"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";

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

export async function createListing(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let image_path: string | null = null;
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED.includes(file.type)) return { error: "Images must be JPG, PNG or WebP" };
    if (file.size > 3 * 1024 * 1024) return { error: "Image must be under 3 MB" };
    image_path = `${user.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    const { error } = await supabase.storage.from("listing-images").upload(image_path, file, { contentType: file.type });
    if (error) return { error: `Upload failed: ${error.message}` };
  }

  const { price, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("listings")
    .insert({
      ...rest,
      price_kobo: Math.round(price * 100),
      image_path,
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
  const { data: current } = await supabase.from("listings").select("image_path").eq("id", id).eq("seller_id", user.id).maybeSingle();
  if (!current) return { error: "Listing not found" };

  let image_path = current.image_path as string | null;
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    if (!ALLOWED.includes(file.type)) return { error: "Images must be JPG, PNG or WebP" };
    if (file.size > 3 * 1024 * 1024) return { error: "Image must be under 3 MB" };
    const next = `${user.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    const { error } = await supabase.storage.from("listing-images").upload(next, file, { contentType: file.type });
    if (error) return { error: `Upload failed: ${error.message}` };
    if (image_path) await supabase.storage.from("listing-images").remove([image_path]);
    image_path = next;
  }

  const { price, ...rest } = parsed.data;
  const { error } = await supabase.from("listings").update({ ...rest, price_kobo: Math.round(price * 100), image_path }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/me");
  redirect(`/l/${id}`);
}

export async function setStatus(id: string, status: "available" | "sold") {
  const { supabase } = await requireUser();
  await supabase.from("listings").update({ status }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/me");
}

export async function deleteListing(id: string, imagePath: string | null) {
  const { supabase } = await requireUser();
  await supabase.from("listings").delete().eq("id", id);
  if (imagePath) await supabase.storage.from("listing-images").remove([imagePath]);
  revalidatePath("/");
  revalidatePath("/me");
}
