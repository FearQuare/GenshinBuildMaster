import { errorResponse } from "@/lib/hoyolab/errors";
import { syncCharacters } from "@/lib/hoyolab/service";

// POST: tick every character the signed-in HoYoLAB account owns. Refetches from HoYoLAB.
// Returns { added, matched, unmatched }.
export async function POST() {
  try {
    return Response.json(await syncCharacters());
  } catch (error) {
    return errorResponse(error);
  }
}
