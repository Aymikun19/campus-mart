import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { imageUrl, photoPaths, type Listing } from "@/lib/market";
import { updateListing } from "../../../actions";
import { ListingForm } from "../../../ListingForm";

export default async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("listings").select("*").eq("id", id).eq("seller_id", user.id).maybeSingle();
  if (!data) notFound();
  const l = data as Listing;
  return <ListingForm action={updateListing.bind(null, id)} initial={l} existing={photoPaths(l).map((path) => ({ path, url: imageUrl(path)! }))} />;
}
