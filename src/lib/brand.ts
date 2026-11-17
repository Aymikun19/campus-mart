import { Camera, ChartColumn, MessageCircle, Search, Share2, SlidersHorizontal } from "lucide-react";

export const brand = {
  name: "CampusMart",
  short: "Buy and sell within your campus",
  eyebrow: "The student marketplace",
  tagline: "Buy and sell on campus, without the hassle.",
  description:
    "Textbooks, gadgets, furniture and more from students near you. List an item in under a minute and chat with buyers directly on WhatsApp.",
  cta: { href: "/login?mode=signup", label: "Start selling" },
  proof: ["No fees", "Meet on campus", "Chat on WhatsApp"],
  features: [
    { icon: Camera, title: "Photo listings", text: "Add a photo, price, condition and campus. Your listing is live straight away." },
    { icon: Search, title: "Smart search", text: "Full-text search across titles and descriptions, so 'csc textbook' finds what you mean." },
    { icon: SlidersHorizontal, title: "Filters and sorting", text: "Narrow by category and budget, then sort by newest or price." },
    { icon: MessageCircle, title: "WhatsApp contact", text: "Buyers message sellers with one tap. No new inbox to check." },
    { icon: ChartColumn, title: "Seller dashboard", text: "Track active and sold listings, edit details and mark items as sold." },
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
    { href: "/me", label: "My listings" },
    { href: "/new", label: "Sell an item" },
  ] as { href: string; label: string; public?: boolean }[],
  width: "max-w-6xl",
  repo: "https://github.com/Aymikun19/campus-mart",
  preview: null as string | null,
};
