import type {
  ApiEnvelope,
  Credentials,
  RawCharacterDetail,
  RawCharacterList,
  RawGameRecordCard,
  RawIndex,
  RawUserFullInfo,
  Server,
} from "./types";

// Talks to the HoYoLAB Battle Chronicle web API. Server-only: the browser can't set the
// Cookie header and HoYoLAB blocks cross-origin calls. Every function takes the
// credentials as an argument; nothing here reads global config.
//
// ltoken is a password. It only ever goes into the Cookie header below: never into a
// URL, a log line or an error message.

const BBS_BASE = "https://bbs-api-os.hoyolab.com";
const RECORD_BASE = "https://sg-act-public-api.hoyolab.com/event/game_record";
const TIMEOUT_MS = 15_000;

export class HoyolabError extends Error {
  constructor(
    readonly retcode: number,
    message: string,
  ) {
    super(message);
    this.name = "HoyolabError";
  }
}

export type RequestContext = { credentials: Credentials; deviceId: string };

export async function request<T>(
  { credentials, deviceId }: RequestContext,
  method: "GET" | "POST",
  url: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      Cookie: `ltuid_v2=${credentials.ltuid}; ltoken_v2=${credentials.ltoken}`,
      "Content-Type": "application/json",
      "x-rpc-client_type": "5",
      "x-rpc-app_version": "1.5.0",
      "x-rpc-language": "en-us",
      "x-rpc-lang": "en-us",
      "x-rpc-platform": "4",
      "x-rpc-device_id": deviceId,
      Origin: "https://act.hoyolab.com",
      Referer: "https://act.hoyolab.com/",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // HoYoLAB answers 200 even for most errors, so the retcode is what matters.
  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new HoyolabError(-1, `HoYoLAB returned an unreadable response (HTTP ${response.status})`);
  }
  if (envelope.retcode !== 0) {
    throw new HoyolabError(envelope.retcode, envelope.message || "Unknown HoYoLAB error");
  }
  if (envelope.data == null) {
    throw new HoyolabError(-1, "HoYoLAB returned no data");
  }
  return envelope.data;
}

export function getUserFullInfo(ctx: RequestContext) {
  return request<RawUserFullInfo>(
    ctx,
    "GET",
    `${BBS_BASE}/community/user/wapi/getUserFullInfo?gid=2`,
  );
}

export function getGameRecordCard(ctx: RequestContext, hoyolabUid: string) {
  return request<RawGameRecordCard>(
    ctx,
    "GET",
    `${RECORD_BASE}/card/wapi/getGameRecordCard?uid=${encodeURIComponent(hoyolabUid)}`,
  );
}

export function getIndex(ctx: RequestContext, roleId: string, server: Server) {
  const query = new URLSearchParams({ role_id: roleId, server, avatar_list_type: "0" });
  return request<RawIndex>(ctx, "GET", `${RECORD_BASE}/genshin/api/index?${query}`);
}

export function getCharacterList(ctx: RequestContext, roleId: string, server: Server) {
  return request<RawCharacterList>(ctx, "POST", `${RECORD_BASE}/genshin/api/character/list`, {
    role_id: roleId,
    server,
    sort_type: 1,
  });
}

export function getCharacterDetail(
  ctx: RequestContext,
  roleId: string,
  server: Server,
  characterId: number,
) {
  return request<RawCharacterDetail>(ctx, "POST", `${RECORD_BASE}/genshin/api/character/detail`, {
    role_id: roleId,
    server,
    character_ids: [characterId],
  });
}
