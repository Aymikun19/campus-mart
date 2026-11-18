"use client";

import { ImagePlus, Send, X } from "lucide-react";
import { useActionState, useState } from "react";
import { CATEGORIES, CONDITIONS, MAX_PHOTOS, type Listing } from "@/lib/market";

type Existing = { path: string; url: string };

export function ListingForm({
  action: serverAction,
  initial,
  existing = [],
}: {
  action: (prev: { error?: string }, form: FormData) => Promise<{ error?: string }>;
  initial?: Listing;
  existing?: Existing[];
}) {
  const [state, action, pending] = useActionState(serverAction, {} as { error?: string });
  const [keep, setKeep] = useState(existing.map((e) => e.path));
  const [added, setAdded] = useState<{ file: File; url: string }[]>([]);
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const total = keep.length + added.length;

  function onPick(list: FileList | null) {
    if (!list) return;
    const files = [...list].filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
    const room = MAX_PHOTOS - total;
    if (files.length > room) setPhotoError(`You can add ${room} more photo${room === 1 ? "" : "s"}.`);
    else setPhotoError(null);
    setAdded((a) => [...a, ...files.slice(0, Math.max(0, room)).map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }

  return (
    <form
      action={(fd) => {
        fd.delete("images");
        added.forEach((a) => fd.append("images", a.file));
        keep.forEach((k) => fd.append("keep", k));
        return action(fd);
      }}
      className="card mx-auto grid w-full max-w-2xl gap-5 p-6 sm:p-8"
    >
      <div>
        <p className="eyebrow">{initial ? "Edit listing" : "New listing"}</p>
        <h1 className="page-title mt-1">{initial ? initial.title : "Sell something"}</h1>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 flex w-full justify-between text-sm font-medium text-stone-700">
          Photos <small className="font-normal text-stone-400">{total}/{MAX_PHOTOS} · the first is the cover</small>
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {existing.filter((e) => keep.includes(e.path)).map((e) => (
            <Thumb key={e.path} url={e.url} onRemove={() => setKeep((k) => k.filter((p) => p !== e.path))} />
          ))}
          {added.map((a, i) => (
            <Thumb key={a.url} url={a.url} onRemove={() => setAdded((x) => x.filter((_, j) => j !== i))} />
          ))}
          {total < MAX_PHOTOS && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-center text-xs text-stone-500 transition hover:border-accent hover:bg-accent/5">
              <span className="grid justify-items-center gap-1"><ImagePlus size={22} aria-hidden /> Add photos</span>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { onPick(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
        <small className="text-xs text-stone-500">JPG, PNG or WebP, up to 3 MB each.</small>
        {photoError && <p role="alert" className="text-xs text-amber-700">{photoError}</p>}
      </fieldset>

      <label className="field"><span>Title</span><input name="title" required maxLength={80} defaultValue={initial?.title} placeholder="CSC 201 textbook" /></label>
      <label className="field">
        <span className="flex justify-between">Description <small className="font-normal text-stone-400">{desc.length}/2000</small></span>
        <textarea name="description" rows={4} maxLength={2000} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Condition details, what is included, where to meet" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field"><span>Price (₦)</span><input name="price" type="number" min={0} required defaultValue={initial ? initial.price_kobo / 100 : undefined} /></label>
        <label className="field"><span>Category</span><select name="category" defaultValue={initial?.category}>{CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="field"><span>Condition</span><select name="condition" defaultValue={initial?.condition ?? "used"}>{CONDITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field"><span>Campus / hall</span><input name="campus" defaultValue={initial?.campus ?? ""} placeholder="Main campus" /></label>
        <label className="field"><span>WhatsApp number</span><input name="whatsapp" required defaultValue={initial?.whatsapp} placeholder="0803 123 4567" inputMode="tel" /></label>
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button className="btn !py-3" disabled={pending}><Send size={16} aria-hidden /> {pending ? "Saving…" : initial ? "Save changes" : "Post listing"}</button>
    </form>
  );
}

function Thumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button type="button" onClick={onRemove} aria-label="Remove photo" className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-stone-900/70 text-white hover:bg-stone-900">
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
