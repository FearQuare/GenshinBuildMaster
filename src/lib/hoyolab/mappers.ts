import type {
  CharacterBase,
  CharacterDetail,
  CharacterSummary,
  HoyolabElement,
  HoyolabWeaponType,
  RawCharacterBase,
  RawCharacterDetail,
  RawCharacterList,
  RawIndex,
  RawProperty,
  RawPropertyMapEntry,
  RawRelic,
  RawRelicProperty,
  RawWeaponDetail,
  RawWeaponSummary,
  ProfileStats,
  RelicStat,
  Stat,
  WeaponSummary,
} from "./types";

type PropertyMap = Record<string, RawPropertyMapEntry>;

const ELEMENTS: Record<string, HoyolabElement> = {
  pyro: "PYRO",
  hydro: "HYDRO",
  anemo: "ANEMO",
  electro: "ELECTRO",
  dendro: "DENDRO",
  cryo: "CRYO",
  geo: "GEO",
};

// HoYoLAB's numeric weapon type codes.
const WEAPON_TYPES: Record<number, HoyolabWeaponType> = {
  1: "SWORD",
  10: "CATALYST",
  11: "CLAYMORE",
  12: "BOW",
  13: "POLEARM",
};

function mapElement(element: string | undefined): HoyolabElement | null {
  return ELEMENTS[(element ?? "").toLowerCase()] ?? null;
}

function mapWeaponType(type: number | undefined): HoyolabWeaponType | null {
  return type === undefined ? null : (WEAPON_TYPES[type] ?? null);
}

// Stat names always come from the response's property_map, never from a hard-coded table.
function propertyName(propertyMap: PropertyMap, propertyType: number): string {
  const entry = propertyMap[String(propertyType)];
  return entry?.name || entry?.filter_name || `Property ${propertyType}`;
}

function wikiUrl(wiki: Record<string, string> | undefined, id: number): string | null {
  return wiki?.[String(id)] ?? null;
}

export function mapStat(raw: RawProperty, propertyMap: PropertyMap): Stat {
  const propertyType = raw.property_type ?? 0;
  return {
    propertyType,
    name: propertyName(propertyMap, propertyType),
    base: raw.base ?? "",
    add: raw.add ?? "",
    final: raw.final ?? "",
  };
}

function mapStats(raw: RawProperty[] | undefined, propertyMap: PropertyMap): Stat[] {
  return (raw ?? []).map((stat) => mapStat(stat, propertyMap));
}

function mapRelicStat(raw: RawRelicProperty, propertyMap: PropertyMap): RelicStat {
  const propertyType = raw.property_type ?? 0;
  return {
    propertyType,
    name: propertyName(propertyMap, propertyType),
    value: raw.value ?? "",
    rolls: raw.times ?? 0,
  };
}

function mapCharacterBase(raw: RawCharacterBase): CharacterBase {
  return {
    id: raw.id ?? 0,
    name: raw.name ?? "",
    element: mapElement(raw.element),
    level: raw.level ?? 0,
    rarity: raw.rarity ?? 0,
    friendship: raw.fetter ?? 0,
    constellation: raw.actived_constellation_num ?? 0,
    weaponType: mapWeaponType(raw.weapon_type),
    icon: raw.icon ?? "",
    image: raw.image ?? "",
    sideIcon: raw.side_icon ?? "",
  };
}

export function mapWeaponSummary(raw: RawWeaponSummary): WeaponSummary {
  return {
    id: raw.id ?? 0,
    name: raw.name ?? "",
    icon: raw.icon ?? "",
    type: mapWeaponType(raw.type),
    rarity: raw.rarity ?? 0,
    level: raw.level ?? 0,
    refinement: raw.affix_level ?? 0,
  };
}

export function mapCharacterList(raw: RawCharacterList | null): CharacterSummary[] {
  return (raw?.list ?? []).map((item) => ({
    ...mapCharacterBase(item),
    isChosen: item.is_chosen ?? false,
    weapon: item.weapon ? mapWeaponSummary(item.weapon) : null,
  }));
}

