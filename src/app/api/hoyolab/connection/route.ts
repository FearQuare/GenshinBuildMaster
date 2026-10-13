import { errorResponse } from "@/lib/hoyolab/errors";
import { parseConnectInput, readJsonBody } from "@/lib/hoyolab/input";
import { connect, disconnect, getAccount } from "@/lib/hoyolab/service";

// GET: is this browser signed in? Returns { connected, account }. Never returns credentials.
export async function GET() {
  try {
    const account = await getAccount();
    return Response.json({ connected: account !== null, account });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST { ltuid_v2, ltoken_v2, role_id?, server?, remember? }: sign in ("Yes, that's me").
// Verifies again, finds or creates the user for this HoYoLAB account, sets the session cookie
// and ticks the characters the account owns ({ sync: { added, matched, unmatched } | null }).
export async function POST(request: Request) {
  try {
    const input = parseConnectInput(await readJsonBody(request));
    const { account, sync } = await connect(input);
    return Response.json({ connected: true, account, sync });
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE: sign out. Deletes all of this user's stored logins and cached HoYoLAB data.
export async function DELETE() {
  try {
    await disconnect();
    return Response.json({ connected: false, account: null });
  } catch (error) {
    return errorResponse(error);
  }
}
