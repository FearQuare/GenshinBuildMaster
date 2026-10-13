import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeEntries, parseRosterFile, RosterFileError, toRosterFile } from "./roster-file";

const KNOWN = new Set(["hu-tao", "bennett", "xingqiu"]);

test("toRosterFile round-trips through parseRosterFile", () => {
  const entries = [
    { id: "hu-tao", addedAt: "2026-10-01T10:00:00.000Z" },
    { id: "bennett", addedAt: "2026-10-02T10:00:00.000Z" },
  ];
  const file = toRosterFile(entries, new Date("2026-10-13T00:00:00.000Z"));
  assert.equal(file.app, "genshin-build-master");
  assert.equal(file.exportedAt, "2026-10-13T00:00:00.000Z");
  assert.deepEqual(parseRosterFile(JSON.stringify(file), KNOWN), { entries, skipped: 0 });
});

test("parseRosterFile skips unknown ids and duplicates, and repairs bad dates", () => {
  const text = JSON.stringify({
    app: "genshin-build-master",
    version: 1,
    ownedCharacters: [
      { id: "hu-tao", addedAt: "2026-10-01T10:00:00.000Z" },
      { id: "hu-tao", addedAt: "2026-10-05T10:00:00.000Z" },
      { id: "not-a-character", addedAt: "2026-10-01T10:00:00.000Z" },
      { id: 42 },
      { id: "xingqiu", addedAt: "yesterday" },
    ],
  });
  const { entries, skipped } = parseRosterFile(text, KNOWN);
  assert.equal(skipped, 2);
  assert.deepEqual(entries.map((e) => e.id), ["hu-tao", "xingqiu"]);
  assert.equal(entries[0].addedAt, "2026-10-01T10:00:00.000Z");
  assert.ok(!Number.isNaN(new Date(entries[1].addedAt).getTime()));
});

test("parseRosterFile rejects files that aren't roster exports", () => {
  assert.throws(() => parseRosterFile("{nope", KNOWN), RosterFileError);
  assert.throws(() => parseRosterFile('{"app":"other","ownedCharacters":[]}', KNOWN), /isn't a Genshin Build Master roster/);
  assert.throws(
    () => parseRosterFile('{"app":"genshin-build-master","version":2,"ownedCharacters":[]}', KNOWN),
    /newer version/,
  );
});

test("mergeEntries keeps existing entries and adds only new ones", () => {
  const current = [{ id: "hu-tao", addedAt: "2026-10-01T00:00:00.000Z" }];
  const incoming = [
    { id: "hu-tao", addedAt: "2026-12-01T00:00:00.000Z" },
    { id: "bennett", addedAt: "2026-12-01T00:00:00.000Z" },
  ];
  assert.deepEqual(mergeEntries(current, incoming), [current[0], incoming[1]]);
});
