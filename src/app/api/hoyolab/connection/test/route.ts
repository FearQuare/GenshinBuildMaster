import { errorResponse } from "@/lib/hoyolab/errors";
import { parseConnectInput, readJsonBody } from "@/lib/hoyolab/input";
import { testConnection } from "@/lib/hoyolab/service";

// POST { ltuid_v2, ltoken_v2, role_id?, server? }: Data Sync step 1. Checks the
// credentials and returns the profile card ({ account, stats }), without storing anything.
export async function POST(request: Request) {
  try {
    const input = parseConnectInput(await readJsonBody(request));
    return Response.json(await testConnection(input));
  } catch (error) {
    return errorResponse(error);
  }
}
