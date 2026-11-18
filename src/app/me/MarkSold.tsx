"use client";

import { PackageCheck, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { markSold } from "../actions";

export function MarkSold({ listingId, title, buyers }: { listingId: string; title: string; buyers: { id: string; name: string }[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [buyer, setBuyer] = useState<string>(buyers[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" className="btn-outline !py-1.5 text-xs" onClick={() => dialog.current?.showModal()}>
        <PackageCheck size={13} aria-hidden /> Mark sold
      </button>
      <dialog ref={dialog} className="m-auto w-[min(460px,calc(100vw-2rem))] rounded-2xl p-0 shadow-2xl backdrop:bg-stone-900/40">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="font-semibold">Mark as sold</h2>
          <button type="button" className="btn-ghost !p-2" aria-label="Close" onClick={() => dialog.current?.close()}><X size={16} aria-hidden /></button>
        </div>
        <div className="grid gap-4 p-6">
          <p className="text-sm text-stone-600">Who bought <b>{title}</b>? If they bought it through CampusMart chat, they will be asked to confirm they received it, and the listing gets a “Confirmed by the buyer” badge.</p>
          <fieldset className="grid gap-2">
            <legend className="sr-only">Buyer</legend>
            {buyers.map((b) => (
              <label key={b.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${buyer === b.id ? "border-accent bg-accent/5" : "border-stone-200"}`}>
                <input type="radio" name="buyer" value={b.id} checked={buyer === b.id} onChange={() => setBuyer(b.id)} className="accent-[var(--accent)]" />
                {b.name} <span className="text-stone-400">(messaged you)</span>
              </label>
            ))}
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${buyer === "" ? "border-accent bg-accent/5" : "border-stone-200"}`}>
              <input type="radio" name="buyer" value="" checked={buyer === ""} onChange={() => setBuyer("")} className="accent-[var(--accent)]" />
              Someone else, outside CampusMart
            </label>
          </fieldset>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button type="button" className="btn" disabled={pending}
            onClick={() => start(async () => {
              const r = await markSold(listingId, buyer || null);
              if (r.error) setError(r.error);
              else dialog.current?.close();
            })}>
            <PackageCheck size={15} aria-hidden /> {pending ? "Saving…" : "Confirm sale"}
          </button>
        </div>
      </dialog>
    </>
  );
}
