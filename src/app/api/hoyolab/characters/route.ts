import { errorResponse } from "@/lib/hoyolab/errors";
import { getRoster } from "@/lib/hoyolab/service";

// GET: the connected account's characters ({ characters, fetchedAt }). Cached for 1 hour.
export async function GET() {
  try {
    return Response.json(await getRoster());
  } catch (error) {
    return errorResponse(error);
  }
}
