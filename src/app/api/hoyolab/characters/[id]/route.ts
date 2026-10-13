import type { NextRequest } from "next/server";
import { AppError, errorResponse } from "@/lib/hoyolab/errors";
import { getCharacter } from "@/lib/hoyolab/service";

// GET: one character's build (weapon, artifacts, talents, constellations, stats).
// `id` is HoYoLAB's numeric character id from the roster. Cached for 10 minutes.
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/hoyolab/characters/[id]">) {
  try {
    const { id } = await ctx.params;
    if (!/^\d{1,12}$/.test(id)) throw new AppError("INVALID_INPUT", "Character id should be a number.");
    return Response.json(await getCharacter(Number(id)));
  } catch (error) {
    return errorResponse(error);
  }
}
