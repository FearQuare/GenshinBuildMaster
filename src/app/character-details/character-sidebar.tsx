"use client";

import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { useState } from "react";
import { RemoteImage } from "@/components/remote-image";
import { elementColor } from "@/lib/elements";
import type { OwnedCharacter } from "./data";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

// The signed-in user's characters. A scrolling strip on phones, a sticky list on desktop.
export function CharacterSidebar({ characters }: { characters: OwnedCharacter[] }) {
  const segment = useSelectedLayoutSegment();
  const active = segment ? decodeURIComponent(segment) : null;
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q ? characters.filter((c) => c.name.toLowerCase().includes(q)) : characters;

  return (
    <aside
      aria-label="Your characters"
      className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-[calc(3.5rem+env(safe-area-inset-top)+1.5rem)] lg:max-h-[calc(100dvh-3.5rem-env(safe-area-inset-top)-3rem)] lg:self-start"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-mono text-xs tracking-wider text-muted uppercase">
          <span className="text-accent">&gt;</span> Your characters
        </h1>
        <span className="font-mono text-xs text-muted tabular-nums">{characters.length}</span>
      </div>

      <label htmlFor="sidebar-search" className="sr-only">
        Search your characters
      </label>
      <input
        id="sidebar-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        autoComplete="off"
        className={`h-10 w-full rounded-card border border-line bg-panel px-3 font-mono text-sm text-text-strong placeholder:text-muted hover:bg-panel-2 ${FOCUS_RING} focus-visible:outline-offset-1`}
      />

      {visible.length === 0 ? (
        <p className="px-1 py-4 text-sm text-muted">No characters match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-x-visible lg:overflow-y-auto lg:px-0 lg:pr-1 lg:pb-0">
          {visible.map((c) => (
            <li key={c.slug} className="shrink-0 lg:shrink">
              <SidebarLink character={c} active={c.slug === active} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function SidebarLink({ character: c, active }: { character: OwnedCharacter; active: boolean }) {
  const color = elementColor(c.element);
  return (
    <Link
      href={`/character-details/${encodeURIComponent(c.slug)}`}
      aria-current={active ? "page" : undefined}
      scroll={false}
      className={`group relative flex w-20 flex-col items-center gap-1.5 rounded-card border p-2 text-center transition-colors duration-(--dur-micro) lg:w-full lg:flex-row lg:gap-3 lg:text-left ${FOCUS_RING} ${
        active
          ? "border-accent bg-panel-2"
          : "border-transparent hover:border-line hover:bg-panel"
      }`}
    >
      <span
        className={`relative size-14 shrink-0 overflow-hidden rounded-[6px] lg:size-11 ${
          c.rarity === 5 ? "bg-rarity-5-tile" : "bg-rarity-4-tile"
        }`}
      >
        {c.icon.startsWith("/") ? (
          <Image src={c.icon} alt="" width={56} height={56} className="size-full object-cover" />
        ) : (
          <RemoteImage src={c.icon} className="size-full object-cover" />
        )}
        <span
          aria-hidden
          className="absolute right-0.5 bottom-0.5 size-2 rounded-[2px] ring-1 ring-bg"
          style={{ background: color }}
        />
      </span>
      <span className="flex w-full min-w-0 flex-col">
        <span className={`truncate text-xs lg:text-base ${active ? "text-text-strong" : "text-text"}`}>
          {c.name}
        </span>
        <span className="font-mono text-[10px] text-muted tabular-nums lg:text-xs">
          Lv {c.level} · C{c.constellation}
        </span>
      </span>
      <PendingBar />
    </Link>
  );
}

// A sweep under the link while its character loads.
function PendingBar() {
  const { pending } = useLinkStatus();
  return pending ? (
    <span aria-hidden className="skeleton absolute inset-x-2 bottom-0 h-0.5 bg-transparent" />
  ) : null;
}
