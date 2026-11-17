import { CircleDollarSign, Package, PackageCheck, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { CategoryIcon } from "@/lib/category-icons";
import { ago, imageUrl, naira, type Listing } from "@/lib/market";
import { EmptyState, Stat } from "@/components/kit/Stat";
import { ConfirmForm } from "../ConfirmForm";
import { deleteListing, setStatus } from "../actions";

export const metadata = { title: "My listings" };

export default async function MyListings() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
  const listings = (data ?? []) as Listing[];
  const active = listings.filter((l) => l.status === "available");
  const sold = listings.filter((l) => l.status === "sold");
  const sum = (xs: Listing[]) => xs.reduce((s, l) => s + Number(l.price_kobo), 0);

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Seller dashboard</p>
          <h1 className="page-title mt-1">My listings</h1>
        </div>
        <Link href="/new" className="btn"><Plus size={16} aria-hidden /> Sell an item</Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Package} label="Active" value={String(active.length)} />
        <Stat icon={PackageCheck} label="Sold" value={String(sold.length)} />
        <Stat icon={CircleDollarSign} label="Value listed" value={naira(sum(active))} hint="Active listings" />
        <Stat icon={CircleDollarSign} label="Sales" value={naira(sum(sold))} hint="Marked as sold" />
      </div>
      {listings.length === 0 ? (
        <EmptyState icon={Package} title="Nothing listed yet" text="Post your first item. It takes under a minute.">
          <Link href="/new" className="btn"><Plus size={16} aria-hidden /> Sell an item</Link>
        </EmptyState>
      ) : (
        <div className="card divide-y divide-stone-100">
          {listings.map((l) => {
            const img = imageUrl(l.image_path);
            return (
              <div key={l.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-stone-300"><CategoryIcon category={l.category} size={26} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/l/${l.id}`} className="font-medium hover:text-accent">{l.title}</Link>
                  <p className="text-sm text-stone-500">{naira(l.price_kobo)} · {ago(l.created_at)}</p>
                  <span className={`badge mt-1 ${l.status === "sold" ? "!bg-stone-900 !text-white" : "!bg-emerald-100 !text-emerald-800"}`}>{l.status === "sold" ? "Sold" : "Active"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/l/${l.id}/edit`} className="btn-outline !py-1.5 text-xs"><Pencil size={13} aria-hidden /> Edit</Link>
                  <form action={setStatus.bind(null, l.id, l.status === "sold" ? "available" : "sold")}>
                    <button className="btn-outline !py-1.5 text-xs">
                      {l.status === "sold" ? <><Undo2 size={13} aria-hidden /> Relist</> : <><PackageCheck size={13} aria-hidden /> Mark sold</>}
                    </button>
                  </form>
                  <ConfirmForm action={deleteListing.bind(null, l.id, l.image_path)} message={`Delete “${l.title}”? This cannot be undone.`}>
                    <button className="btn-outline !py-1.5 text-xs hover:!border-red-300 hover:!bg-red-50 hover:!text-red-700"><Trash2 size={13} aria-hidden /> Delete</button>
                  </ConfirmForm>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
