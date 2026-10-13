/* eslint-disable @next/next/no-img-element -- Satori renders plain <img>, not next/image. */
import type { ReactNode } from "react";
import { combatTalents, critValue, setBonuses } from "@/lib/hoyolab/build";
import type { CharacterDetail, GenshinAccount, Stat } from "@/lib/hoyolab/types";

// The downloadable build card (1600×900 PNG), rendered by next/og's ImageResponse
// (Satori). Satori supports only flexbox and inline styles, so this mirrors the Character
// Details page rather than reusing it. Colors copy the tokens in globals.css (Satori
// can't read CSS variables). Images arrive as data URIs (see card-images.ts); a missing
// one is simply left out.

export const CARD_WIDTH = 1600;
export const CARD_HEIGHT = 900;

const C = {
  bg: "#050000",
  panel: "#0e0303",
  panel2: "#1a0606",
  deep: "#330000",
  line: "#3d0b0b",
  lineStrong: "#7a1414",
  text: "#ff5050",
  textStrong: "#e0e0e0",
  muted: "#9a8c8c",
  accent: "#ff0000",
  cyan: "#00ffff",
  rarity5: "#e8b04b",
  rarity4: "#a98be0",
};

const ELEMENT_HEX: Record<string, string> = {
  PYRO: "#f2805a",
  HYDRO: "#4cc2f1",
  ANEMO: "#6fd6b5",
  ELECTRO: "#b98cf2",
  DENDRO: "#9bcb4a",
  CRYO: "#9fd6e3",
  GEO: "#f0c24b",
};

const SANS = "Share Tech";
const MONO = "JetBrains Mono";

export type CardImages = {
  splash: string | null;
  weapon: string | null;
  talents: (string | null)[];
  constellations: (string | null)[];
  relics: (string | null)[];
};

function isCrit(stat: { propertyType: number }) {
  return stat.propertyType === 20 || stat.propertyType === 22;
}

function rarityColor(rarity: number) {
  return rarity === 5 ? C.rarity5 : C.rarity4;
}

