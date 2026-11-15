import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "CampusMart", description: "Buy and sell within your campus." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold"><span className="text-accent">Campus</span>Mart</Link>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/me" className="text-stone-600 hover:text-stone-900">My listings</Link>
              <Link href="/new" className="btn !py-1.5">+ Sell</Link>
            </div>
          </nav>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
