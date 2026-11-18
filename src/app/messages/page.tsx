import { MessagesSquare } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/kit/Avatar";
import { requireUser } from "@/lib/supabase/server";
import { CategoryIcon } from "@/lib/category-icons";
import { when } from "@/lib/chat";
import { CATEGORY_TINT, imageUrl, naira, photoPaths, type Listing } from "@/lib/market";
import { EmptyState } from "@/components/kit/Stat";

export const metadata = { title: "Messages" };

type Conv = {
  id: string; buyer_id: string; seller_id: string; buyer_name: string; seller_name: string;
  last_message_at: string; last_message_preview: string | null; buyer_read_at: string; seller_read_at: string;
  listings: Pick<Listing, "id" | "title" | "price_kobo" | "category" | "image_path" | "image_paths" | "status"> | null;
};

export default async function Inbox() {
  const { supabase, user } = await requireUser("/messages");
  const { data } = await supabase
    .from("conversations")
    .select("*, listings(id, title, price_kobo, category, image_path, image_paths, status)")
    .order("last_message_at", { ascending: false });
  const convs = (data ?? []) as unknown as Conv[];

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6">
      <div>
        <p className="eyebrow">Inbox</p>
        <h1 className="page-title mt-1">Messages</h1>
      </div>
      {convs.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="No conversations yet" text="Tap “Message seller” on any listing to start a chat. Buyers who message you appear here too." />
      ) : (
        <ul className="card divide-y divide-stone-100">
          {convs.map((c) => {
            const buying = c.buyer_id === user.id;
            const other = buying ? c.seller_name : c.buyer_name;
            const readAt = buying ? c.buyer_read_at : c.seller_read_at;
            const unread = c.last_message_preview && c.last_message_at > readAt;
            const l = c.listings;
            const img = l ? imageUrl(photoPaths(l)[0] ?? null) : null;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-4 p-4 transition hover:bg-stone-50">
                  <div className={`grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl ${l ? (CATEGORY_TINT[l.category] ?? CATEGORY_TINT.other) : "bg-stone-100"}`}>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : l && <CategoryIcon category={l.category} size={24} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`flex min-w-0 items-center gap-2 ${unread ? "font-semibold" : "font-medium"}`}>
                        <Avatar userId={buying ? c.seller_id : c.buyer_id} name={other} size={20} />
                        <span className="truncate">{other}</span>
                      </p>
                      <span className="shrink-0 text-xs text-stone-500" suppressHydrationWarning>{when(c.last_message_at)}</span>
                    </div>
                    <p className="truncate text-xs text-stone-500">{buying ? "Buying" : "Selling"} · {l?.title ?? "Listing removed"}{l && ` · ${naira(l.price_kobo)}`}</p>
                    <p className={`mt-0.5 truncate text-sm ${unread ? "text-stone-900" : "text-stone-500"}`}>{c.last_message_preview ?? "No messages yet"}</p>
                  </div>
                  {unread && <span className="size-2.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
