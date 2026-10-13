import assert from "node:assert/strict";
import { test } from "node:test";
import characterDetail from "./__fixtures__/character-detail.json";
import characterList from "./__fixtures__/character-list.json";
import index from "./__fixtures__/index.json";
import { mapAvatarUrl, mapCharacterDetail, mapCharacterList, mapProfileStats } from "./mappers";

// Fixtures are hand-written in the shape of real HoYoLAB responses. They hold no real
// account data or tokens.

test("mapCharacterList maps roster entries", () => {
  const [huTao, bennett] = mapCharacterList(characterList.data);

  assert.deepEqual(huTao, {
    id: 10000046,
    name: "Hu Tao",
    element: "PYRO",
    level: 90,
    rarity: 5,
    friendship: 10,
    constellation: 1,
    weaponType: "POLEARM",
    icon: "https://example.invalid/icons/hu-tao.png",
    image: "https://example.invalid/images/hu-tao.png",
    sideIcon: "https://example.invalid/side/hu-tao.png",
    isChosen: true,
    weapon: {
      id: 13501,
      name: "Staff of Homa",
      icon: "https://example.invalid/weapons/homa.png",
      type: "POLEARM",
      rarity: 5,
      level: 90,
      refinement: 1,
    },
  });
  assert.equal(bennett.weaponType, "SWORD");
  assert.equal(bennett.weapon?.refinement, 5);
  assert.equal(bennett.icon, "");
});

test("mapCharacterList leaves unknown elements and weapon types null", () => {
  const unknown = mapCharacterList(characterList.data)[2];
  assert.equal(unknown.element, null);
  assert.equal(unknown.weaponType, null);
  assert.equal(unknown.weapon, null);
});

test("mapCharacterList handles missing data", () => {
  assert.deepEqual(mapCharacterList(null), []);
  assert.deepEqual(mapCharacterList({}), []);
});

test("mapCharacterDetail maps character, weapon and wiki links", () => {
  const detail = mapCharacterDetail(characterDetail.data);
  assert.ok(detail);

  assert.equal(detail.character.name, "Hu Tao");
  assert.equal(detail.character.wikiUrl, "https://wiki.hoyolab.com/pc/genshin/entry/example-hu-tao");
  assert.deepEqual(detail.weapon, {
    id: 13501,
    name: "Staff of Homa",
    icon: "https://example.invalid/weapons/homa.png",
    type: "POLEARM",
    rarity: 5,
    level: 90,
    refinement: 1,
    ascension: 6,
    description: "A firestaff once used in ritual.",
    mainStat: { propertyType: 2001, name: "ATK", base: "608", add: "", final: "608" },
    subStat: { propertyType: 22, name: "CRIT DMG", base: "66.2%", add: "", final: "66.2%" },
    wikiUrl: "https://wiki.hoyolab.com/pc/genshin/entry/example-homa",
  });
  assert.deepEqual(detail.costumes, [
    { id: 204601, name: "Cherries Snow-Laden", icon: "https://example.invalid/costumes/hu-tao.png" },
  ]);
});

test("mapCharacterDetail sorts relics by slot and names stats from property_map", () => {
  const detail = mapCharacterDetail(characterDetail.data);
  assert.ok(detail);

  assert.deepEqual(
    detail.relics.map((r) => r.slotName),
    ["Flower of Life", "Circlet of Logos"],
  );
  const circlet = detail.relics[1];
  assert.deepEqual(circlet.set, { id: 15006, name: "Crimson Witch of Flames" });
  assert.deepEqual(circlet.mainStat, { propertyType: 22, name: "CRIT DMG", value: "62.2%", rolls: 0 });
  assert.deepEqual(circlet.subStats, [
    { propertyType: 20, name: "CRIT Rate", value: "10.5%", rolls: 2 },
    { propertyType: 2000, name: "Max HP", value: "538", rolls: 1 },
  ]);
  assert.equal(circlet.wikiUrl, "https://wiki.hoyolab.com/pc/genshin/entry/example-cw");
  assert.equal(detail.relics[0].wikiUrl, null);
});

test("mapCharacterDetail maps constellations, talents and stats", () => {
  const detail = mapCharacterDetail(characterDetail.data);
  assert.ok(detail);

  assert.deepEqual(
    detail.constellations.map((c) => [c.position, c.unlocked]),
    [
      [1, true],
      [2, false],
    ],
  );
  assert.deepEqual(
    detail.skills.map((s) => [s.name, s.type, s.level]),
    [
      ["Secret Spear of Wangsheng", 1, 10],
      ["Guide to Afterlife", 1, 13],
      ["Flutter By", 2, 1],
    ],
  );
  assert.deepEqual(detail.stats.selected[1], {
    propertyType: 20,
    name: "CRIT Rate",
    base: "5.0%",
    add: "",
    final: "70.4%",
  });
  assert.equal(detail.stats.element[0].name, "Pyro DMG Bonus");
  assert.deepEqual(detail.stats.extra, []);
});

test("mapCharacterDetail falls back for property types missing from property_map", () => {
  const detail = mapCharacterDetail({
    list: [{ base: { id: 1 }, base_properties: [{ property_type: 9999, final: "1" }] }],
    property_map: {},
  });
  assert.equal(detail?.stats.base[0].name, "Property 9999");
});

test("mapCharacterDetail returns null for an empty list", () => {
  assert.equal(mapCharacterDetail({ list: [] }), null);
  assert.equal(mapCharacterDetail(null), null);
});

test("mapProfileStats reads the profile card numbers from index", () => {
  assert.deepEqual(mapProfileStats(index.data), {
    achievements: 1234,
    characters: 98,
    spiralAbyss: "12-3",
    theaterAct: 10,
    stygian: { difficulty: 5, name: "Fearless" },
  });
});

test("mapProfileStats returns null for modes without a run", () => {
  const stats = mapProfileStats({
    stats: {
      spiral_abyss: "-",
      role_combat: { is_unlock: true, has_data: false, max_round_id: 0 },
      hard_challenge: { is_unlock: false, has_data: false, difficulty: 0, name: "" },
    },
  });
  assert.equal(stats.spiralAbyss, null);
  assert.equal(stats.theaterAct, null);
  assert.equal(stats.stygian, null);
  assert.deepEqual(mapProfileStats(null), {
    achievements: 0,
    characters: 0,
    spiralAbyss: null,
    theaterAct: null,
    stygian: null,
  });
});

test("mapAvatarUrl prefers the in-game picture, then the HoYoLAB avatar", () => {
  assert.equal(mapAvatarUrl(index.data, "https://example.invalid/bbs.png"), "https://example.invalid/game-head-icon.png");
  assert.equal(mapAvatarUrl({ role: {} }, "https://example.invalid/bbs.png"), "https://example.invalid/bbs.png");
  assert.equal(mapAvatarUrl(null, ""), "");
});
