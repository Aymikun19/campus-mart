"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function Gallery({ urls, title }: { urls: string[]; title: string }) {
  const [i, setI] = useState(0);
  const n = urls.length;
  return (
    <div className="grid gap-3">
      <div className="card relative aspect-square overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[i]} alt={`${title}, photo ${i + 1} of ${n}`} className="h-full w-full object-cover" />
        {n > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => setI((i - 1 + n) % n)}
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow hover:bg-white"><ChevronLeft size={18} aria-hidden /></button>
            <button type="button" aria-label="Next photo" onClick={() => setI((i + 1) % n)}
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow hover:bg-white"><ChevronRight size={18} aria-hidden /></button>
            <span className="badge absolute bottom-3 right-3 !bg-stone-900/70 !text-white">{i + 1} / {n}</span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {urls.map((u, j) => (
            <button key={u} type="button" onClick={() => setI(j)} aria-label={`Show photo ${j + 1}`} aria-current={i === j}
              className={`aspect-square overflow-hidden rounded-xl ring-offset-2 transition ${i === j ? "ring-2 ring-accent" : "opacity-70 hover:opacity-100"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
