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
npm run dev          # http://localhost:3000 (landing page; roster at /characters)
npm run lint
npm run typecheck    # next typegen && tsc (typegen provides globals like LayoutProps)
npm run build
npm test             # node:test via tsx; files are src/**/*.test.ts
```

### Testing on a phone

- Open the Mac's LAN IP on port 3000, for example `http://192.168.1.121:3000`.
- `allowedDevOrigins: ["192.168.*.*"]` in `next.config.ts` lets those devices load the dev JavaScript and hot reload. Without it, Next.js blocks them.

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
- **Users and sign-in.** Users are HoYoLAB accounts (`User.hoyolabUid`). Signing in = "Data Sync" in the navbar (`src/components/data-sync.tsx`): credentials → profile card → "Yes, that's me". `getCurrentUserId()` in `src/lib/current-user.ts` reads the session and returns `null` for guests. Pages and server actions must get the user only from it.
- **Guests** use the app fully without signing in. Their roster lives in local storage (`src/lib/guest-roster.ts`). It can be exported and imported as JSON (`src/lib/roster-file.ts`, toolbar on `/characters`). On sign-in it is merged into the account and cleared. Client components use `useRoster(serverOwned)` (`src/lib/use-roster.ts`), where `serverOwned` is `null` for guests, so both modes share one API.
- **Data flow:**
  - Server components query Prisma through `src/lib/db.ts`, a singleton client.
  - Pages call `await connection()` so they render per request instead of being prerendered at build time. The root layout also reads the session cookie for the navbar. Cache Components is not enabled.
  - Mutations are server actions (e.g. `src/app/characters/actions.ts`) that call `revalidatePath`. Client components apply them optimistically with `useOptimistic`.
- **HoYoLAB integration** (`src/lib/hoyolab/`, routes under `src/app/api/hoyolab/`). It powers sign-in and reads the user's data from HoYoLAB's Battle Chronicle API. The characters routes have no UI yet.
  - Routes: `GET|POST|DELETE /api/hoyolab/connection` (status, sign in, sign out), `POST /api/hoyolab/connection/test` (profile card: account + `genshin/api/index` stats), `GET /api/hoyolab/characters`, `GET /api/hoyolab/characters/[id]` and `POST /api/hoyolab/characters/sync`. Errors are `{ error: { code, message, retcode? } }`. The UI switches on `code`.
  - Credentials (`ltuid_v2`/`ltoken_v2`) come from the user, never from env. They live server-side behind an httpOnly `hoyolab_session` cookie: in memory by default, or in the `HoyolabSession` table with "Remember me". The ltoken is encrypted there with `HOYOLAB_SESSION_KEY` from `.env`. Never log the ltoken or put it in a URL or error message.
  - The roster is cached for 1 hour and details for 10 minutes, both in memory. Calls are throttled to one per second per HoYoLAB login. `x-rpc-device_id` is stored in the `AppSetting` table.
  - Character ids are HoYoLAB's numeric ids (e.g. `10000046`), not our slugs. `src/lib/hoyolab/match.ts` maps them to our slugs by name; the Traveler maps by element. Sign-in and the menu's "Sync characters" tick the account's characters (add-only).
- **Character Details** (`/character-details/[character]`, signed-in only) shows a character's current build from HoYoLAB.
  - The layout holds the sidebar, built from HoYoLAB's roster. `[character]` is our slug, or the HoYoLAB id when there's no match. `loading.tsx` shows while a build loads.
  - Derived numbers (set bonuses, crit value, combat talents) live in `src/lib/hoyolab/build.ts`.
  - **Download PNG** calls `/api/hoyolab/characters/[id]/card`, which renders `src/lib/card/character-card-image.tsx` with `next/og` (Satori). It supports flexbox and inline styles only, and crashes on `undefined` style values. Its colors are hex copies of the tokens. The fonts are TTFs in `assets/fonts/` (OFL).

## Design

- `DESIGN.md` is the project's locked design system: the "Glitch UI Dystopian Terminal" look.
  - Colors: black `#050000`, red text `#FF5050`, red accent `#FF0000`, cyan `#00FFFF` for glitch effects.
  - Fonts: Share Tech, with JetBrains Mono for data.
  - Effects: scanlines and HUD details.
- Colors are Tailwind tokens in `src/app/globals.css` (`bg-panel`, `text-text-strong`, `text-muted`, `border-line`, `bg-accent`, plus element and rarity colors). Use the tokens, not raw hex values.
- `globals.css` also holds the CSS-only glitch kit: `glitch-red`, `glitch-cyan`, `glitch-slice`, `boot-in` (stagger it via `--i`), `caret`, `jolt` and `skeleton` (loading shimmer). It animates only transform and opacity, and turns off under reduced motion.
- `src/app/layout.tsx` renders the shared `SiteNav` and `SiteFooter` (`src/components/`). To add a nav section, add it to `LINKS` in `site-nav.tsx`.
- **iOS Safari 26 top bar:** Safari fills the area behind its translucent top bar with the `background-color` of the full-width fixed or sticky element at the top edge. It ignores `theme-color` and doesn't paint pseudo-elements there.
  - Keep the navbar opaque, with no `backdrop-filter`, spanning the full width.
  - Keep the navbar above every other fixed layer. The `body::after` scanline overlay uses `--z-scanlines`, which sits below `--z-sticky`.
  - Breaking any of these brings back scrolled content showing above the navbar on iPhones.
- The landing page (`src/app/page.tsx`) features Sandrone. Her artwork lives in `public/featured/`; `sandrone-mask.png` is a smaller copy used for the red and cyan glitch silhouettes.
- The `hallmark` design skill lives in `.agents/skills/hallmark` and is symlinked into `.claude/skills/`. It records its design choices in `.hallmark/log.json`. Skills are managed with `npx skills add`, and versions are pinned in `skills-lock.json`.
