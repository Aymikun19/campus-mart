import { requireUser } from "@/lib/supabase/server";
import { createListing } from "../actions";
import { ListingForm } from "../ListingForm";

export const metadata = { title: "Sell an item" };

export default async function NewListing() {
  await requireUser();
  return <ListingForm action={createListing} />;
}
