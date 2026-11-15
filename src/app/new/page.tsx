import { requireUser } from "@/lib/supabase/server";
import { NewListingForm } from "./NewListingForm";

export default async function NewListing() {
  await requireUser();
  return <NewListingForm />;
}
