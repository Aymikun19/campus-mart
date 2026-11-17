export const CATEGORIES = [
  ["books", "Books"],
  ["electronics", "Electronics"],
  ["fashion", "Fashion"],
  ["hostel", "Hostel items"],
  ["food", "Food"],
  ["services", "Services"],
  ["other", "Other"],
] as const;

export type Listing = {
  id: string; seller_id: string; seller_name: string; title: string; description: string;
  price_kobo: number; category: string; condition: string; campus: string | null;
  whatsapp: string; image_path: string | null; status: "available" | "sold"; created_at: string;
};

export const naira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);

export const imageUrl = (path: string | null) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${path}` : null;

/** Normalise Nigerian numbers to wa.me format: 0803… → 234803… */
export function waLink(phone: string, title: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  const text = encodeURIComponent(`Hi! Is "${title}" on CampusMart still available?`);
  return `https://wa.me/${digits}?text=${text}`;
}

/** Turn free text into a safe websearch query for Postgres full-text search. */
export const searchQuery = (q: string) => q.replace(/[^\p{L}\p{N}\s"-]/gu, " ").trim().slice(0, 80);

export const CONDITIONS = [
  ["new", "New"],
  ["like-new", "Like new"],
  ["used", "Used"],
] as const;

export const SORTS = [
  ["new", "Newest first"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
] as const;

export const PAGE_SIZE = 24;

/** "3h ago", "2d ago" */
export function ago(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m || 1}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 60 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const label = (list: readonly (readonly [string, string])[], v: string) => list.find(([k]) => k === v)?.[1] ?? v;

/** Posted in the last 48 hours. */
export const isFresh = (iso: string, now = Date.now()) => now - new Date(iso).getTime() < 48 * 3600 * 1000;
