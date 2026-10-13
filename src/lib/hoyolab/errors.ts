import { HoyolabError } from "./client";

// Every HoYoLAB route answers errors as { error: { code, message, retcode? } }.
// The UI switches on `code` (e.g. LOGIN_EXPIRED → back to the Connect screen) and can
// show `message` as is. Messages never contain credentials.

export type ErrorCode =
  | "INVALID_INPUT"
  | "NOT_CONNECTED"
  | "LOGIN_EXPIRED"
  | "VERIFICATION_REQUIRED"
  | "CHRONICLE_PRIVATE"
  | "NO_GENSHIN_ACCOUNT"
  | "ROLE_NOT_FOUND"
  | "CHARACTER_NOT_FOUND"
  | "REMEMBER_UNAVAILABLE"
  | "HOYOLAB_ERROR"
  | "UPSTREAM_UNREACHABLE";

const STATUS: Record<ErrorCode, number> = {
  INVALID_INPUT: 400,
  NOT_CONNECTED: 401,
  LOGIN_EXPIRED: 401,
  VERIFICATION_REQUIRED: 429,
  CHRONICLE_PRIVATE: 403,
  NO_GENSHIN_ACCOUNT: 404,
  ROLE_NOT_FOUND: 404,
  CHARACTER_NOT_FOUND: 404,
  REMEMBER_UNAVAILABLE: 500,
  HOYOLAB_ERROR: 502,
  UPSTREAM_UNREACHABLE: 502,
};

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly retcode?: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const LOGIN_EXPIRED_RETCODES = new Set([-100, 10001]);
const VERIFICATION_RETCODES = new Set([1034, 10035]);
const PRIVATE_RETCODES = new Set([10102]);

// Turns a HoYoLAB retcode into the error the UI shows.
export function classifyHoyolabError(error: HoyolabError): AppError {
  const { retcode, message } = error;
  if (LOGIN_EXPIRED_RETCODES.has(retcode)) {
    return new AppError(
      "LOGIN_EXPIRED",
      "Your HoYoLAB login expired. Paste fresh ltuid_v2 and ltoken_v2.",
      retcode,
    );
  }
  if (VERIFICATION_RETCODES.has(retcode) || /verif|captcha|geetest/i.test(message)) {
    return new AppError(
      "VERIFICATION_REQUIRED",
      "HoYoLAB asked for verification. Try again in a few minutes.",
      retcode,
    );
  }
  if (PRIVATE_RETCODES.has(retcode)) {
    return new AppError(
      "CHRONICLE_PRIVATE",
      "Your Battle Chronicle is private. On HoYoLAB, open Battle Chronicle → Settings, make it public, then try again.",
      retcode,
    );
  }
  return new AppError("HOYOLAB_ERROR", `HoYoLAB: ${message} (retcode ${retcode})`, retcode);
}

function isNetworkError(error: unknown): boolean {
  // fetch throws TypeError("fetch failed") on network failure; AbortSignal.timeout
  // throws TimeoutError. Other TypeErrors are bugs.
  return (
    (error instanceof TypeError && error.message === "fetch failed") ||
    (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError"))
  );
}

// Anything that isn't an AppError, a HoyolabError or a network failure is a bug and is
// rethrown, so Next.js answers 500.
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof HoyolabError) return classifyHoyolabError(error);
  if (isNetworkError(error)) {
    // Log only the name: the HTTP layer's messages and causes must never risk
    // carrying the cookie into the logs.
    console.error("HoYoLAB request failed:", (error as Error).name);
    return new AppError("UPSTREAM_UNREACHABLE", "Couldn't reach HoYoLAB. Try again later.");
  }
  throw error;
}

export function errorResponse(error: unknown): Response {
  const { code, message, retcode } = toAppError(error);
  return Response.json({ error: { code, message, retcode } }, { status: STATUS[code] });
}
