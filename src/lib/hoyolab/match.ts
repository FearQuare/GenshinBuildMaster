import type { CharacterSummary } from "./types";

// Matches HoYoLAB's roster to our characters (data/characters.json). HoYoLAB uses
// numeric ids and we use slugs, so regular characters match by name (case, spaces and
// punctuation ignored). The Traveler is one HoYoLAB entry but one row per element here
// (traveler-anemo …), so it matches by its current element.

const TRAVELER_IDS = new Set([10000005, 10000007]);

type OurCharacter = { id: string; name: string };

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function matchCharacters(
  roster: CharacterSummary[],
  ours: OurCharacter[],
): { ids: string[]; unmatched: string[] } {
  const byName = new Map(ours.map((c) => [normalize(c.name), c.id]));
  const ourIds = new Set(ours.map((c) => c.id));
  const ids = new Set<string>();
  const unmatched: string[] = [];

  for (const character of roster) {
    const id = TRAVELER_IDS.has(character.id)
      ? character.element && `traveler-${character.element.toLowerCase()}`
      : byName.get(normalize(character.name));
    if (id && ourIds.has(id)) ids.add(id);
    else unmatched.push(character.name);
  }
  return { ids: [...ids], unmatched };
}
