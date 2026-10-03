// Downloads character icons from Project Amber (gi.yatta.moe) into public/characters/.
// Existing files are skipped; pass --force to re-download everything.
//   npm run icons:fetch
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import characters from "../data/characters.json";
import { characterIconFile } from "../src/lib/character-icon";

const API = "https://gi.yatta.moe/api/v2/en/avatar";
const ASSETS = "https://gi.yatta.moe/assets/UI";
const OUT_DIR = path.join(process.cwd(), "public", "characters");
// The Traveler is listed once per element but shares one icon; Lumine is the default.
const TRAVELER_ICON = "UI_AvatarIcon_PlayerGirl";

type AmberAvatar = { name: string; icon: string };

async function main() {
  const force = process.argv.includes("--force");
  const res = await fetch(API);
  if (!res.ok) throw new Error(`${API} responded ${res.status}`);
  const { data } = (await res.json()) as { data: { items: Record<string, AmberAvatar> } };
  const iconByName = new Map(Object.values(data.items).map((a) => [a.name, a.icon]));

  await mkdir(OUT_DIR, { recursive: true });
  const missing: string[] = [];
  let downloaded = 0;

  for (const { id, name } of characters) {
    const file = path.join(OUT_DIR, characterIconFile(id));
    if (!force && existsSync(file)) continue;

    const icon = id.startsWith("traveler-") ? TRAVELER_ICON : iconByName.get(name);
    if (!icon) {
      missing.push(name);
      continue;
    }
    const img = await fetch(`${ASSETS}/${icon}.png`);
    if (!img.ok) {
      missing.push(`${name} (${img.status})`);
      continue;
    }
    await writeFile(file, Buffer.from(await img.arrayBuffer()));
    downloaded++;
  }

  console.log(`Downloaded ${downloaded} icons to public/characters/.`);
  if (missing.length) {
    console.error(`No icon found for: ${missing.join(", ")}`);
    process.exitCode = 1;
  }
}

main();
