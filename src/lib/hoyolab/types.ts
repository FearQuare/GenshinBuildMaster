// Shapes of the HoYoLAB Battle Chronicle responses (only the fields we read) and the
// app-side models the mappers turn them into. Raw fields are optional because HoYoLAB
// omits or nulls them freely; the mappers fill in defaults.

export const SERVERS = ["os_euro", "os_usa", "os_asia", "os_cht"] as const;
export type Server = (typeof SERVERS)[number];

export type Credentials = { ltuid: string; ltoken: string };

// The Genshin account a connection is bound to.
export type GenshinAccount = {
  hoyolabUid: string;
  roleId: string;
  server: Server;
  nickname: string;
  level: number;
  // In-game profile picture when HoYoLAB has one, else the HoYoLAB avatar.
  avatarUrl: string;
};

// ---------------------------------------------------------------- raw API

export type ApiEnvelope<T> = { retcode: number; message: string; data: T | null };

export type RawUserFullInfo = { user_info?: { uid?: string | number; avatar_url?: string } };

// genshin/api/index: the Battle Chronicle summary.
export type RawIndex = {
  role?: { nickname?: string; level?: number; AvatarUrl?: string; game_head_icon?: string };
  stats?: {
    achievement_number?: number;
    avatar_number?: number;
    // Deepest Spiral Abyss chamber this cycle, e.g. "12-3"; "-" when not attempted.
    spiral_abyss?: string;
    // Imaginarium Theater: best act reached this season.
    role_combat?: { is_unlock?: boolean; has_data?: boolean; max_round_id?: number };
    // Stygian Onslaught: best difficulty cleared this season.
    hard_challenge?: { is_unlock?: boolean; has_data?: boolean; difficulty?: number; name?: string };
  };
};

export type RawGameRecordCard = {
  list?: {
    game_id?: number;
    game_role_id?: string;
    region?: string;
    nickname?: string;
    level?: number;
  }[];
};

export type RawWeaponSummary = {
  id?: number;
  name?: string;
  icon?: string;
  type?: number;
  rarity?: number;
  level?: number;
  affix_level?: number;
};

export type RawCharacterBase = {
  id?: number;
  name?: string;
  element?: string;
  level?: number;
  rarity?: number;
  fetter?: number;
  actived_constellation_num?: number;
  weapon_type?: number;
  is_chosen?: boolean;
  icon?: string;
  image?: string;
  side_icon?: string;
};

export type RawCharacterListItem = RawCharacterBase & { weapon?: RawWeaponSummary };

export type RawCharacterList = { list?: RawCharacterListItem[] };

export type RawProperty = {
  property_type?: number;
  base?: string;
  add?: string;
  final?: string;
};

export type RawRelicProperty = { property_type?: number; value?: string; times?: number };

export type RawRelic = {
  id?: number;
  name?: string;
  icon?: string;
  pos?: number;
  pos_name?: string;
  rarity?: number;
  level?: number;
  set?: { id?: number; name?: string };
  main_property?: RawRelicProperty | null;
  sub_property_list?: RawRelicProperty[];
};

export type RawWeaponDetail = RawWeaponSummary & {
  type_name?: string;
  promote_level?: number;
  desc?: string;
  main_property?: RawProperty | null;
  sub_property?: RawProperty | null;
};

export type RawConstellation = {
  id?: number;
  name?: string;
  icon?: string;
  effect?: string;
  is_actived?: boolean;
  pos?: number;
};

export type RawSkill = {
  skill_id?: number;
  skill_type?: number;
  level?: number;
  name?: string;
  desc?: string;
  icon?: string;
  is_unlock?: boolean;
};

export type RawCostume = { id?: number; name?: string; icon?: string };

export type RawCharacterDetailItem = {
  base?: RawCharacterBase;
  weapon?: RawWeaponDetail;
  relics?: RawRelic[];
  constellations?: RawConstellation[];
  skills?: RawSkill[];
  base_properties?: RawProperty[];
  selected_properties?: RawProperty[];
  extra_properties?: RawProperty[];
  element_properties?: RawProperty[];
  costumes?: RawCostume[];
};

export type RawPropertyMapEntry = { property_type?: number; name?: string; filter_name?: string };

export type RawCharacterDetail = {
  list?: RawCharacterDetailItem[];
  property_map?: Record<string, RawPropertyMapEntry>;
  avatar_wiki?: Record<string, string>;
  weapon_wiki?: Record<string, string>;
  relic_wiki?: Record<string, string>;
};

// ---------------------------------------------------------------- app models

// The numbers on the Data Sync profile card. null = not unlocked or no run this season.
export type ProfileStats = {
  achievements: number;
  characters: number;
  spiralAbyss: string | null;
  theaterAct: number | null;
  stygian: { difficulty: number; name: string } | null;
};

export type Profile = { account: GenshinAccount; stats: ProfileStats };

// Result of ticking the HoYoLAB account's characters in the user's roster.
export type SyncResult = { added: number; matched: number; unmatched: string[] };

export type HoyolabElement =
  | "PYRO"
  | "HYDRO"
  | "ANEMO"
  | "ELECTRO"
  | "DENDRO"
  | "CRYO"
  | "GEO";

export type HoyolabWeaponType = "SWORD" | "CLAYMORE" | "POLEARM" | "BOW" | "CATALYST";

// A stat line. Values stay as HoYoLAB's display strings ("1,234", "62.2%").
export type Stat = {
  propertyType: number;
  name: string;
  base: string;
  add: string;
  final: string;
};

export type WeaponSummary = {
  id: number;
  name: string;
  icon: string;
  type: HoyolabWeaponType | null;
  rarity: number;
  level: number;
  refinement: number;
};

export type Weapon = WeaponSummary & {
  ascension: number;
  description: string;
  mainStat: Stat | null;
  subStat: Stat | null;
  wikiUrl: string | null;
};

export type RelicStat = { propertyType: number; name: string; value: string; rolls: number };

export type Relic = {
  id: number;
  name: string;
  icon: string;
  slot: number;
  slotName: string;
  rarity: number;
  level: number;
  set: { id: number; name: string };
  mainStat: RelicStat | null;
  subStats: RelicStat[];
  wikiUrl: string | null;
};

export type CharacterBase = {
  id: number;
  name: string;
  element: HoyolabElement | null;
  level: number;
  rarity: number;
  friendship: number;
  constellation: number;
  weaponType: HoyolabWeaponType | null;
  icon: string;
  image: string;
  sideIcon: string;
};

export type CharacterSummary = CharacterBase & { isChosen: boolean; weapon: WeaponSummary | null };

export type Constellation = {
  id: number;
  name: string;
  icon: string;
  effect: string;
  unlocked: boolean;
  position: number;
};

export type Skill = {
  id: number;
  // HoYoLAB's skill_type: 1 = combat talent (normal, skill, burst), 2 = passive.
  type: number;
  name: string;
  description: string;
  icon: string;
  level: number;
  unlocked: boolean;
};

export type CharacterDetail = {
  character: CharacterBase & { wikiUrl: string | null };
  weapon: Weapon | null;
  relics: Relic[];
  constellations: Constellation[];
  skills: Skill[];
  stats: { base: Stat[]; selected: Stat[]; extra: Stat[]; element: Stat[] };
  costumes: { id: number; name: string; icon: string }[];
};
