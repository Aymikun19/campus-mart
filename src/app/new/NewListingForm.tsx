"use client";

import { useActionState, useState } from "react";
import { createListing } from "../actions";
import { CATEGORIES } from "@/lib/market";

export function NewListingForm() {
  const [state, action, pending] = useActionState(createListing, {} as { error?: string });
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <form action={action} className="card mx-auto grid max-w-xl gap-4 p-6">
      <h1 className="text-xl font-semibold">Sell something</h1>
      <label className="grid aspect-video cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          "📷 Add a photo (JPG/PNG/WebP, max 3 MB)"
        )}
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : null); }} />
      </label>
      <label className="field"><span>Title</span><input name="title" required maxLength={80} placeholder="CSC 201 textbook" /></label>
      <label className="field"><span>Description</span><textarea name="description" rows={3} /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="field"><span>Price (₦)</span><input name="price" type="number" min={0} required /></label>
        <label className="field"><span>Category</span><select name="category">{CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="field"><span>Condition</span><select name="condition"><option value="used">Used</option><option value="like-new">Like new</option><option value="new">New</option></select></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field"><span>Campus / hall</span><input name="campus" placeholder="Main campus" /></label>
        <label className="field"><span>WhatsApp number</span><input name="whatsapp" required placeholder="0803 123 4567" /></label>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn" disabled={pending}>{pending ? "Posting…" : "Post listing"}</button>
    </form>
  );
}
