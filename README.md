# Genshin Build Master

Track the Genshin Impact characters you own. Build and team recommendations are planned.

## Setup

Requires Node 24+ and Docker Desktop.

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000.
