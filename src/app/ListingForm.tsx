"use client";

import { ImagePlus, Send } from "lucide-react";
import { useActionState, useState } from "react";
import { CATEGORIES, CONDITIONS, type Listing } from "@/lib/market";

export function ListingForm({
  action: serverAction,
  initial,
  initialImage,
}: {
  action: (prev: { error?: string }, form: FormData) => Promise<{ error?: string }>;
  initial?: Listing;
  initialImage?: string | null;
}) {
  const [state, action, pending] = useActionState(serverAction, {} as { error?: string });
  const [preview, setPreview] = useState<string | null>(initialImage ?? null);
  const [desc, setDesc] = useState(initial?.description ?? "");
  return (
    <form action={action} className="card mx-auto grid w-full max-w-2xl gap-5 p-6 sm:p-8">
      <div>
        <p className="eyebrow">{initial ? "Edit listing" : "New listing"}</p>
        <h1 className="page-title mt-1">{initial ? initial.title : "Sell something"}</h1>
      </div>
      <label className="grid aspect-video cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500 transition hover:border-accent hover:bg-accent/5">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Listing photo preview" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2">
            <ImagePlus size={28} aria-hidden /> Add a photo (JPG, PNG or WebP, up to 3 MB)
          </span>
        )}
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
      </label>
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
