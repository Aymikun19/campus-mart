"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toggleSaved } from "./actions";

export function SaveButton({ id, saved, compact = false }: { id: string; saved: boolean; compact?: boolean }) {
  const [on, setOn] = useOptimistic(saved);
  const [, start] = useTransition();
  const click = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      setOn(!on);
      await toggleSaved(id, !on);
    });
  };
  const label = on ? "Remove from saved" : "Save for later";
  if (compact)
    return (
      <button
        type="button"
        onClick={click}
        aria-label={label}
        aria-pressed={on}
        title={label}
        className="grid size-9 place-items-center rounded-full bg-white/90 text-stone-700 shadow-sm backdrop-blur transition hover:scale-105"
      >
        <Heart size={17} aria-hidden className={on ? "fill-rose-500 text-rose-500" : ""} />
      </button>
    );
  return (
    <button type="button" onClick={click} aria-pressed={on} className="btn-outline">
      <Heart size={16} aria-hidden className={on ? "fill-rose-500 text-rose-500" : ""} /> {on ? "Saved" : "Save"}
    </button>
  );
}
