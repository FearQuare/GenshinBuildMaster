import assert from "node:assert/strict";
import { test } from "node:test";
import characterDetail from "./__fixtures__/character-detail.json";
import { combatTalents, critValue, setBonuses } from "./build";
import { mapCharacterDetail } from "./mappers";
import type { Relic } from "./types";

function relic(setId: number, setName: string, subs: [number, string][] = []): Relic {
  return {
    id: 0, name: "", icon: "", slot: 1, slotName: "", rarity: 5, level: 20,
    set: { id: setId, name: setName },
    mainStat: null,
    subStats: subs.map(([propertyType, value]) => ({ propertyType, name: "", value, rolls: 0 })),
    wikiUrl: null,
  };
}

test("setBonuses finds 4-piece and 2-piece sets", () => {
  const cw = (n: number) => Array.from({ length: n }, () => relic(1, "Crimson Witch of Flames"));
  assert.deepEqual(setBonuses([...cw(4), relic(2, "Gladiator's Finale")]), [
    { id: 1, name: "Crimson Witch of Flames", pieces: 4 },
  ]);
  assert.deepEqual(
    setBonuses([...cw(2), relic(2, "Gladiator's Finale"), relic(2, "Gladiator's Finale"), relic(3, "Other")]),
    [
      { id: 1, name: "Crimson Witch of Flames", pieces: 2 },
      { id: 2, name: "Gladiator's Finale", pieces: 2 },
    ],
  );
  assert.deepEqual(setBonuses([]), []);
});

test("critValue doubles CRIT Rate substats and ignores other stats", () => {
  const relics = [
    relic(1, "A", [[20, "10.5%"], [22, "21.0%"], [2000, "538"]]),
    relic(1, "A", [[22, "7.8%"]]),
  ];
  assert.equal(critValue(relics), 49.8);
  assert.equal(critValue([]), 0);
});

test("combatTalents keeps Normal Attack, Skill and Burst", () => {
  const detail = mapCharacterDetail(characterDetail.data)!;
  assert.deepEqual(combatTalents(detail).map((s) => s.name), [
    "Secret Spear of Wangsheng",
    "Guide to Afterlife",
  ]);
  const withSprint = {
    ...detail,
    skills: [10, 1, 9, 13].map((level, i) => ({ ...detail.skills[0], id: i, level, type: 1 })),
  };
  assert.deepEqual(combatTalents(withSprint).map((s) => s.level), [10, 9, 13]);
});
