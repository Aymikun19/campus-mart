import Link from "next/link";
import { MapPin } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import { ago, CONDITIONS, isFresh, imageUrl, label, naira, type Listing } from "@/lib/market";

export function ListingCard({ l }: { l: Listing }) {
  const img = imageUrl(l.image_path);
  const fresh = isFresh(l.created_at);
  return (
    <Link href={`/l/${l.id}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={l.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center text-stone-300"><CategoryIcon category={l.category} size={48} /></div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {fresh && <span className="badge !bg-accent !text-white">New</span>}
          {l.status === "sold" && <span className="badge !bg-stone-900 !text-white">Sold</span>}
        </div>
      </div>
      <div className="grid gap-0.5 p-3">
        <p className="text-lg font-semibold tracking-tight">{naira(l.price_kobo)}</p>
        <p className="truncate text-sm">{l.title}</p>
        <p className="flex items-center gap-1 truncate text-xs text-stone-500">
          <MapPin size={12} aria-hidden /> {l.campus ?? "Campus"} · {label(CONDITIONS, l.condition)} · {ago(l.created_at)}
        </p>
      </div>
    </Link>
  );
}
