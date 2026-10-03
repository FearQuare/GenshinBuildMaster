"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Add new sections here as they ship.
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/characters", label: "Characters" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-(--z-sticky) border-b border-line bg-bg/90 backdrop-blur-sm">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-sm font-semibold text-text-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >
          <span aria-hidden className="text-accent">&gt;</span>
          GBM
          <span className="sr-only">Genshin Build Master, home</span>
        </Link>

        <ul className="flex items-center gap-1 sm:gap-2">
          {LINKS.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-14 items-center whitespace-nowrap px-3 text-base transition-colors duration-(--dur-micro) focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-focus ${
                    active ? "text-text-strong" : "text-muted hover:text-text"
                  }`}
                >
                  {label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-3 bottom-0 h-0.5 bg-accent transition-transform duration-(--dur-short) ease-out ${
                      active ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <span aria-hidden className="caret ml-auto font-mono text-accent">▮</span>
      </nav>
    </header>
  );
}