function mapWeapon(
  raw: RawWeaponDetail,
  propertyMap: PropertyMap,
  wiki: Record<string, string> | undefined,
) {
  const summary = mapWeaponSummary(raw);
  return {
    ...summary,
    ascension: raw.promote_level ?? 0,
    description: raw.desc ?? "",
    mainStat: raw.main_property ? mapStat(raw.main_property, propertyMap) : null,
    subStat: raw.sub_property ? mapStat(raw.sub_property, propertyMap) : null,
    wikiUrl: wikiUrl(wiki, summary.id),
  };
}

function mapRelic(
  raw: RawRelic,
  propertyMap: PropertyMap,
  wiki: Record<string, string> | undefined,
) {
  const id = raw.id ?? 0;
  return {
    id,
    name: raw.name ?? "",
    icon: raw.icon ?? "",
    slot: raw.pos ?? 0,
    slotName: raw.pos_name ?? "",
    rarity: raw.rarity ?? 0,
    level: raw.level ?? 0,
    set: { id: raw.set?.id ?? 0, name: raw.set?.name ?? "" },
    mainStat: raw.main_property ? mapRelicStat(raw.main_property, propertyMap) : null,
    subStats: (raw.sub_property_list ?? []).map((stat) => mapRelicStat(stat, propertyMap)),
    wikiUrl: wikiUrl(wiki, id),
  };
}

// Maps a character/detail response for one character. Returns null when the list is empty.
export function mapCharacterDetail(raw: RawCharacterDetail | null): CharacterDetail | null {
  const item = raw?.list?.[0];
  if (!raw || !item) return null;
  const propertyMap = raw.property_map ?? {};
  const base = mapCharacterBase(item.base ?? {});

  return {
    character: { ...base, wikiUrl: wikiUrl(raw.avatar_wiki, base.id) },
    weapon: item.weapon ? mapWeapon(item.weapon, propertyMap, raw.weapon_wiki) : null,
    relics: (item.relics ?? [])
      .map((relic) => mapRelic(relic, propertyMap, raw.relic_wiki))
      .sort((a, b) => a.slot - b.slot),
    constellations: (item.constellations ?? [])
      .map((c) => ({
        id: c.id ?? 0,
        name: c.name ?? "",
        icon: c.icon ?? "",
        effect: c.effect ?? "",
        unlocked: c.is_actived ?? false,
        position: c.pos ?? 0,
      }))
      .sort((a, b) => a.position - b.position),
    skills: (item.skills ?? []).map((s) => ({
      id: s.skill_id ?? 0,
      type: s.skill_type ?? 0,
      name: s.name ?? "",
      description: s.desc ?? "",
      icon: s.icon ?? "",
      level: s.level ?? 0,
      unlocked: s.is_unlock ?? false,
    })),
    stats: {
      base: mapStats(item.base_properties, propertyMap),
      selected: mapStats(item.selected_properties, propertyMap),
      extra: mapStats(item.extra_properties, propertyMap),
      element: mapStats(item.element_properties, propertyMap),
    },
    costumes: (item.costumes ?? []).map((c) => ({
      id: c.id ?? 0,
      name: c.name ?? "",
      icon: c.icon ?? "",
    })),
  };
}

// The profile card numbers from genshin/api/index.
export function mapProfileStats(raw: RawIndex | null): ProfileStats {
  const stats = raw?.stats ?? {};
  const abyss = stats.spiral_abyss?.trim();
  const theater = stats.role_combat;
  const stygian = stats.hard_challenge;
  return {
    achievements: stats.achievement_number ?? 0,
    characters: stats.avatar_number ?? 0,
    spiralAbyss: abyss && abyss !== "-" ? abyss : null,
    theaterAct:
      theater?.is_unlock && theater.has_data && theater.max_round_id ? theater.max_round_id : null,
    stygian:
      stygian?.is_unlock && stygian.has_data && stygian.difficulty
        ? { difficulty: stygian.difficulty, name: stygian.name ?? "" }
        : null,
  };
}

// In-game profile picture, falling back to the HoYoLAB avatar.
export function mapAvatarUrl(raw: RawIndex | null, hoyolabAvatar: string): string {
  return raw?.role?.game_head_icon || hoyolabAvatar || raw?.role?.AvatarUrl || "";
}
