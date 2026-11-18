import { Heart } from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { EmptyState } from "@/components/kit/Stat";
import type { Listing } from "@/lib/market";
import { ListingCard } from "../ListingCard";

export const metadata = { title: "Saved items" };

export default async function Saved() {
  const { supabase } = await requireUser("/saved");
  const { data } = await supabase.from("saved").select("created_at, listings(*)").order("created_at", { ascending: false });
  const items = (data ?? []).map((r) => r.listings as unknown as Listing).filter(Boolean);
  const available = items.filter((l) => l.status === "available");
  const sold = items.filter((l) => l.status !== "available");
  return (
    <div className="grid gap-8">
      <div>
        <p className="eyebrow">Your shortlist</p>
        <h1 className="page-title mt-1">Saved items</h1>
        <p className="mt-1 text-sm text-stone-500">{available.length} still available{sold.length ? `, ${sold.length} sold since you saved them` : ""}.</p>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing saved yet" text="Tap the heart on any listing to keep it here while you decide.">
          <Link href="/" className="btn">Browse listings</Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...available, ...sold].map((l) => <ListingCard key={l.id} l={l} saved />)}
        </div>
      )}
    </div>
  );
}
