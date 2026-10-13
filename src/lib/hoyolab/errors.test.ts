import assert from "node:assert/strict";
import { test } from "node:test";
import { HoyolabError } from "./client";
import { AppError, classifyHoyolabError, errorResponse, toAppError } from "./errors";

test("retcode -100 is an expired login", () => {
  const error = classifyHoyolabError(new HoyolabError(-100, "Please login"));
  assert.equal(error.code, "LOGIN_EXPIRED");
  assert.equal(error.message, "Your HoYoLAB login expired. Paste fresh ltuid_v2 and ltoken_v2.");
});

test("retcode 1034 and captcha messages ask for verification", () => {
  assert.equal(classifyHoyolabError(new HoyolabError(1034, "x")).code, "VERIFICATION_REQUIRED");
  assert.equal(
    classifyHoyolabError(new HoyolabError(5003, "Please complete the captcha")).code,
    "VERIFICATION_REQUIRED",
  );
});

test("retcode 10102 is a private Battle Chronicle", () => {
  assert.equal(classifyHoyolabError(new HoyolabError(10102, "Data is not public")).code, "CHRONICLE_PRIVATE");
});

test("other retcodes keep HoYoLAB's message and the retcode", () => {
  const error = classifyHoyolabError(new HoyolabError(-1, "Something broke"));
  assert.equal(error.code, "HOYOLAB_ERROR");
  assert.equal(error.message, "HoYoLAB: Something broke (retcode -1)");
  assert.equal(error.retcode, -1);
});

test("network failures become UPSTREAM_UNREACHABLE; bugs are rethrown", () => {
  const original = console.error;
  console.error = () => {};
  try {
    assert.equal(toAppError(new TypeError("fetch failed")).code, "UPSTREAM_UNREACHABLE");
  } finally {
    console.error = original;
  }
  assert.throws(() => toAppError(new RangeError("bug")), RangeError);
});

test("errorResponse uses the code's HTTP status", async () => {
  const response = errorResponse(new AppError("NOT_CONNECTED", "Connect first."));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: { code: "NOT_CONNECTED", message: "Connect first." },
  });
});
