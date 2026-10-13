import type { CSSProperties, ReactNode } from "react";
import { RemoteImage } from "@/components/remote-image";
import { elementColor } from "@/lib/elements";
import { combatTalents, critValue, setBonuses } from "@/lib/hoyolab/build";
import type { CharacterDetail, Relic, Stat } from "@/lib/hoyolab/types";
import { DownloadCardButton } from "./download-card-button";

// One character's current build, as HoYoLAB reports it: identity, talents,
// constellations, weapon, final stats and artifacts. Server component; only the
// download button runs on the client.

const RARITY_TILE: Record<number, string> = {
  5: "bg-rarity-5-tile",
  4: "bg-rarity-4-tile",
};

export function CharacterBuild({ detail, slug }: { detail: CharacterDetail; slug: string }) {
  const { character, weapon, relics, constellations, stats } = detail;
  const color = elementColor(character.element);
  const talents = combatTalents(detail);
  const sets = setBonuses(relics);
  const cv = critValue(relics);
  const style = { "--element": color } as CSSProperties;

  return (
    <article style={style} className="flex flex-col gap-6">
      {/* Identity */}
      <section
        aria-label={`${character.name} overview`}
        className="boot-in relative grid overflow-hidden rounded-card border border-line bg-panel md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]"
      >
        <div
          className="relative h-80 overflow-hidden md:h-auto md:min-h-[22rem]"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 35%, color-mix(in oklab, var(--element) 38%, transparent), transparent 70%), var(--color-deep)",
          }}
        >
          <RemoteImage
            src={character.image || character.icon}
            alt={character.name}
            className="absolute inset-0 size-full object-cover object-top"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-panel to-transparent" />
          <HudCorners />
        </div>

        <div className="flex min-w-0 flex-col gap-6 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="flex items-center gap-3 font-mono text-xs tracking-wider uppercase">
              <span className="flex items-center gap-2 font-semibold" style={{ color }}>
                <span aria-hidden className="size-2 rounded-[2px]" style={{ background: color }} />
                {character.element ?? "Unknown"}
              </span>
              <span className={character.rarity === 5 ? "text-rarity-5" : "text-rarity-4"}>
                <span aria-hidden>{"★".repeat(character.rarity)}</span>
                <span className="sr-only">{character.rarity}-star</span>
              </span>
            </p>
            <DownloadCardButton characterId={character.id} fileName={`${slug}-build.png`} />
          </div>

          <div className="group flex flex-col gap-2">
            <h2 className="relative text-[clamp(2.5rem,4vw+1rem,4.25rem)] leading-none font-normal tracking-tight text-text-strong uppercase [overflow-wrap:anywhere]">
              <span aria-hidden className="glitch-red absolute inset-0 text-accent mix-blend-screen">
                {character.name}
              </span>
              <span aria-hidden className="glitch-cyan absolute inset-0 text-cyan mix-blend-screen">
                {character.name}
              </span>
              <span className="relative">{character.name}</span>
            </h2>
            <p className="font-mono text-sm text-muted tabular-nums">
              Lv <span className="text-text-strong">{character.level}</span>
              <span className="text-line-strong"> · </span>C
              <span className="text-text-strong">{character.constellation}</span>
              <span className="text-line-strong"> · </span>Friendship{" "}
              <span className="text-text-strong">{character.friendship}</span>
            </p>
          </div>

          {talents.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <Label>Talents</Label>
              <ul className="flex flex-wrap gap-3">
                {talents.map((t) => (
                  <li key={t.id} title={t.name} className="flex items-center gap-2.5">
                    <span className="relative grid size-12 place-items-center rounded-full border border-line-strong bg-deep">
                      <RemoteImage src={t.icon} className="size-8 object-contain" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-mono text-2xl leading-none text-text-strong tabular-nums">{t.level}</span>
                      <span className="max-w-[9rem] truncate text-xs text-muted">{t.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {constellations.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <Label>
                Constellations <span className="text-text-strong">C{character.constellation}</span>
              </Label>
              <ul className="flex flex-wrap gap-2">
                {constellations.map((c) => (
                  <li
                    key={c.id}
                    title={`C${c.position} · ${c.name}${c.unlocked ? "" : " (locked)"}`}
                    className={`grid size-11 place-items-center rounded-full border transition-opacity ${
                      c.unlocked ? "border-accent bg-deep" : "border-line opacity-35 grayscale"
                    }`}
                  >
                    <RemoteImage src={c.icon} alt={c.name} className="size-7 object-contain" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Weapon */}
          <Panel title="Weapon" index={1}>
            {weapon ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <span className={`size-16 shrink-0 overflow-hidden rounded-card ${RARITY_TILE[weapon.rarity] ?? "bg-panel-2"}`}>
                    <RemoteImage src={weapon.icon} alt="" className="size-full object-contain" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="truncate text-xl text-text-strong">{weapon.name}</p>
                    <p className="font-mono text-xs text-muted tabular-nums">
                      <span className="text-accent">R{weapon.refinement}</span>
                      <span className="text-line-strong"> · </span>Lv {weapon.level}
                      <span className="text-line-strong"> · </span>
                      <span className={weapon.rarity === 5 ? "text-rarity-5" : "text-rarity-4"}>
                        {"★".repeat(weapon.rarity)}
                      </span>
                    </p>
                  </div>
                </div>
                <dl className="flex flex-col border-t border-line">
                  {[weapon.mainStat, weapon.subStat].map(
                    (stat) => stat && <StatRow key={stat.propertyType} stat={stat} />,
                  )}
                </dl>
              </div>
            ) : (
              <p className="text-muted">No weapon equipped.</p>
            )}
          </Panel>

          {/* Stats */}
          <Panel title="Stats" index={2}>
            <dl className="flex flex-col">
              {stats.selected.map((stat) => (
                <StatRow key={stat.propertyType} stat={stat} showBreakdown />
              ))}
            </dl>
            <MoreStats stats={[...stats.extra, ...stats.element]} />
          </Panel>
        </div>

        {/* Artifacts */}
        <Panel
          title="Artifacts"
          index={3}
          aside={
            relics.length > 0 && (
              <span
                title="Crit Value of the substats: 2 × CRIT Rate + CRIT DMG"
                className="rounded-sm border border-line-strong px-2 py-0.5 font-mono text-xs text-text-strong tabular-nums"
              >
                CV <span className="text-accent">{cv.toFixed(1)}</span>
              </span>
            )
          }
        >
          {sets.length > 0 && (
            <ul className="mb-4 flex flex-wrap gap-2">
              {sets.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-[6px] border border-line bg-bg px-2.5 py-1.5 text-sm text-text-strong"
                >
                  <span className="rounded-sm bg-accent px-1.5 font-mono text-[11px] text-accent-ink">{s.pieces}pc</span>
                  {s.name}
                </li>
              ))}
            </ul>
          )}
          {relics.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {relics.map((relic) => (
                <li key={relic.slot}>
                  <RelicCard relic={relic} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No artifacts equipped.</p>
          )}
        </Panel>
      </div>
    </article>
  );
}

function Panel({
  title,
  index,
  aside,
  children,
}: {
  title: string;
  index: number;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="boot-in flex flex-col rounded-card border border-line bg-panel p-5 sm:p-6"
      style={{ "--i": index } as CSSProperties}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-mono text-xs tracking-wider text-muted uppercase">
          <span className="text-accent">0{index}</span> <span className="text-line-strong">/</span> {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] tracking-wider text-muted uppercase">{children}</p>;
}

function isCrit(stat: { propertyType: number }) {
  return stat.propertyType === 20 || stat.propertyType === 22;
}

function StatRow({ stat, showBreakdown = false }: { stat: Stat; showBreakdown?: boolean }) {
  const breakdown = showBreakdown && stat.add && stat.base;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className={`text-sm ${isCrit(stat) ? "text-text-strong" : "text-text"}`}>{stat.name}</dt>
      <dd className="flex flex-col items-end">
        <span className={`font-mono text-base tabular-nums ${isCrit(stat) ? "text-accent" : "text-text-strong"}`}>
          {stat.final || stat.base}
        </span>
        {breakdown && (
          <span className="font-mono text-[11px] text-muted tabular-nums">
            {stat.base} <span className="text-cyan">{stat.add}</span>
          </span>
        )}
      </dd>
    </div>
  );
}

// Secondary stats (healing, shields, every element's DMG bonus), collapsed. Zero
// values are left out.
function MoreStats({ stats }: { stats: Stat[] }) {
  const shown = stats.filter((s) => Number.parseFloat(s.final) !== 0);
  if (shown.length === 0) return null;
  return (
    <details className="group/more mt-3 border-t border-line pt-3">
      <summary className="cursor-pointer list-none font-mono text-xs tracking-wider text-muted uppercase hover:text-text">
        <span className="inline-block transition-transform group-open/more:rotate-90">›</span> More stats ({shown.length})
      </summary>
      <dl className="mt-2 flex flex-col">
        {shown.map((stat) => (
          <StatRow key={stat.propertyType} stat={stat} />
        ))}
      </dl>
    </details>
  );
}

function RelicCard({ relic }: { relic: Relic }) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-card border border-line bg-bg p-3.5">
      <div className="flex items-center gap-3">
        <span className={`size-12 shrink-0 overflow-hidden rounded-[6px] ${RARITY_TILE[relic.rarity] ?? "bg-panel-2"}`}>
          <RemoteImage src={relic.icon} alt="" className="size-full object-contain" />
        </span>
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-sm text-text-strong" title={relic.name}>
            {relic.name}
          </p>
          <p className="font-mono text-[11px] text-muted">
            {relic.slotName} <span className="text-accent">+{relic.level}</span>
          </p>
        </div>
      </div>
      {relic.mainStat && (
        <p className="flex items-baseline justify-between gap-2 border-b border-line pb-2">
          <span className="text-sm text-text">{relic.mainStat.name}</span>
          <span className="font-mono text-xl text-text-strong tabular-nums">{relic.mainStat.value}</span>
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {relic.subStats.map((sub) => (
          <li key={sub.propertyType} className="flex items-center justify-between gap-2 text-sm">
            <span className={isCrit(sub) ? "text-text-strong" : "text-muted"}>{sub.name}</span>
            <span className="flex items-center gap-2">
              {sub.rolls > 0 && (
                <span aria-label={`${sub.rolls} upgrades`} className="flex gap-0.5">
                  {Array.from({ length: sub.rolls }, (_, i) => (
                    <span key={i} className="size-1 rounded-full bg-cyan" />
                  ))}
                </span>
              )}
              <span className={`font-mono tabular-nums ${isCrit(sub) ? "text-accent" : "text-text-strong"}`}>
                {sub.value}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HudCorners() {
  const corner = "absolute size-5 border-accent";
  return (
    <span aria-hidden>
      <span className={`${corner} top-3 left-3 border-t-2 border-l-2`} />
      <span className={`${corner} top-3 right-3 border-t-2 border-r-2`} />
      <span className={`${corner} bottom-3 left-3 border-b-2 border-l-2`} />
      <span className={`${corner} right-3 bottom-3 border-r-2 border-b-2`} />
    </span>
  );
}
