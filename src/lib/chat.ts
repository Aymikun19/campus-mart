export const CHAT_BUCKET = "chat-media";
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VOICE_SECONDS = 120;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const chatPath = (conversationId: string, userId: string, ext: string) =>
  `${conversationId}/${userId}/${crypto.randomUUID()}.${ext.replace(/[^a-z0-9]/gi, "").slice(0, 5) || "bin"}`;

export function mmss(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

/** "Today 14:05", "Yesterday 09:12", "12 Nov 18:40" */
export function when(iso: string, now = new Date()) {
  const d = new Date(iso);
  const t = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return t;
  const y = new Date(now.getTime() - 86_400_000);
  if (d.toDateString() === y.toDateString()) return `Yesterday ${t}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${t}`;
}

export const extFor = (type: string) =>
  type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : type.includes("mpeg") ? "mp3" : type.includes("webm") ? "webm" : type.split("/")[1] ?? "bin";
