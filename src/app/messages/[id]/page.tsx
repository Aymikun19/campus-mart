import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { imageUrl, photoPaths, type Listing } from "@/lib/market";
import { Chat, type ChatMsg } from "./Chat";

export default async function Thread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/messages/${id}`);
  const { data: conv } = await supabase
    .from("conversations")
    .select("*, listings(id, title, price_kobo, category, image_path, image_paths, status, sold_to, sale_status, seller_id)")
    .eq("id", id)
    .maybeSingle();
  if (!conv) notFound();
  const [{ data: messages }] = await Promise.all([
    supabase.from("chat_messages").select("*").eq("conversation_id", id).order("created_at").limit(300),
    supabase.rpc("mark_read", { p_conv: id }),
  ]);
  const l = conv.listings as (Listing & { sold_to: string | null; sale_status: string }) | null;
  return (
    <Chat
      conversation={{ id, buyerId: conv.buyer_id, sellerId: conv.seller_id, buyerName: conv.buyer_name, sellerName: conv.seller_name }}
      listing={l ? { id: l.id, title: l.title, price: l.price_kobo, category: l.category, cover: imageUrl(photoPaths(l)[0] ?? null), status: l.status, soldTo: l.sold_to, saleStatus: l.sale_status } : null}
      meId={user.id}
      initial={(messages ?? []) as ChatMsg[]}
    />
  );
}
