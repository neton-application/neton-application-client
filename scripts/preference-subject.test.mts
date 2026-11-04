import { test } from "node:test";
import assert from "node:assert/strict";
import { preferenceSubjectRejection, isSessionFailure } from "../apps/console/src/lib/preference-subject.ts";

test("only an authenticated mismatching subject yields a conflict", () => {
  assert.equal(preferenceSubjectRejection("42", { code: 0, data: { id: 42 } }), null);
  assert.equal(preferenceSubjectRejection("42", { code: 0, data: { id: 43 } })?.status, 409);
});
test("session rejection is left to the original authentication endpoint", () => {
  for (const code of [10000, 10001, 10002, 10003, 10005, 10006, 10009, 10010]) {
    assert.equal(isSessionFailure(code), true);
    assert.equal(preferenceSubjectRejection("42", { code }), null);
  }
  assert.equal(isSessionFailure(10011), false);
  assert.equal(isSessionFailure(3), false);
});
test("identity lookup outages fail closed as unavailable, never as an identity conflict", () => {
  assert.equal(preferenceSubjectRejection("42", { code: 3 })?.status, 503);
  assert.equal(preferenceSubjectRejection("42", { code: 0 })?.status, 503);
});
