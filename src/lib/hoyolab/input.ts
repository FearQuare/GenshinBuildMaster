import { AppError } from "./errors";
import { SERVERS, type Credentials, type Server } from "./types";

// Request-body parsing for the HoYoLAB routes. Kept free of database and Next.js imports
// so it can be unit-tested.

export type ConnectInput = {
  credentials: Credentials;
  roleId?: string;
  server?: Server;
  remember: boolean;
};

export function isServer(value: unknown): value is Server {
  return SERVERS.includes(value as Server);
}

export function invalid(message: string): AppError {
  return new AppError("INVALID_INPUT", message);
}

// Validates the Connect form's JSON body. ltoken is never echoed back in messages.
export function parseConnectInput(body: unknown): ConnectInput {
  if (typeof body !== "object" || body === null) throw invalid("Expected a JSON object.");
  const { ltuid_v2, ltoken_v2, role_id, server, remember } = body as Record<string, unknown>;

  const ltuid = typeof ltuid_v2 === "string" ? ltuid_v2.trim() : "";
  if (!ltuid) throw invalid("ltuid_v2 is required.");
  if (!/^\d{1,20}$/.test(ltuid)) throw invalid("ltuid_v2 should be a number.");

  const ltoken = typeof ltoken_v2 === "string" ? ltoken_v2.trim() : "";
  if (!ltoken) throw invalid("ltoken_v2 is required.");
  // Printable ASCII without ; or , so it can't break out of the Cookie header.
  if (!/^[!-~]{1,1024}$/.test(ltoken) || /[;,]/.test(ltoken)) {
    throw invalid("ltoken_v2 doesn't look right. Copy the cookie's value again.");
  }

  if (role_id != null && typeof role_id !== "string") throw invalid("UID should be a string.");
  const roleId = typeof role_id === "string" && role_id.trim() ? role_id.trim() : undefined;
  if (roleId !== undefined && !/^\d{9,10}$/.test(roleId)) {
    throw invalid("UID should be a 9 or 10 digit number.");
  }

  const serverValue = typeof server === "string" && server ? server : undefined;
  if (serverValue !== undefined && !isServer(serverValue)) {
    throw invalid(`server must be one of ${SERVERS.join(", ")}.`);
  }

  return {
    credentials: { ltuid, ltoken },
    roleId,
    server: serverValue,
    remember: remember === true,
  };
}

// Reads a JSON request body. Requiring the JSON content type means a cross-site form
// can't post here: browsers only send it cross-origin after a CORS preflight, which fails.
export async function readJsonBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw invalid("Send the body as application/json.");
  }
  try {
    return await request.json();
  } catch {
    throw invalid("The body isn't valid JSON.");
  }
}
