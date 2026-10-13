import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { db } from "@/lib/db";
import { FeaturedToggle } from "./featured-toggle";
import { RosterProgress } from "./roster-progress";
import { SandronePortrait } from "./sandrone-portrait";

const FEATURED_ID = "sandrone";
const HEADLINE = "Build your characters smart and fast.";

const ROADMAP = [
  {
    status: "Online",
    title: "Character roster",
    detail: "Mark which characters you own, from the first Mondstadt crew to the newest arrivals.",
  },
  {
    status: "Queued",
    title: "Weapons and artifacts",
    detail: "Log your gear so the planner knows what each character can actually wear.",
  },
  {
    status: "Queued",
    title: "Build recommendations",
    detail: "Stats, sets and weapons picked from what you own, not from a wishlist.",
  },
  {
    status: "Queued",
    title: "Team plans for endgame",
    detail: "Lineups for Spiral Abyss, Imaginarium Theater and Stygian Onslaught.",
  },
];

export default async function Home() {
  await connection();
  const userId = await getCurrentUserId();

  const [featured, characters, owned] = await Promise.all([
    db.character.findUnique({ where: { id: FEATURED_ID } }),
    db.character.findMany({ select: { id: true, name: true, rarity: true } }),
    // Guests (no user) keep their roster in local storage; the client reads it there.
    userId
      ? db.userCharacter.findMany({ where: { userId }, select: { characterId: true, createdAt: true } })
      : null,
  ]);
  const serverOwned =
    owned?.map((o) => ({ id: o.characterId, addedAt: o.createdAt.toISOString() })) ?? null;

  return (
    <main>
      {/* Hero: copy left, Sandrone right (stacks on mobile). */}
      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-6 lg:pt-16 lg:pb-24">
        <div className="flex min-w-0 flex-col gap-8">
          <h1 className="boot-in relative text-[clamp(2.75rem,5vw+1rem,5.75rem)] leading-[1.02] font-normal tracking-tight text-text-strong uppercase [overflow-wrap:anywhere]">
            <span aria-hidden className="glitch-red absolute inset-0 text-accent mix-blend-screen">
              {HEADLINE}
            </span>
            <span aria-hidden className="glitch-cyan absolute inset-0 text-cyan mix-blend-screen">
              {HEADLINE}
            </span>
            <span className="relative">{HEADLINE}</span>
          </h1>

          <p className="boot-in max-w-[46ch] text-lg leading-relaxed text-text" style={{ "--i": 1 } as React.CSSProperties}>
            Tell the terminal who you&rsquo;ve pulled. Builds, weapons and team plans for every
            endgame mode will run on that roster, so you farm for characters you actually have.
          </p>

          <div className="boot-in flex flex-wrap items-center gap-3" style={{ "--i": 2 } as React.CSSProperties}>
            <Link
              href="/characters"
              className="inline-flex h-12 items-center whitespace-nowrap rounded-card bg-accent px-6 text-lg font-normal text-accent-ink transition-transform duration-(--dur-micro) hover:-translate-y-px active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Open your roster
            </Link>
            <a
              href="#roadmap"
              className="inline-flex h-12 items-center whitespace-nowrap rounded-card border-[1.5px] border-line-strong px-5 text-lg text-text transition-colors duration-(--dur-micro) hover:bg-panel-2 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              See what&rsquo;s coming
            </a>
          </div>
        </div>

        <div className="boot-in flex min-w-0 flex-col gap-4" style={{ "--i": 1 } as React.CSSProperties}>
          <SandronePortrait />
          {featured && (
            <div className="flex flex-col gap-4 border-l-2 border-accent pl-4 sm:flex-row sm:items-center sm:justify-between">
              <dl className="font-mono text-xs leading-relaxed text-muted">
                <dt className="sr-only">Featured character</dt>
                <dd className="text-base text-text-strong">{featured.name}, the Marionette</dd>
                <dt className="sr-only">Details</dt>
                <dd>
                  <span className="text-rarity-5">{"★".repeat(featured.rarity)}</span>{" "}
                  <span className="text-cryo">{featured.element}</span> {featured.weaponType}, new in 6.7
                </dd>
              </dl>
              <FeaturedToggle characterId={featured.id} name={featured.name} serverOwned={serverOwned} />
            </div>
          )}
        </div>
      </section>

      <div aria-hidden className="h-1 bg-accent" />

      {/* Below the fold the diptych flips: roadmap left, your progress right. */}
      <section
        id="roadmap"
        className="mx-auto grid w-full max-w-7xl scroll-mt-20 gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16 lg:py-24"
      >
        <div className="flex flex-col gap-6">
          <h2 className="text-3xl text-text-strong sm:text-4xl">What the planner will do</h2>
          <ul className="flex flex-col border-t border-line">
            {ROADMAP.map((item) => (
              <li
                key={item.title}
                className="grid gap-x-5 gap-y-1 border-b border-line py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)]"
              >
                <span
                  className={`h-fit w-fit self-start rounded-sm px-2 py-0.5 font-mono text-xs ${
                    item.status === "Online" ? "bg-accent text-accent-ink" : "border border-line-strong text-muted"
                  }`}
                >
                  {item.status}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-xl text-text-strong">{item.title}</span>
                  <span className="max-w-[60ch] text-text">{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <RosterProgress characters={characters} serverOwned={serverOwned} />
      </section>
    </main>
  );
}