export function CharacterCardImage({
  detail,
  account,
  images,
}: {
  detail: CharacterDetail;
  account: GenshinAccount | null;
  images: CardImages;
}) {
  const { character, weapon, relics, constellations, stats } = detail;
  const element = (character.element && ELEMENT_HEX[character.element]) || C.muted;
  const talents = combatTalents(detail);
  const sets = setBonuses(relics);
  const cv = critValue(relics);

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
        backgroundColor: C.bg,
        backgroundImage: `radial-gradient(circle at 18% 30%, ${element}33, transparent 45%), radial-gradient(circle at 95% -10%, ${C.accent}22, transparent 40%)`,
        color: C.text,
        fontFamily: SANS,
      }}
    >
      <div style={{ display: "flex", height: 4, backgroundColor: C.accent }} />
      <div style={{ display: "flex", flex: 1, padding: 36, gap: 32 }}>
        {/* Character */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 470,
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${C.line}`,
            backgroundColor: C.deep,
          }}
        >
          {images.splash && (
            <img
              alt=""
              src={images.splash}
              width={470}
              height={790}
              style={{ position: "absolute", top: 0, left: 0, width: 470, height: 790, objectFit: "cover", objectPosition: "top" }}
            />
          )}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 470,
              display: "flex",
              backgroundImage: `linear-gradient(to bottom, transparent, ${C.bg}ee 55%, ${C.bg})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 28,
              right: 28,
              bottom: 28,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: MONO, fontSize: 18, letterSpacing: 2 }}>
              <div style={{ display: "flex", width: 12, height: 12, backgroundColor: element, borderRadius: 2 }} />
              <span style={{ color: element, fontWeight: 700 }}>{character.element ?? ""}</span>
              <Stars count={character.rarity} color={rarityColor(character.rarity)} size={18} />
            </div>
            <div style={{ display: "flex", fontSize: 76, lineHeight: 1, color: C.textStrong, textTransform: "uppercase" }}>
              {character.name}
            </div>
            <div style={{ display: "flex", gap: 18, fontFamily: MONO, fontSize: 20, color: C.muted }}>
              <span>
                Lv <span style={{ color: C.textStrong, marginLeft: 6 }}>{character.level}</span>
              </span>
              <span>
                C<span style={{ color: C.textStrong }}>{character.constellation}</span>
              </span>
              <span>
                Friendship <span style={{ color: C.textStrong, marginLeft: 6 }}>{character.friendship}</span>
              </span>
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 6 }}>
              {talents.map((t, i) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Circle size={52} border={C.lineStrong} background={C.deep}>
                    {images.talents[i] && <img alt="" src={images.talents[i]!} width={34} height={34} />}
                  </Circle>
                  <span style={{ fontFamily: MONO, fontSize: 30, color: C.textStrong }}>{t.level}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {constellations.map((c, i) => (
                <div key={c.id} style={{ display: "flex", opacity: c.unlocked ? 1 : 0.3 }}>
                  <Circle size={44} border={c.unlocked ? C.accent : C.line} background={c.unlocked ? C.deep : C.panel}>
                    {images.constellations[i] && <img alt="" src={images.constellations[i]!} width={28} height={28} />}
                  </Circle>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weapon + stats */}
        <div style={{ display: "flex", flexDirection: "column", width: 440, gap: 24 }}>
          <Box title="01 / Weapon">
            {weapon ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      width: 84,
                      height: 84,
                      borderRadius: 10,
                      backgroundColor: `${rarityColor(weapon.rarity)}40`,
                    }}
                  >
                    {images.weapon && <img alt="" src={images.weapon} width={84} height={84} />}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <span style={{ fontSize: 28, color: C.textStrong, lineHeight: 1.1 }}>{weapon.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 17, color: C.muted }}>
                      <span style={{ color: C.accent, marginRight: 12 }}>R{weapon.refinement}</span>
                      Lv {weapon.level}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {[weapon.mainStat, weapon.subStat].map(
                    (s) => s && <StatLine key={s.propertyType} stat={s} />,
                  )}
                </div>
              </div>
            ) : (
              <span style={{ color: C.muted }}>No weapon equipped</span>
            )}
          </Box>
          <Box title="02 / Stats" grow>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {stats.selected.slice(0, 10).map((s) => (
                <StatLine key={s.propertyType} stat={s} />
              ))}
            </div>
          </Box>
        </div>

        {/* Artifacts */}
        <Box
          title="03 / Artifacts"
          grow
          aside={
            <span style={{ fontFamily: MONO, fontSize: 18, color: C.textStrong }}>
              CV <span style={{ color: C.accent, marginLeft: 8 }}>{cv.toFixed(1)}</span>
            </span>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sets.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {sets.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 10px",
                      border: `1px solid ${C.line}`,
                      borderRadius: 6,
                      fontSize: 18,
                      color: C.textStrong,
                    }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 14, backgroundColor: C.accent, color: C.bg, padding: "1px 6px", borderRadius: 3 }}>
                      {s.pieces}pc
                    </span>
                    {s.name}
                  </div>
                ))}
              </div>
            )}
            {relics.map((relic, i) => (
              <div
                key={relic.slot}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "10px 14px",
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  backgroundColor: C.bg,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 64,
                    height: 64,
                    borderRadius: 8,
                    backgroundColor: `${rarityColor(relic.rarity)}40`,
                  }}
                >
                  {images.relics[i] && <img alt="" src={images.relics[i]!} width={64} height={64} />}
                </div>
                <div style={{ display: "flex", flexDirection: "column", width: 170, gap: 2 }}>
                  <span style={{ fontSize: 16, color: C.muted }}>{relic.mainStat?.name ?? relic.slotName}</span>
                  <span style={{ fontFamily: MONO, fontSize: 26, color: C.textStrong }}>{relic.mainStat?.value ?? ""}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: C.accent }}>+{relic.level}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", flex: 1, rowGap: 4 }}>
                  {relic.subStats.map((sub) => (
                    <div key={sub.propertyType} style={{ display: "flex", width: "50%", gap: 6, fontSize: 15, alignItems: "baseline" }}>
                      <span style={{ color: isCrit(sub) ? C.textStrong : C.muted }}>{shortStat(sub.name)}</span>
                      <span style={{ fontFamily: MONO, fontSize: 15, color: isCrit(sub) ? C.accent : C.textStrong }}>{sub.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {relics.length === 0 && <span style={{ color: C.muted }}>No artifacts equipped</span>}
          </div>
        </Box>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 36px 26px",
          fontFamily: MONO,
          fontSize: 17,
          color: C.muted,
          letterSpacing: 1,
        }}
      >
        <span style={{ display: "flex", gap: 10 }}>
          <span style={{ color: C.accent }}>&gt;</span>
          <span style={{ color: C.textStrong }}>GENSHIN BUILD MASTER</span>
        </span>
        <span style={{ display: "flex", gap: 18 }}>
          {account && <span style={{ color: C.textStrong }}>{account.nickname}</span>}
          {account && <span>UID {account.roleId}</span>}
          <span style={{ color: C.cyan }}>{new Date().toLocaleDateString("en-CA")}</span>
        </span>
      </div>
    </div>
  );
}

// Shortens long substat names so two fit per row ("Elemental Mastery" → "EM").
function shortStat(name: string): string {
  return name
    .replace("Elemental Mastery", "EM")
    .replace("Energy Recharge", "ER")
    .replace("CRIT Rate", "CR")
    .replace("CRIT DMG", "CD");
}

function Box({
  title,
  aside,
  grow = false,
  children,
}: {
  title: string;
  aside?: ReactNode;
  grow?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        // Satori crashes on undefined style values, so spread instead of `flex: undefined`.
        ...(grow ? { flex: 1 } : {}),
        padding: 24,
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        backgroundColor: C.panel,
        gap: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: C.muted, textTransform: "uppercase" }}>
          {title}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

function StatLine({ stat }: { stat: Stat }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "7px 0",
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <span style={{ fontSize: 19, color: isCrit(stat) ? C.textStrong : C.text }}>{stat.name}</span>
      <span style={{ fontFamily: MONO, fontSize: 21, color: isCrit(stat) ? C.accent : C.textStrong }}>
        {stat.final || stat.base}
      </span>
    </div>
  );
}

// The embedded fonts have no ★ glyph, so stars are drawn as SVG.
function Stars({ count, color, size }: { count: number; color: string; size: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24">
          <path fill={color} d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" />
        </svg>
      ))}
    </div>
  );
}

function Circle({
  size,
  border,
  background,
  children,
}: {
  size: number;
  border: string;
  background: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size,
        border: `2px solid ${border}`,
        backgroundColor: background,
      }}
    >
      {children}
    </div>
  );
}
