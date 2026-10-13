import { characterIconSrc } from "@/lib/character-icon";
import { db } from "@/lib/db";
import { slugMatcher } from "@/lib/hoyolab/match";
import { getRoster } from "@/lib/hoyolab/service";
import type { HoyolabElement } from "@/lib/hoyolab/types";

// The signed-in user's characters as HoYoLAB reports them (only those have build data),
// keyed by our slug for readable URLs (/character-details/hu-tao). A character newer than
// data/characters.json falls back to its HoYoLAB id and HoYoLAB's icon.

export type OwnedCharacter = {
  slug: string;
  hoyolabId: number;
  name: string;
  element: HoyolabElement | null;
  rarity: number;
  level: number;
  constellation: number;
  icon: string;
};

export async function loadOwnedCharacters(): Promise<OwnedCharacter[]> {
  const [{ characters }, ours] = await Promise.all([
    getRoster(),
    db.character.findMany({ select: { id: true, name: true } }),
  ]);
  const slugFor = slugMatcher(ours);
  return characters.map((c) => {
    const slug = slugFor(c);
    return {
      slug: slug ?? String(c.id),
      hoyolabId: c.id,
      name: c.name,
      element: c.element,
      rarity: c.rarity,
      level: c.level,
      constellation: c.constellation,
      icon: slug ? characterIconSrc(slug) : c.icon,
    };
  });
}
