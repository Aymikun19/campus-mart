import { ArrowRight, PackageSearch, Search, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/lib/category-icons";
import { getUser } from "@/lib/supabase/server";
import { CATEGORIES, CONDITIONS, PAGE_SIZE, SORTS, searchQuery, type Listing } from "@/lib/market";
import { EmptyState } from "@/components/kit/Stat";
import { ListingCard } from "./ListingCard";

type Params = { q?: string; cat?: string; max?: string; cond?: string; sort?: string; page?: string };

export default async function Browse({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { q = "", cat = "", max = "", cond = "", sort = "new" } = sp;
  const page = Math.max(1, Number(sp.page) || 1);
  const { supabase, user } = await getUser();

  let query = supabase.from("listings").select("*", { count: "exact" }).eq("status", "available");
  const term = searchQuery(q);
  if (term) query = query.textSearch("search", term, { type: "websearch", config: "english" });
  if (cat) query = query.eq("category", cat);
  if (cond) query = query.eq("condition", cond);
  if (Number(max) > 0) query = query.lte("price_kobo", Number(max) * 100);
  query =
    sort === "price-asc" ? query.order("price_kobo", { ascending: true })
    : sort === "price-desc" ? query.order("price_kobo", { ascending: false })
    : query.order("created_at", { ascending: false });
  const { data, count } = await query.range(0, page * PAGE_SIZE - 1);
  const listings = (data ?? []) as Listing[];
  const total = count ?? listings.length;
  const href = (patch: Partial<Params>) => {
    const p = new URLSearchParams(Object.entries({ q, cat, max, cond, sort, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/?${p}`;
  };
  const filtered = Boolean(q || cat || max || cond);

  return (
    <div className="grid gap-6">
      {!user && !filtered && (
        <section className="card relative grid gap-6 overflow-hidden p-8 sm:p-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="grid gap-4">
            <p className="eyebrow">The student marketplace</p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Buy and sell on campus, without the hassle.</h1>
            <p className="max-w-lg text-stone-600">Textbooks, gadgets and hostel essentials from students near you. List in a minute, chat on WhatsApp, meet on campus.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login?mode=signup&next=/new" className="btn"><Store size={16} aria-hidden /> Start selling</Link>
              <a href="#listings" className="btn-outline">Browse listings <ArrowRight size={15} aria-hidden /></a>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              [Search, "Full-text search with filters and sorting"],
              [ShieldCheck, "No fees. Meet in public places on campus"],
              [Store, "A seller dashboard to manage your listings"],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof Search;
              return (
                <li key={i} className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-accent/10 text-accent"><I size={17} aria-hidden /></span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <form className="card grid gap-2 p-3 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <label className="relative">
          <span className="sr-only">Search listings</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Search textbooks, fridges, laptops…" className="input pl-9" />
        </label>
        <select name="cat" defaultValue={cat} className="input sm:!w-40" aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select name="cond" defaultValue={cond} className="input sm:!w-36" aria-label="Condition">
          <option value="">Any condition</option>
          {CONDITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input name="max" defaultValue={max} inputMode="numeric" placeholder="Max ₦" aria-label="Maximum price in naira" className="input sm:!w-28" />
        <input type="hidden" name="sort" value={sort} />
        <button className="btn"><Search size={16} aria-hidden /> Search</button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link href={href({ cat: "", page: "" })} className={`badge !px-3 !py-1.5 !text-sm ${!cat ? "!bg-accent !text-white" : "hover:!bg-stone-200"}`}>All</Link>
        {CATEGORIES.map(([v, l]) => (
          <Link key={v} href={href({ cat: v, page: "" })} className={`badge !px-3 !py-1.5 !text-sm ${cat === v ? "!bg-accent !text-white" : "hover:!bg-stone-200"}`}>
            <CategoryIcon category={v} size={14} /> {l}
          </Link>
        ))}
      </div>

      <div id="listings" className="flex flex-wrap items-center justify-between gap-3 scroll-mt-24">
        <p className="text-sm text-stone-500">
          {total} {total === 1 ? "item" : "items"}{q && <> for “{q}”</>}
          {filtered && <> · <Link href="/" className="text-accent hover:underline">Clear filters</Link></>}
        </p>
        <nav aria-label="Sort" className="flex gap-1 rounded-xl bg-stone-100 p-1 text-sm">
          {SORTS.map(([v, l]) => (
            <Link key={v} href={href({ sort: v, page: "" })} aria-current={sort === v ? "true" : undefined}
              className={`rounded-lg px-3 py-1.5 ${sort === v ? "bg-white font-medium shadow-sm" : "text-stone-500 hover:text-stone-800"}`}>
              {l}
            </Link>
          ))}
        </nav>
      </div>

      {listings.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Nothing found" text="Try a different search, or clear the filters.">
          <Link href="/" className="btn-outline">Clear filters</Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      )}
      {listings.length < total && (
        <Link href={href({ page: String(page + 1) })} scroll={false} className="btn-outline justify-self-center">
          Load more ({total - listings.length} left)
        </Link>
      )}
    </div>
  );
}
