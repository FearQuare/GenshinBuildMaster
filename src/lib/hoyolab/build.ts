import type { CharacterDetail, Relic } from "./types";

// Derived numbers for the Character Details card. Pure, so they're unit-tested.

// HoYoLAB property types for crit. Stable game ids, unlike the display names (which
// always come from property_map).
const CRIT_RATE = 20;
const CRIT_DMG = 22;

function percent(value: string): number {
  const n = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Active artifact set bonuses: 4-piece first, then 2-piece, e.g. 4pc Crimson Witch.
export function setBonuses(relics: Relic[]): { id: number; name: string; pieces: 2 | 4 }[] {
  const counts = new Map<number, { name: string; count: number }>();
  for (const { set } of relics) {
    const entry = counts.get(set.id) ?? { name: set.name, count: 0 };
    entry.count++;
    counts.set(set.id, entry);
  }
  return [...counts]
    .filter(([, { count }]) => count >= 2)
    .map(([id, { name, count }]) => ({ id, name, pieces: (count >= 4 ? 4 : 2) as 2 | 4 }))
    .sort((a, b) => b.pieces - a.pieces || a.name.localeCompare(b.name));
}

// Crit Value of the artifact substats: 2 × CRIT Rate + CRIT DMG. Main stats are left
// out, as most players count it.
export function critValue(relics: Relic[]): number {
  let total = 0;
  for (const relic of relics) {
    for (const stat of relic.subStats) {
      if (stat.propertyType === CRIT_RATE) total += 2 * percent(stat.value);
      else if (stat.propertyType === CRIT_DMG) total += percent(stat.value);
    }
  }
  return Math.round(total * 10) / 10;
}

// The combat talents (Normal Attack, Skill, Burst), skipping passives and alternate
// sprints, which HoYoLAB lists as combat talents stuck at level 1.
export function combatTalents(detail: CharacterDetail) {
  const combat = detail.skills.filter((s) => s.type === 1);
  return combat.length > 3 ? combat.filter((s) => s.level > 1).slice(0, 3) : combat;
}
