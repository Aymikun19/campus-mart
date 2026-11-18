import { BadgeCheck, Clock, MapPin, MessageCircle, MessagesSquare, Pencil, ShieldAlert, Tag, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryIcon } from "@/lib/category-icons";
import { getUser } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/supabase/config";
import { ago, CATEGORIES, CATEGORY_TINT, CONDITIONS, imageUrl, label, naira, photoPaths, waLink, type Listing } from "@/lib/market";
import { startConversation } from "../../actions";
import { Gallery } from "./Gallery";
import { ListingCard } from "../../ListingCard";
import { ShareButton } from "../../ShareButton";
import { SaveButton } from "../../SaveButton";

async function load(id: string) {
  const { supabase, user } = await getUser();
  const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  return { supabase, user, l: data as Listing | null };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { l } = await load((await params).id);
  if (!l) return {};
  const img = imageUrl(photoPaths(l)[0] ?? null);
  return { title: `${l.title} · ${naira(l.price_kobo)}`, description: l.description.slice(0, 160), openGraph: img ? { images: [img] } : undefined };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, l } = await load(id);
  if (!l) notFound();
  const urls = photoPaths(l).map((p) => imageUrl(p)!);
  const mine = user?.id === l.seller_id;
  const [{ data: similar }, { data: sellerMore }, { data: savedRow }] = await Promise.all([
    supabase.from("listings").select("*").eq("category", l.category).eq("status", "available").neq("id", l.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("listings").select("*").eq("seller_id", l.seller_id).eq("status", "available").neq("id", l.id).order("created_at", { ascending: false }).limit(4),
    user ? supabase.from("saved").select("listing_id").eq("listing_id", l.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="grid gap-12">
      <div className="grid gap-8 md:grid-cols-2">
        {urls.length ? (
          <Gallery urls={urls} title={l.title} />
        ) : (
          <div className={`card grid aspect-square place-items-center ${CATEGORY_TINT[l.category] ?? CATEGORY_TINT.other}`}><CategoryIcon category={l.category} size={96} /></div>
        )}
        <div className="grid h-fit gap-5">
          <div>
            <Link href={`/?cat=${l.category}`} className="eyebrow inline-flex items-center gap-1.5 hover:underline">
              <CategoryIcon category={l.category} size={13} /> {label(CATEGORIES, l.category)}
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{l.title}</h1>
            <p className="mt-2 text-3xl font-bold text-accent">{naira(l.price_kobo)}</p>
            {l.status === "sold" && (
              <span className="mt-2 flex flex-wrap gap-1.5">
                <span className="badge !bg-stone-900 !text-white">Sold</span>
                {l.sale_status === "confirmed" && <span className="badge !bg-emerald-100 !text-emerald-800"><BadgeCheck size={13} aria-hidden /> Confirmed by the buyer</span>}
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              [Tag, "Condition", label(CONDITIONS, l.condition)],
              [MapPin, "Location", l.campus ?? "Campus"],
              [UserRound, "Seller", l.seller_name],
              [Clock, "Posted", ago(l.created_at)],
            ].map(([Icon, k, v]) => {
              const I = Icon as typeof Tag;
              return (
                <div key={k as string} className="flex items-center gap-2.5 rounded-xl bg-stone-50 p-3">
                  <I size={16} className="text-accent" aria-hidden />
                  <div><dt className="text-xs text-stone-500">{k as string}</dt><dd className="font-medium">{v as string}</dd></div>
                </div>
              );
            })}
          </dl>
          {l.description && <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{l.description}</p>}
          <div className="flex flex-wrap gap-2">
            {mine ? (
              <Link href={`/l/${l.id}/edit`} className="btn"><Pencil size={16} aria-hidden /> Edit listing</Link>
            ) : (
              l.status === "available" && (
                <>
                  <form action={startConversation.bind(null, l.id)}>
                    <button className="btn"><MessagesSquare size={16} aria-hidden /> Message seller</button>
                  </form>
                  <a href={waLink(l.whatsapp, l.title)} target="_blank" rel="noreferrer" className="btn-outline">
                    <MessageCircle size={16} aria-hidden /> WhatsApp
                  </a>
                </>
              )
            )}
            {user && !mine && <SaveButton id={l.id} saved={!!savedRow} />}
            <ShareButton title={l.title} url={`${SITE_URL}/l/${l.id}`} />
          </div>
          <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            <ShieldAlert size={16} className="shrink-0" aria-hidden /> Meet in a public place on campus and inspect items before paying.
          </p>
        </div>
      </div>
      {(sellerMore ?? []).length > 0 && (
        <section className="grid gap-4" aria-labelledby="more">
          <h2 id="more" className="text-lg font-semibold">More from {l.seller_name}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{(sellerMore as Listing[]).map((x) => <ListingCard key={x.id} l={x} />)}</div>
        </section>
      )}
      {(similar ?? []).length > 0 && (
        <section className="grid gap-4" aria-labelledby="similar">
          <h2 id="similar" className="text-lg font-semibold">Similar items</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{(similar as Listing[]).map((x) => <ListingCard key={x.id} l={x} />)}</div>
        </section>
      )}
    </div>
  );
}
