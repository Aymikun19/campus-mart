import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, imageUrl, naira, searchQuery, type Listing } from "@/lib/market";

export default async function Browse({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; max?: string }> }) {
  const { q = "", cat = "", max = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("listings").select("*").eq("status", "available").order("created_at", { ascending: false }).limit(60);
  const term = searchQuery(q);
  if (term) query = query.textSearch("search", term, { type: "websearch", config: "english" });
  if (cat) query = query.eq("category", cat);
  if (Number(max) > 0) query = query.lte("price_kobo", Number(max) * 100);
  const { data } = await query;
  const listings = (data ?? []) as Listing[];

  return (
    <div className="grid gap-6">
      <form className="card flex flex-wrap gap-2 p-3">
        <input name="q" defaultValue={q} placeholder="Search textbooks, fridges, laptops…" className="min-w-[200px] flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm" />
        <select name="cat" defaultValue={cat} className="rounded-xl border border-stone-300 px-3 py-2 text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input name="max" defaultValue={max} inputMode="numeric" placeholder="Max ₦" className="w-28 rounded-xl border border-stone-300 px-3 py-2 text-sm" />
        <button className="btn">Search</button>
      </form>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(([v, l]) => (
          <Link key={v} href={`/?cat=${v}`} className={`badge !px-3 !py-1 ${cat === v ? "!bg-accent !text-white" : ""}`}>{l}</Link>
        ))}
      </div>

      {listings.length === 0 && <p className="card p-10 text-center text-stone-500">Nothing found. Try another search.</p>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {listings.map((l) => (
          <Link key={l.id} href={`/l/${l.id}`} className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="aspect-square bg-stone-100">
              {imageUrl(l.image_path) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl(l.image_path)!} alt={l.title} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="grid h-full place-items-center text-4xl">📦</div>
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold">{naira(l.price_kobo)}</p>
              <p className="truncate text-sm">{l.title}</p>
              <p className="text-xs text-stone-500">{l.campus ?? "Campus"} · {l.condition}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
