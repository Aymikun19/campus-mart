"use client";

import { ImagePlus, Mic, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_VOICE_SECONDS, mmss } from "@/lib/chat";

/** Records a voice note with MediaRecorder and hands back the audio when the user taps Send. */
export function VoiceRecorder({ onDone, disabled }: { onDone: (blob: Blob, seconds: number) => void; disabled?: boolean }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const chunks = useRef<Blob[]>([]);
  const cancelled = useRef(false);
  const started = useRef(0);

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - started.current) / 1000);
      setSecs(s);
      if (s >= MAX_VOICE_SECONDS) rec.stop();
    }, 250);
    return () => clearInterval(t);
  }, [rec]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported(t));
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunks.current = [];
      cancelled.current = false;
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const seconds = Math.max(1, Math.round((Date.now() - started.current) / 1000));
        setRec(null);
        setSecs(0);
        if (!cancelled.current && chunks.current.length) onDone(new Blob(chunks.current, { type: (r.mimeType || "audio/webm").split(";")[0] }), seconds);
      };
      started.current = Date.now();
      r.start(250);
      setRec(r);
    } catch {
      setError("Microphone access was blocked. Allow it in your browser to send voice notes.");
    }
  }

  if (rec) {
    return (
      <div className="flex flex-1 items-center gap-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="status">
        <span className="size-2.5 animate-pulse rounded-full bg-red-600" aria-hidden />
        Recording {mmss(secs)} <span className="text-xs text-red-500">/ {mmss(MAX_VOICE_SECONDS)}</span>
        <span className="flex-1" />
        <button type="button" className="btn-ghost !p-2" aria-label="Discard voice note" onClick={() => { cancelled.current = true; rec.stop(); }}><Trash2 size={16} aria-hidden /></button>
        <button type="button" className="btn !py-1.5" onClick={() => rec.stop()}><Square size={14} aria-hidden /> Send</button>
      </div>
    );
  }
  return (
    <>
      <button type="button" disabled={disabled} onClick={start} className="btn-ghost !p-2.5" aria-label="Record a voice note" title="Record a voice note"><Mic size={18} aria-hidden /></button>
      {error && <p role="alert" className="absolute -top-7 left-3 right-3 text-xs text-red-600">{error}</p>}
    </>
  );
}

export function ImagePicker({ onPick, disabled }: { onPick: (file: File) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="btn-ghost !p-2.5" aria-label="Send a photo" title="Send a photo"><ImagePlus size={18} aria-hidden /></button>
      <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          if (!IMAGE_TYPES.includes(f.type)) return setError("Photos must be JPG, PNG, WebP or GIF.");
          if (f.size > MAX_IMAGE_BYTES) return setError("Photos must be under 8 MB.");
          setError(null);
          onPick(f);
        }} />
      {error && <p role="alert" className="absolute -top-7 left-3 right-3 text-xs text-red-600">{error}</p>}
    </>
  );
}
