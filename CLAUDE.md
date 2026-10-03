# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

This is a Genshin Impact character-building web app. Users record the characters they own. Later steps add weapons, artifacts and stats, then a calculation engine that recommends builds and teams for Spiral Abyss, Imaginarium Theater and Stygian Onslaught. The user wants to build it **step by step**: implement only the current step, and don't scaffold future features ahead of time.

## Stack

- Next.js 16 (App Router, `src/`), React 19, TypeScript, Tailwind v4.
- PostgreSQL 17 in Docker on host port **5433**. Homebrew Postgres may be using 5432.
- Prisma 7, with the `prisma-client` generator and the `@prisma/adapter-pg` driver adapter.
  - The connection URL lives in `prisma.config.ts`, which reads `.env`. It is not in `schema.prisma`.
  - The client is generated into `src/generated/prisma/` (gitignored, regenerated on `postinstall`).
  - Import it from `@/generated/prisma/client`.
  - Client components import enums from `@/generated/prisma/enums`, which is browser-safe.

## Commands

```bash
npm run db:up        # start Postgres (docker compose); Docker Desktop must be running
npm run db:migrate   # prisma migrate dev; pass `-- --name <name>` for a new migration
npm run db:seed      # upsert data/characters.json + the local user (idempotent)
npm run dev          # http://localhost:3000 → redirects to /characters
npm run lint
npm run typecheck    # next typegen && tsc (typegen provides globals like LayoutProps)
npm run build
```

There is no test runner yet.

## Architecture

- **Game data vs user data.**
  - Static game data, such as `Character`, is seeded from JSON in `data/`. It is keyed by readable slug IDs (for example `hu-tao`).
  - Per-user data lives in join models, such as `UserCharacter` (a composite key of `userId` + `characterId`). Per-user progress (level, constellation and so on) will be added to these models.
  - Weapons, artifacts and teams should follow the same split.
- **To add newly released characters,** append them to `data/characters.json` and re-run `npm run db:seed`.
  - The list is complete through version 7.1.
  - The Traveler is stored as one row per element (`traveler-anemo` … `traveler-cryo`), named "Lumine (<Element>)" by default.
  - Manekin/Manekina (the Miliastra Wonderland avatars) are deliberately left out.
- **Character icons** are committed in `public/characters/<id>.png`. All Traveler elements share `traveler.png` (Lumine).
  - `npm run icons:fetch` downloads any missing icons from Project Amber (gi.yatta.moe), matching characters by name. Pass `-- --force` to re-download them all.
  - Run it after adding new characters to `data/characters.json`.
  - Build an icon's path with `characterIconSrc(id)` from `src/lib/character-icon.ts`.
- **No auth yet.** `src/lib/current-user.ts` (`getCurrentUserId`) returns the seeded `local-user`. It's the only place that knows about the placeholder user. Server actions and pages must get the user from it, so auth can replace it later in one place.
- **Data flow:**
  - Server components query Prisma through `src/lib/db.ts`, a singleton client.
  - Pages call `await connection()` so they render per request instead of being prerendered at build time. Cache Components is not enabled.
  - Mutations are server actions (e.g. `src/app/characters/actions.ts`) that call `revalidatePath`. Client components apply them optimistically with `useOptimistic`.

## Design

- `DESIGN.md` is the project's locked design system: the "Glitch UI Dystopian Terminal" look.
  - Colors: black `#050000`, red text `#FF5050`, red accent `#FF0000`, cyan `#00FFFF` for glitch effects.
  - Fonts: Share Tech, with JetBrains Mono for data.
  - Effects: scanlines and HUD details.
- Colors are Tailwind tokens in `src/app/globals.css` (`bg-panel`, `text-text-strong`, `text-muted`, `border-line`, `bg-accent`, plus element and rarity colors). Use the tokens, not raw hex values.
- `globals.css` also holds the CSS-only glitch kit: `glitch-red`, `glitch-cyan`, `glitch-slice`, `boot-in` (stagger it via `--i`), `caret` and `jolt`. It animates only transform and opacity, and turns off under reduced motion.
- `src/app/layout.tsx` renders the shared `SiteNav` and `SiteFooter` (`src/components/`). To add a nav section, add it to `LINKS` in `site-nav.tsx`.
- The landing page (`src/app/page.tsx`) features Sandrone. Her artwork lives in `public/featured/`; `sandrone-mask.png` is a smaller copy used for the red and cyan glitch silhouettes.
- The `hallmark` design skill lives in `.agents/skills/hallmark` and is symlinked into `.claude/skills/`. It records its design choices in `.hallmark/log.json`. Skills are managed with `npx skills add`, and versions are pinned in `skills-lock.json`.
