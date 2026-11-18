import { BadgeCheck, Camera, ChartColumn, MessagesSquare, Search, Share2 } from "lucide-react";

export const brand = {
  name: "CampusMart",
  short: "Buy and sell within your campus",
  eyebrow: "The student marketplace",
  tagline: "Buy and sell on campus, without the hassle.",
  description:
    "Textbooks, gadgets, furniture and more from students near you. List an item in under a minute and chat with buyers directly on WhatsApp.",
  cta: { href: "/login?mode=signup", label: "Start selling" },
  proof: ["No fees", "Chat with voice notes", "Confirmed sales"],
  features: [
    { icon: Camera, title: "Up to 5 photos per listing", text: "Show every angle with a photo gallery. The first photo becomes the cover." },
    { icon: MessagesSquare, title: "Built-in chat", text: "Message sellers inside CampusMart with text, photos and voice notes. WhatsApp still works too." },
    { icon: BadgeCheck, title: "Confirmed sales", text: "Sellers mark who bought an item and the buyer confirms they received it, so every sale is on record." },
    { icon: Search, title: "Smart search", text: "Full-text search across titles and descriptions, with category, condition and price filters." },
    { icon: ChartColumn, title: "Seller dashboard", text: "Track active and sold listings, edit details and see which sales are confirmed." },
    { icon: Share2, title: "Share and discover", text: "Share any listing to your group chats and browse similar items on every page." },
  ],
  steps: [
    ["Browse or search", "Find what you need from students on your campus."],
    ["Message the seller", "Tap to chat on WhatsApp and agree on a price."],
    ["Meet and swap", "Meet somewhere safe on campus. Sellers mark the item as sold."],
  ] as [string, string][],
  closing: "Your next textbook is probably one hostel away.",
  nav: [
    { href: "/", label: "Browse", public: true },
    { href: "/messages", label: "Messages" },
    { href: "/me", label: "My listings" },
    { href: "/new", label: "Sell an item" },
  ] as { href: string; label: string; public?: boolean }[],
  width: "max-w-6xl",
  repo: "https://github.com/Aymikun19/campus-mart",
  preview: null as string | null,
};
