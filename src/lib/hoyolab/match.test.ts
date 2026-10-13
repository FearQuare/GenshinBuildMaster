import assert from "node:assert/strict";
import { test } from "node:test";
import characterList from "./__fixtures__/character-list.json";
import { mapCharacterList } from "./mappers";
import { matchCharacters } from "./match";
import type { CharacterSummary } from "./types";

const OURS = [
  { id: "hu-tao", name: "Hu Tao" },
  { id: "bennett", name: "Bennett" },
  { id: "kamisato-ayaka", name: "Kamisato Ayaka" },
  { id: "traveler-anemo", name: "Lumine (Anemo)" },
  { id: "traveler-dendro", name: "Lumine (Dendro)" },
];

function summary(id: number, name: string, element: CharacterSummary["element"]): CharacterSummary {
  return { ...mapCharacterList({ list: [{ id, name }] })[0], element };
}

test("matchCharacters matches by name and reports the rest", () => {
  const { ids, unmatched } = matchCharacters(mapCharacterList(characterList.data), OURS);
  assert.deepEqual(ids, ["hu-tao", "bennett"]);
  assert.deepEqual(unmatched, ["Future Character"]);
});

test("matchCharacters ignores case, spaces and punctuation", () => {
  const { ids } = matchCharacters([summary(10000002, "kamisato  AYAKA", "CRYO")], OURS);
  assert.deepEqual(ids, ["kamisato-ayaka"]);
});

test("matchCharacters maps either Traveler to their current element", () => {
  assert.deepEqual(matchCharacters([summary(10000007, "Traveler", "DENDRO")], OURS).ids, ["traveler-dendro"]);
  assert.deepEqual(matchCharacters([summary(10000005, "Aether", "ANEMO")], OURS).ids, ["traveler-anemo"]);
  assert.deepEqual(matchCharacters([summary(10000005, "Aether", "GEO")], OURS).unmatched, ["Aether"]);
});
