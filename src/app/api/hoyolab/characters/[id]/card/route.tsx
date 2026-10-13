import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { loadCardImages } from "@/lib/card/card-images";
import { CARD_HEIGHT, CARD_WIDTH, CharacterCardImage } from "@/lib/card/character-card-image";
import { combatTalents } from "@/lib/hoyolab/build";
import { AppError, errorResponse } from "@/lib/hoyolab/errors";
import { getAccount, getCharacter } from "@/lib/hoyolab/service";

// GET: the character's build card as a 1600×900 PNG (Character Details → Download PNG).
// Uses the same cached detail as /api/hoyolab/characters/[id].

const fontDir = join(process.cwd(), "assets/fonts");
// Read once per server process; the fonts never change.
const fonts = Promise.all([
  readFile(join(fontDir, "ShareTech-Regular.ttf")),
  readFile(join(fontDir, "JetBrainsMono-Regular.ttf")),
  readFile(join(fontDir, "JetBrainsMono-Bold.ttf")),
]);

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/hoyolab/characters/[id]/card">) {
  try {
    const { id } = await ctx.params;
    if (!/^\d{1,12}$/.test(id)) throw new AppError("INVALID_INPUT", "Character id should be a number.");

    const [detail, account, [shareTech, monoRegular, monoBold]] = await Promise.all([
      getCharacter(Number(id)),
      getAccount(),
      fonts,
    ]);
    const images = await loadCardImages(detail, combatTalents(detail).map((t) => t.icon));

    return new ImageResponse(<CharacterCardImage detail={detail} account={account} images={images} />, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: [
        { name: "Share Tech", data: shareTech, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: monoRegular, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: monoBold, weight: 700, style: "normal" },
      ],
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
