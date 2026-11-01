import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { test } from "node:test";
import { DEVICE_ID_STORAGE_KEY, generateDeviceId, getOrCreateDeviceId, isDeviceId, type DeviceIdStorage } from "./device-id.ts";

function memoryStorage(initial: Record<string, string> = {}): DeviceIdStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

test("accepts only lowercase hyphenated UUID v4", () => {
  assert.ok(isDeviceId("3f2b8c4e-9a1d-4e2f-8b3c-1d2e3f4a5b6c"));
  for (const bad of [
    "3F2B8C4E-9A1D-4E2F-8B3C-1D2E3F4A5B6C", // uppercase
    "3f2b8c4e9a1d4e2f8b3c1d2e3f4a5b6c", // no hyphens
    "3f2b8c4e-9a1d-5e2f-8b3c-1d2e3f4a5b6c", // v5
    "3f2b8c4e-9a1d-4e2f-cb3c-1d2e3f4a5b6c", // wrong variant
    "web", "", undefined, 42,
  ]) assert.equal(isDeviceId(bad), false, String(bad));
});

test("generates v4 ids via randomUUID and via the getRandomValues fallback", () => {
  assert.ok(isDeviceId(generateDeviceId()));
  const fallback = { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) } as Parameters<typeof generateDeviceId>[0];
  const ids = new Set(Array.from({ length: 50 }, () => generateDeviceId(fallback)));
  assert.equal(ids.size, 50);
  for (const id of ids) assert.ok(isDeviceId(id), id);
  // all-ones bytes still come out with the version / variant bits set
  const ones = { getRandomValues: <T extends ArrayBufferView | null>(a: T) => { (a as unknown as Uint8Array).fill(0xff); return a; } };
  assert.equal(generateDeviceId(ones), "ffffffff-ffff-4fff-bfff-ffffffffffff");
});

test("persists one id and reuses it", () => {
  const storage = memoryStorage();
  const first = getOrCreateDeviceId(storage);
  assert.ok(isDeviceId(first));
  assert.equal(storage.data[DEVICE_ID_STORAGE_KEY], first);
  assert.equal(getOrCreateDeviceId(storage), first);
});

test("keeps a valid stored id and replaces a malformed one", () => {
  const kept = "3f2b8c4e-9a1d-4e2f-8b3c-1d2e3f4a5b6c";
  assert.equal(getOrCreateDeviceId(memoryStorage({ [DEVICE_ID_STORAGE_KEY]: kept })), kept);
  const storage = memoryStorage({ [DEVICE_ID_STORAGE_KEY]: "d-1700000000-abc" });
  const replaced = getOrCreateDeviceId(storage);
  assert.ok(isDeviceId(replaced));
  assert.equal(storage.data[DEVICE_ID_STORAGE_KEY], replaced);
});

test("still returns a stable valid id when storage throws", () => {
  const broken: DeviceIdStorage = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
  const a = getOrCreateDeviceId(broken);
  assert.ok(isDeviceId(a));
  assert.equal(getOrCreateDeviceId(broken), a);
});
