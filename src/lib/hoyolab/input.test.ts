import assert from "node:assert/strict";
import { test } from "node:test";
import { AppError } from "./errors";
import { parseConnectInput, readJsonBody } from "./input";

const FAKE_TOKEN = "v2_FAKE-test-token";

function parseError(body: unknown): AppError {
  try {
    parseConnectInput(body);
  } catch (error) {
    assert.ok(error instanceof AppError);
    return error;
  }
  assert.fail("expected parseConnectInput to throw");
}

test("parseConnectInput accepts the required fields alone", () => {
  assert.deepEqual(parseConnectInput({ ltuid_v2: " 123456 ", ltoken_v2: FAKE_TOKEN }), {
    credentials: { ltuid: "123456", ltoken: FAKE_TOKEN },
    roleId: undefined,
    server: undefined,
    remember: false,
  });
});

test("parseConnectInput accepts the optional UID, server and remember", () => {
  const input = parseConnectInput({
    ltuid_v2: "123456",
    ltoken_v2: FAKE_TOKEN,
    role_id: "700000001",
    server: "os_euro",
    remember: true,
  });
  assert.equal(input.roleId, "700000001");
  assert.equal(input.server, "os_euro");
  assert.equal(input.remember, true);
});

test("parseConnectInput treats empty optional fields as missing", () => {
  const input = parseConnectInput({ ltuid_v2: "1", ltoken_v2: FAKE_TOKEN, role_id: " ", server: "" });
  assert.equal(input.roleId, undefined);
  assert.equal(input.server, undefined);
});

test("parseConnectInput requires ltuid_v2 and ltoken_v2", () => {
  assert.equal(parseError({ ltoken_v2: FAKE_TOKEN }).message, "ltuid_v2 is required.");
  assert.equal(parseError({ ltuid_v2: "1", ltoken_v2: "  " }).message, "ltoken_v2 is required.");
  assert.equal(parseError(null).code, "INVALID_INPUT");
});

test("parseConnectInput rejects malformed values", () => {
  assert.equal(parseError({ ltuid_v2: "abc", ltoken_v2: FAKE_TOKEN }).code, "INVALID_INPUT");
  assert.equal(parseError({ ltuid_v2: "1", ltoken_v2: FAKE_TOKEN, role_id: "12" }).code, "INVALID_INPUT");
  assert.equal(parseError({ ltuid_v2: "1", ltoken_v2: FAKE_TOKEN, role_id: 700000001 }).code, "INVALID_INPUT");
  assert.equal(parseError({ ltuid_v2: "1", ltoken_v2: FAKE_TOKEN, server: "cn_gf01" }).code, "INVALID_INPUT");
});

test("parseConnectInput rejects tokens that could inject cookies, without echoing them", () => {
  for (const ltoken_v2 of ["abc; account_id=1", "abc,def", "abc def", "tök"]) {
    const error = parseError({ ltuid_v2: "1", ltoken_v2 });
    assert.equal(error.code, "INVALID_INPUT");
    assert.ok(!error.message.includes(ltoken_v2));
  }
});

test("readJsonBody requires a JSON content type", async () => {
  const form = new Request("http://localhost", { method: "POST", body: "{}" });
  await assert.rejects(readJsonBody(form), { code: "INVALID_INPUT" });

  const json = new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: '{"a":1}',
  });
  assert.deepEqual(await readJsonBody(json), { a: 1 });
});
