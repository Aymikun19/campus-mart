"use client";

import { ArrowLeft, BadgeCheck, CircleCheck, Clock, Loader2, PackageCheck, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/kit/Avatar";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DB_SCHEMA } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { CategoryIcon } from "@/lib/category-icons";
import { CATEGORY_TINT, naira } from "@/lib/market";
import { CHAT_BUCKET, chatPath, extFor, when } from "@/lib/chat";
import { confirmPurchase, markSold } from "../../actions";
import { ImagePicker, VoiceRecorder } from "../Media";

export type ChatMsg = { id: number; conversation_id: string; sender_id: string; kind: "text" | "voice" | "image"; body: string; attachment_path: string | null; duration_sec: number | null; created_at: string };
type Conv = { id: string; buyerId: string; sellerId: string; buyerName: string; sellerName: string };
type L = { id: string; title: string; price: number; category: string; cover: string | null; status: string; soldTo: string | null; saleStatus: string };

export function Chat({ conversation: c, listing, meId, initial }: { conversation: Conv; listing: L | null; meId: string; initial: ChatMsg[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);
  const seller = meId === c.sellerId;
  const other = seller ? c.buyerName : c.sellerName;

  useEffect(() => {
    const ch = supabase
      .channel(`conv:${c.id}`)
      .on("postgres_changes", { event: "INSERT", schema: DB_SCHEMA, table: "chat_messages", filter: `conversation_id=eq.${c.id}` }, (p) => {
        const m = p.new as ChatMsg;
        setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
        if (m.sender_id !== meId) supabase.rpc("mark_read", { p_conv: c.id });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [supabase, c.id, meId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const missing = messages.map((m) => m.attachment_path).filter((p): p is string => Boolean(p) && !urls[p as string]);
    if (!missing.length) return;
    supabase.storage.from(CHAT_BUCKET).createSignedUrls(missing, 3600).then(({ data }) => {
      if (data) setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((d) => d.path && d.signedUrl).map((d) => [d.path as string, d.signedUrl as string])) }));
    });
  }, [messages, urls, supabase]);

  async function insert(row: Partial<ChatMsg>) {
    const { data, error: e } = await supabase.from("chat_messages").insert({ conversation_id: c.id, ...row }).select().single();
    if (e) setError(e.message);
    else setMessages((list) => (list.some((x) => x.id === data.id) ? list : [...list, data as ChatMsg]));
  }

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    setError(null);
    await insert({ kind: "text", body });
  }

  async function sendMedia(kind: "voice" | "image", blob: Blob, duration?: number) {
    setError(null);
    setBusy(kind === "voice" ? "Sending voice note…" : "Sending photo…");
    const path = chatPath(c.id, meId, extFor(blob.type));
    const { error: up } = await supabase.storage.from(CHAT_BUCKET).upload(path, blob, { contentType: blob.type });
    if (up) setError(`Upload failed: ${up.message}`);
    else await insert({ kind, body: "", attachment_path: path, duration_sec: duration ?? null });
    setBusy(null);
  }

  const soldToOther = listing?.status === "sold" && listing.soldTo && listing.soldTo !== c.buyerId;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <Link href="/messages" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-accent"><ArrowLeft size={15} aria-hidden /> Messages</Link>
      <section className="card flex h-[72vh] min-h-[480px] flex-col overflow-hidden" aria-label={`Chat with ${other}`}>
        <header className="flex items-center gap-3 border-b border-stone-100 p-4">
          {listing ? (
            <Link href={`/l/${listing.id}`} className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl ${CATEGORY_TINT[listing.category] ?? CATEGORY_TINT.other}`}>
              {listing.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.cover} alt="" className="h-full w-full object-cover" />
              ) : <CategoryIcon category={listing.category} size={22} />}
            </Link>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate font-semibold"><Avatar userId={seller ? c.buyerId : c.sellerId} name={other} size={22} /> {other}</p>
            <p className="truncate text-xs text-stone-500">{listing ? <>{listing.title} · {naira(listing.price)}</> : "Listing removed"}</p>
          </div>
          {listing?.saleStatus === "confirmed" && listing.soldTo === c.buyerId && (
            <span className="badge !bg-emerald-100 !text-emerald-800"><BadgeCheck size={13} aria-hidden /> Sale confirmed</span>
          )}
        </header>

        {listing && listing.status === "sold" && listing.soldTo === c.buyerId && listing.saleStatus === "pending" && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="inline-flex items-center gap-2"><Clock size={16} aria-hidden /> {seller ? `Waiting for ${c.buyerName} to confirm they received it.` : "The seller marked this as sold to you."}</span>
            {!seller && (
              <button className="btn !py-1.5" disabled={pending}
                onClick={() => { if (confirm("Confirm that you have received this item? This marks the sale as complete.")) start(() => confirmPurchase(listing.id, c.id)); }}>
                <CircleCheck size={15} aria-hidden /> Confirm I received it
              </button>
            )}
          </div>
        )}
        {seller && listing && listing.status === "available" && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50 px-4 py-3 text-sm">
            <span className="text-stone-600">Agreed a deal with {c.buyerName}?</span>
            <button className="btn-outline !py-1.5" disabled={pending}
              onClick={() => {
                if (confirm(`Mark “${listing.title}” as sold to ${c.buyerName}? They will be asked to confirm they received it.`))
                  start(async () => { const r = await markSold(listing.id, c.buyerId); if (r.error) setError(r.error); });
              }}>
              <PackageCheck size={15} aria-hidden /> Mark as sold to {c.buyerName.split(" ")[0]}
            </button>
          </div>
        )}
        {soldToOther && <p className="border-b border-stone-100 bg-stone-50 px-4 py-2 text-sm text-stone-600">This item has been sold to someone else.</p>}

        <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
          {messages.length === 0 && <p className="grid h-full place-items-center text-center text-sm text-stone-500">Say hello and ask if it is still available.</p>}
          {messages.map((m, i) => {
            const mine = m.sender_id === meId;
            const prev = messages[i - 1];
            const grouped = prev && prev.sender_id === m.sender_id && Date.parse(m.created_at) - Date.parse(prev.created_at) < 5 * 60_000;
            const url = m.attachment_path ? urls[m.attachment_path] : undefined;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "mt-1" : "mt-4"}`}>
                <div className={`grid max-w-[78%] gap-1 ${mine ? "justify-items-end" : ""}`}>
                  {m.kind === "text" && (
                    <p className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-stone-100"}`}>{m.body}</p>
                  )}
                  {m.kind === "voice" && (
                    <div className={`rounded-2xl p-1.5 ${mine ? "rounded-br-md bg-accent" : "rounded-bl-md bg-stone-100"}`}>
                      {url ? <audio controls preload="metadata" src={url} className="h-10 w-64 max-w-full" aria-label={`Voice note, ${m.duration_sec ?? 0} seconds`} /> : <span className="px-2 text-xs">Loading voice note…</span>}
                    </div>
                  )}
                  {m.kind === "image" && (
                    url ? (
                      <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Photo sent in chat" className="max-h-72 w-auto max-w-full object-cover" />
                      </a>
                    ) : <span className="text-xs text-stone-500">Loading photo…</span>
                  )}
                  {!grouped && <span className="text-[11px] text-stone-400" suppressHydrationWarning>{when(m.created_at)}</span>}
                </div>
              </div>
            );
          })}
          <div ref={bottom} />
        </div>

        {(busy || error) && (
          <p className={`flex items-center gap-2 px-4 pb-1 text-xs ${error ? "text-red-600" : "text-stone-500"}`} role="status">
            {busy && <Loader2 size={13} className="animate-spin" aria-hidden />} {error ?? busy}
          </p>
        )}
        <form onSubmit={sendText} className="relative flex items-center gap-1 border-t border-stone-100 p-3">
          <ImagePicker disabled={Boolean(busy)} onPick={(f) => sendMedia("image", f)} />
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <input id="chat-input" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={`Message ${other.split(" ")[0]}…`} className="input mx-1" autoComplete="off" />
          {text.trim() ? (
            <button className="btn shrink-0" aria-label="Send message"><SendHorizontal size={16} aria-hidden /></button>
          ) : (
            <VoiceRecorder disabled={Boolean(busy)} onDone={(blob, secs) => sendMedia("voice", blob, secs)} />
          )}
        </form>
      </section>
    </div>
  );
}
