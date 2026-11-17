"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-outline"
      onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ title, text: `${title} on CampusMart`, url });
          else {
            await navigator.clipboard.writeText(url);
            setDone(true);
            setTimeout(() => setDone(false), 1600);
          }
        } catch {
          /* user cancelled */
        }
      }}
    >
      {done ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />} {done ? "Link copied" : "Share"}
    </button>
  );
}
