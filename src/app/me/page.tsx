import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { naira, type Listing } from "@/lib/market";
import { deleteListing, setStatus } from "../actions";

export default async function MyListings() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
  const listings = (data ?? []) as Listing[];
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My listings</h1>
        <form action="/auth/signout" method="post"><button className="text-sm text-stone-500">Sign out</button></form>
      </div>
      {listings.map((l) => (
        <div key={l.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <Link href={`/l/${l.id}`} className="font-medium hover:underline">{l.title} <span className="text-stone-500">· {naira(l.price_kobo)}</span></Link>
          <div className="flex gap-2">
            <form action={setStatus.bind(null, l.id, l.status === "sold" ? "available" : "sold")}>
              <button className="btn-outline !py-1 text-xs">{l.status === "sold" ? "Relist" : "Mark sold"}</button>
            </form>
            <form action={deleteListing.bind(null, l.id, l.image_path)}><button className="btn-outline !py-1 text-xs text-red-600">Delete</button></form>
          </div>
        </div>
      ))}
      {listings.length === 0 && <p className="text-sm text-stone-500">You haven&apos;t listed anything yet.</p>}
    </div>
  );
}
