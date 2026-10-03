"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import type { Character } from "@/generated/prisma/client";
import { Element, WeaponType } from "@/generated/prisma/enums";
import { setOwned } from "./actions";

type Ownership = "all" | "owned" | "missing";

const ELEMENT_COLOR: Record<Element, string> = {
  PYRO: "var(--color-pyro)",
  HYDRO: "var(--color-hydro)",
  ANEMO: "var(--color-anemo)",
  ELECTRO: "var(--color-electro)",
  DENDRO: "var(--color-dendro)",
  CRYO: "var(--color-cryo)",
  GEO: "var(--color-geo)",
};

const OWNERSHIP_OPTIONS: { value: Ownership; label: string }[] = [
  { value: "all", label: "All" },
  { value: "owned", label: "Owned" },
  { value: "missing", label: "Not owned" },
];

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function CharacterGrid({
  characters,
  ownedIds,
}: {
  characters: Character[];
  ownedIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [element, setElement] = useState<Element | null>(null);
  const [weapon, setWeapon] = useState<WeaponType | null>(null);
  const [ownership, setOwnership] = useState<Ownership>("all");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [owned, toggleOptimistic] = useOptimistic(
    new Set(ownedIds),
    (current, { id, value }: { id: string; value: boolean }) => {
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    },
  );

  function toggle(character: Character) {
    const value = !owned.has(character.id);
    setError(null);
    startTransition(async () => {
      toggleOptimistic({ id: character.id, value });
      try {
        await setOwned(character.id, value);
      } catch {
        setError(`Couldn't update ${character.name}. Try again.`);
      }
    });
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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            Roster
          </p>
          <h1 className="mt-2 text-4xl font-medium leading-tight sm:text-5xl">
            Your characters
          </h1>
          <p className="mt-3 max-w-prose text-muted">
            Tap a character to mark them as owned.
          </p>
        </div>
        <p className="font-mono text-sm text-muted" aria-live="polite">
          <span className="text-2xl font-semibold text-text">{owned.size}</span>
          {" / "}
          {characters.length} owned
        </p>
      </header>

      <section
        aria-label="Filters"
        className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:p-5"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          aria-label="Search by name"
          className="w-full rounded-card border border-border bg-bg px-3 py-2 text-text placeholder:text-muted focus-visible:border-primary focus-visible:outline-none"
        />
        <ChipRow label="Element">
          {Object.values(Element).map((el) => (
            <Chip
              key={el}
              active={element === el}
              onClick={() => setElement(element === el ? null : el)}
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: ELEMENT_COLOR[el] }}
              />
              {titleCase(el)}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label="Weapon">
          {Object.values(WeaponType).map((wt) => (
            <Chip
              key={wt}
              active={weapon === wt}
              onClick={() => setWeapon(weapon === wt ? null : wt)}
            >
              {titleCase(wt)}
            </Chip>
          ))}
        </ChipRow>
        <ChipRow label="Show">
          {OWNERSHIP_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={ownership === opt.value}
              onClick={() => setOwnership(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </ChipRow>
      </section>

      {error && (
        <p role="alert" className="rounded-card border border-accent px-4 py-3 text-sm text-primary">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-center text-muted">No characters match these filters.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10.5rem),1fr))] gap-3">
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

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-16 shrink-0 font-mono text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
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
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px ${
        active
          ? "border-primary bg-primary text-bg"
          : "border-border text-muted hover:border-muted hover:text-text"
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
      onClick={onToggle}
      className={`group relative flex h-full w-full flex-col gap-3 overflow-hidden rounded-card border bg-surface p-4 pl-5 text-left transition duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0 ${
        owned ? "border-primary" : "border-border hover:border-muted"
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-1 transition-opacity ${owned ? "opacity-100" : "opacity-40"}`}
        style={{ background: color }}
      />
      <span className="flex items-start justify-between gap-2">
        <span
          className={`min-w-0 font-medium leading-snug [overflow-wrap:anywhere] ${owned ? "text-text" : "text-muted group-hover:text-text"}`}
        >
          {character.name}
        </span>
        <span
          aria-hidden
          className={`grid size-5 shrink-0 place-items-center rounded-full border text-xs ${
            owned ? "border-primary bg-primary text-bg" : "border-border text-transparent"
          }`}
        >
          ✓
        </span>
      </span>
      <span className="mt-auto flex flex-col gap-1">
        <span className="text-xs tracking-widest" style={{ color: rarityColor }}>
          <span aria-hidden>{"★".repeat(character.rarity)}</span>
          <span className="sr-only">{character.rarity}-star</span>
        </span>
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
          <span style={{ color }}>{character.element}</span> · {character.weaponType}
        </span>
      </span>
    </button>
  );
}
