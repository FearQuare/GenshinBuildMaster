import type { CharacterDetail } from "@/lib/hoyolab/types";
import type { CardImages } from "./character-card-image";

// Downloads the card's HoYoLAB images and inlines them as data URIs, so a slow or broken
// image can't fail the whole render: it's just left out. Satori decodes PNG and JPEG.

const TIMEOUT_MS = 8000;
const SUPPORTED = new Set(["image/png", "image/jpeg"]);

async function toDataUri(url: string | undefined): Promise<string | null> {
  if (!url?.startsWith("https://")) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const type = response.headers.get("content-type")?.split(";")[0] ?? "";
    if (!response.ok || !SUPPORTED.has(type)) return null;
    const data = Buffer.from(await response.arrayBuffer()).toString("base64");
    return `data:${type};base64,${data}`;
  } catch {
    return null;
  }
}

export async function loadCardImages(
  detail: CharacterDetail,
  talentIcons: string[],
): Promise<CardImages> {
  const [splash, weapon, talents, constellations, relics] = await Promise.all([
    toDataUri(detail.character.image || detail.character.icon),
    toDataUri(detail.weapon?.icon),
    Promise.all(talentIcons.map(toDataUri)),
    Promise.all(detail.constellations.map((c) => toDataUri(c.icon))),
    Promise.all(detail.relics.map((r) => toDataUri(r.icon))),
  ]);
  return { splash, weapon, talents, constellations, relics };
}
