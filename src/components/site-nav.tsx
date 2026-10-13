"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { GenshinAccount } from "@/lib/hoyolab/types";
import { DataSync } from "./data-sync";

// Add new sections here as they ship.
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/characters", label: "Characters" },
  { href: "/character-details", label: "Character Details" },
] as const;

// `account` is the signed-in HoYoLAB account (from the root layout), or null for guests.
export function SiteNav({ account }: { account: GenshinAccount | null }) {
  const pathname = usePathname();

  return (
    // Safari 26 paints the strip behind its translucent top bar with the background-color
    // of the full-width fixed/sticky element at the top edge. Keep this header opaque,
    // edge to edge, and above every other fixed layer so Safari samples it.
    <header className="sticky top-0 z-(--z-sticky) border-b border-line bg-bg pt-[env(safe-area-inset-top)]">
      <nav
        aria-label="Main"
        // Phones: logo + Data Sync on the first row, the links in a scrollable second row.
        className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 px-4 sm:flex-nowrap sm:px-6"
      >
        <Link
          href="/"
          className="flex h-14 shrink-0 items-center gap-2 whitespace-nowrap font-mono text-sm font-semibold text-text-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >
          <span aria-hidden className="text-accent">&gt;</span>
          GBM
          <span className="sr-only">Genshin Build Master, home</span>
        </Link>

        <ul className="order-last -mx-4 flex w-[calc(100%+2rem)] items-center overflow-x-auto border-t border-line px-2 sm:order-none sm:mx-0 sm:w-auto sm:gap-2 sm:overflow-visible sm:border-t-0 sm:px-0">
          {LINKS.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-11 items-center whitespace-nowrap px-2 text-base sm:h-14 sm:px-3 transition-colors duration-(--dur-micro) focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-focus ${
                    active ? "text-text-strong" : "text-muted hover:text-text"
                  }`}
                >
                  {label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-2 bottom-0 h-0.5 sm:inset-x-3 bg-accent transition-transform duration-(--dur-short) ease-out ${
                      active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <DataSync account={account} />
      </nav>
    </header>
  );
}
