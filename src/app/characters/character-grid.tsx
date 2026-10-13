"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Character } from "@/generated/prisma/client";
import { Element, WeaponType } from "@/generated/prisma/enums";
import { characterIconSrc } from "@/lib/character-icon";
import { ELEMENT_COLOR } from "@/lib/elements";
import type { OwnedEntry } from "@/lib/roster-file";
import { useRoster } from "@/lib/use-roster";
import { RosterFileTools } from "./roster-file-tools";

type Ownership = "all" | "owned" | "missing";

const OWNERSHIP_OPTIONS: { value: Ownership; label: string }[] = [
  { value: "all", label: "All" },
  { value: "owned", label: "Owned" },
  { value: "missing", label: "Missing" },
];

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

// `serverOwned` is the signed-in user's roster, or null for a guest (local storage).
export function CharacterGrid({
  characters,
  serverOwned,
}: {
  characters: Character[];
  serverOwned: OwnedEntry[] | null;
}) {
  const [query, setQuery] = useState("");
  const [element, setElement] = useState<Element | null>(null);
  const [weapon, setWeapon] = useState<WeaponType | null>(null);
  const [ownership, setOwnership] = useState<Ownership>("all");
  const roster = useRoster(serverOwned);
  const { owned, error } = roster;

  function toggle(character: Character) {
    roster.setOwned(character.id, !owned.has(character.id), character.name);
  }

  const filtersActive = query !== "" || element !== null || weapon !== null || ownership !== "all";

  function clearFilters() {
    setQuery("");
    setElement(null);
    setWeapon(null);
    setOwnership("all");
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return characters.filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q)) &&
        (!element || c.element === element) &&
        (!weapon || c.weaponType === weapon) &&
        (ownership === "all" || owned.has(c.id) === (ownership === "owned")),
    );
  }, [characters, query, element, weapon, ownership, owned]);

  const fiveStars = characters.filter((c) => c.rarity === 5).length;
  const progress = characters.length ? owned.size / characters.length : 0;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      <section
        aria-label="Roster summary"
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <p className="font-mono tabular-nums" aria-live="polite">
          <span className="text-5xl text-text-strong sm:text-6xl">{roster.ready ? owned.size : "··"}</span>
          <span className="text-lg text-muted"> / {characters.length} owned</span>
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-72">
          <p className="flex flex-wrap justify-between gap-x-3 font-mono text-xs text-muted tabular-nums">
            <span className="whitespace-nowrap">
              <span className="text-rarity-5">★5</span> {fiveStars}
            </span>
            <span className="whitespace-nowrap">
              <span className="text-rarity-4">★4</span> {characters.length - fiveStars}
            </span>
            <span className="whitespace-nowrap text-text">{Math.round(progress * 100)}% synced</span>
          </p>
          <div className="h-1.5 overflow-hidden bg-deep" aria-hidden>
            <div
              className="h-full origin-left bg-accent transition-transform duration-(--dur-short) ease-out"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        </div>
      </section>

      <RosterFileTools roster={roster} characters={characters} />

      <section
        aria-label="Filters"
        className="grid gap-4 rounded-card border border-line bg-panel p-4 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center sm:gap-x-6 sm:p-5"
      >
        <FilterLabel htmlFor="character-search">Search</FilterLabel>
        <div className="flex gap-3">
          <input
            id="character-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hu Tao, Lumine…"
            autoComplete="off"
            className={`h-11 min-w-0 flex-1 rounded-card border border-line bg-bg px-3 font-mono text-sm text-text-strong placeholder:text-muted hover:bg-panel-2 ${FOCUS_RING} focus-visible:outline-offset-1`}
          />
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className={`h-11 shrink-0 whitespace-nowrap rounded-card px-3 text-sm text-muted transition-colors duration-(--dur-micro) hover:text-text active:translate-y-px ${FOCUS_RING}`}
            >
              Clear filters
            </button>
          )}
        </div>

        <FilterLabel>Element</FilterLabel>
        <ChipGroup label="Element">
          {Object.values(Element).map((el) => (
            <Chip
              key={el}
              active={element === el}
              onClick={() => setElement(element === el ? null : el)}
            >
              <span
                aria-hidden
                className="size-2 rounded-[2px]"
                style={{ background: ELEMENT_COLOR[el] }}
              />
              {titleCase(el)}
            </Chip>
          ))}
        </ChipGroup>

        <FilterLabel>Weapon</FilterLabel>
        <ChipGroup label="Weapon">
          {Object.values(WeaponType).map((wt) => (
            <Chip
              key={wt}
              active={weapon === wt}
              onClick={() => setWeapon(weapon === wt ? null : wt)}
            >
              {titleCase(wt)}
            </Chip>
          ))}
        </ChipGroup>

        <FilterLabel>Show</FilterLabel>
        <div
          role="group"
          aria-label="Ownership"
          className="inline-flex w-fit rounded-card border border-line p-0.5"
        >
          {OWNERSHIP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={ownership === opt.value}
              onClick={() => setOwnership(opt.value)}
              className={`whitespace-nowrap rounded-[6px] px-4 py-2 text-sm transition-colors duration-(--dur-micro) pointer-coarse:py-2.5 ${FOCUS_RING} ${
                ownership === opt.value
                  ? "bg-accent text-accent-ink"
                  : "text-muted hover:text-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-card border border-accent bg-deep px-4 py-3 font-mono text-sm text-text-strong"
        >
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line-strong px-6 py-12">
          <p className="text-xl text-text-strong">No characters match these filters.</p>
          <p className="text-text">Try a different name, or widen the element and weapon filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className={`mt-1 h-11 whitespace-nowrap rounded-card border-[1.5px] border-accent px-4 text-text-strong transition-colors duration-(--dur-micro) hover:bg-deep active:translate-y-px ${FOCUS_RING}`}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,8.5rem),1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] sm:gap-3">
          {visible.map((c) => (
            <li key={c.id}>
              <CharacterCard
                character={c}
                owned={owned.has(c.id)}
                onToggle={() => toggle(c)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  const className =
    "font-mono text-xs text-muted -mb-2 sm:mb-0";
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ) : (
    <span aria-hidden className={className}>
      {children}
    </span>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-[6px] border px-3 py-2 text-sm transition-colors duration-(--dur-micro) active:translate-y-px pointer-coarse:py-2.5 ${FOCUS_RING} ${
        active
          ? "border-accent bg-deep text-text-strong"
          : "border-line text-muted hover:border-line-strong hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function CharacterCard({
  character,
  owned,
  onToggle,
}: {
  character: Character;
  owned: boolean;
  onToggle: () => void;
}) {
  const color = ELEMENT_COLOR[character.element];
  const rarityColor =
    character.rarity === 5 ? "var(--color-rarity-5)" : "var(--color-rarity-4)";

  return (
    <button
      type="button"
      aria-pressed={owned}
      title={character.name}
      onClick={onToggle}
      className={`flex h-48 w-full flex-col rounded-card border p-4 text-left transition-[background-color,border-color] duration-(--dur-short) ease-out active:translate-y-px ${FOCUS_RING} ${
        owned
          ? "jolt border-accent bg-panel-2"
          : "border-line bg-panel hover:border-line-strong"
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          className={`size-14 shrink-0 overflow-hidden rounded-[6px] transition-opacity duration-(--dur-short) ${
            character.rarity === 5 ? "bg-rarity-5-tile" : "bg-rarity-4-tile"
          } ${owned ? "" : "opacity-60 saturate-[.35]"}`}
        >
          <Image
            src={characterIconSrc(character.id)}
            alt=""
            width={56}
            height={56}
            className="size-full object-cover"
          />
        </span>
        <span
          aria-hidden
          className={`grid size-5 shrink-0 place-items-center rounded-sm border transition-colors duration-(--dur-micro) ${
            owned
              ? "border-accent bg-accent text-accent-ink"
              : "border-line-strong text-transparent"
          }`}
        >
          <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>

      {/* Name always reserves two lines so every card is the same height. */}
      <span
        className={`mt-2.5 line-clamp-2 h-[2lh] text-base leading-snug ${
          owned ? "text-text-strong" : "text-muted"
        }`}
      >
        {character.name}
      </span>

      <span className="mt-auto flex flex-col gap-1 font-mono text-[11px] uppercase tracking-wider">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="size-2 shrink-0 rounded-[2px]" style={{ background: color }} />
          <span className="truncate font-semibold" style={{ color }}>
            {character.element}
          </span>
        </span>
        <span className="font-sans text-xs leading-none tracking-[0.15em]" style={{ color: rarityColor }}>
          <span aria-hidden>{"★".repeat(character.rarity)}</span>
          <span className="sr-only">{character.rarity}-star</span>
        </span>
        <span className="text-muted">{character.weaponType}</span>
      </span>
    </button>
  );
}
