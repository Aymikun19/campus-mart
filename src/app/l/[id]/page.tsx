import { MessageCircle, ShieldAlert } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { imageUrl, naira, waLink, type Listing } from "@/lib/market";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const l = data as Listing;
  const img = imageUrl(l.image_path);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card aspect-square overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img ? <img src={img} alt={l.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-stone-300"><CategoryIcon category={l.category} size={80} /></div>}
      </div>
      <div>
        {l.status === "sold" && <span className="badge !bg-red-100 !text-red-700">Sold</span>}
        <h1 className="mt-2 text-2xl font-bold">{l.title}</h1>
        <p className="mt-1 text-3xl font-bold text-accent">{naira(l.price_kobo)}</p>
        <p className="mt-2 text-sm text-stone-500">{l.condition} · {l.category} · {l.campus ?? "Campus"}</p>
        <p className="mt-4 whitespace-pre-wrap">{l.description}</p>
        <p className="mt-6 text-sm text-stone-500">Seller: {l.seller_name}</p>
        {l.status === "available" && (
          <a href={waLink(l.whatsapp, l.title)} target="_blank" rel="noreferrer" className="btn mt-3 !bg-[#25D366]"><MessageCircle size={16} aria-hidden /> Chat on WhatsApp</a>
        )}
        <p className="mt-6 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><ShieldAlert size={16} className="shrink-0" aria-hidden /> Safety tip: meet in a public place on campus and inspect items before paying.</p>
      </div>
    </div>
  );
}
