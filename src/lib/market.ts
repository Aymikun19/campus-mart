export const CATEGORIES = [
  ["books", "📚 Books"],
  ["electronics", "💻 Electronics"],
  ["fashion", "👟 Fashion"],
  ["hostel", "🛏️ Hostel items"],
  ["food", "🍲 Food"],
  ["services", "🛠️ Services"],
  ["other", "📦 Other"],
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
