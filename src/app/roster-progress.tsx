"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { characterIconSrc } from "@/lib/character-icon";
import type { OwnedEntry } from "@/lib/roster-file";
import { useRoster } from "@/lib/use-roster";

type CharacterLite = { id: string; name: string; rarity: number };

// "Your progress" on the landing page. A client component so guests' rosters (local
// storage) show up too; `serverOwned` is null for guests.
export function RosterProgress({
  characters,
  serverOwned,
}: {
  characters: CharacterLite[];
  serverOwned: OwnedEntry[] | null;
}) {
  const { entries, ready } = useRoster(serverOwned);
  const byId = useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters]);

  const owned = entries.filter((e) => byId.has(e.id));
  const recent = [...owned]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, 14)
    .map((e) => byId.get(e.id)!);
  const total = characters.length;
  const progress = total ? owned.length / total : 0;

  return (
    <div className="flex flex-col gap-6 rounded-card border border-line bg-panel p-6 sm:p-8">
      <h2 className="text-3xl text-text-strong sm:text-4xl">Your progress</h2>
      <p className="font-mono tabular-nums">
        <span className="text-6xl text-text-strong">{ready ? owned.length : "··"}</span>
        <span className="text-xl text-muted"> / {total} characters</span>
      </p>
      <div className="h-1.5 overflow-hidden bg-deep">
        <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {recent.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2" aria-label="Recently added characters">
          {recent.map((c) => (
            <li
              key={c.id}
              className={`aspect-square overflow-hidden rounded-[6px] ${c.rarity === 5 ? "bg-rarity-5-tile" : "bg-rarity-4-tile"}`}
            >
              <Image src={characterIconSrc(c.id)} alt={c.name} title={c.name} width={56} height={56} className="size-full" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text">
          Nothing synced yet. Mark the characters you own and they&rsquo;ll show up here.
        </p>
      )}

      <Link
        href="/characters"
        className="mt-auto inline-flex h-11 w-fit items-center whitespace-nowrap rounded-card border-[1.5px] border-accent px-4 text-text-strong transition-colors duration-(--dur-micro) hover:bg-deep active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {owned.length > 0 ? "Update your roster" : "Start your roster"}
      </Link>
    </div>
  );
}
