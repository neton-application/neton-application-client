import { test } from "node:test";
import assert from "node:assert/strict";
import { createLocalePreferences, createPreferenceLifecycle, LANGUAGE_PATH } from "../apps/console/src/lib/locale-preference-store.ts";

test("a revalidation begun during a save waits for that save and does not cancel it", async () => {
  const lifecycle = createPreferenceLifecycle();
  lifecycle.bind("alice");
  let finish!: () => void;
  let stored = "en-US";
  let reads = 0;
  const write = lifecycle.run(async () => {
    await new Promise<void>((resolve) => { finish = resolve; });
    stored = "zh-CN";
  }, true);
  const read = lifecycle.run(async () => { reads++; return stored; });
  await Promise.resolve();
  assert.equal(reads, 0);
  finish();
  await write;
  assert.equal(await read, "zh-CN");
});
test("anonymous selection stays local but an expired authenticated session is not supersession", async () => {
  const preferences = createLocalePreferences(async () => { throw new Error("must not request"); }, async () => false);
  assert.equal(await preferences.load(), undefined);
  await preferences.save("en-US");
  await assert.rejects(preferences.save("en-US", { subjectKey: "alice" }), { name: "SessionExpiredError" });
});

test("canonical preference wins with a single read", async () => {
  const paths: string[] = [];
  const store = createLocalePreferences(async (path) => {
    paths.push(path); return { value: "en-US", version: 2 } as never;
  }, async () => true);
  assert.equal(await store.load(), "en-US");
  assert.deepEqual(paths, [LANGUAGE_PATH]);
});
test("write errors are not reported as success", async () => {
  const store = createLocalePreferences(async (_path, init) => {
    if (init?.method === "PUT") throw new Error("unavailable");
    return { value: "en-US", version: 3 } as never;
  }, async () => true);
  await assert.rejects(store.save("zh-CN"), /unavailable/);
});
test("authentication is checked again after login, not cached", async () => {
  let authenticated = false;
  const store = createLocalePreferences(async () => ({ value: "en-US", version: 1 }) as never, async () => authenticated);
  assert.equal(await store.load(), undefined);
  authenticated = true;
  assert.equal(await store.load(), "en-US");
});
test("a missing canonical preference reads null with a single request (no fallback reads)", async () => {
  let calls = 0;
  const store = createLocalePreferences(async () => {
    calls++; return { value: null, version: 4 } as never;
  }, async () => true);
  assert.equal(await store.load(), null);
  assert.equal(calls, 1);
});

test("save conflict does not retry and overwrite another device", async () => {
  let writes = 0;
  const conflict = { details: { code: 10205, status: 200 } };
  const store = createLocalePreferences(async (_path, init) => {
    if (init?.method === "PUT") { writes++; throw conflict; }
    return { value: "en-US", version: 2 } as never;
  }, async () => true);
  await assert.rejects(store.save("zh-CN"), (error) => error === conflict);
  assert.equal(writes, 1);
});

test("a changed server session cannot retarget a stale subject's write", async () => {
  let calls = 0;
  const store = createLocalePreferences(async () => { calls++; return {} as never; }, async () => "bob");
  await assert.rejects(store.save("en-US", { subjectKey: "alice" }), { name: "AbortError" });
  assert.equal(calls, 0);
});

test("the subject is bound at both preference requests", async () => {
  const headers: string[] = [];
  const store = createLocalePreferences(async (_path, init) => {
    headers.push(new Headers(init?.headers).get("X-Neton-Preference-Subject")!);
    return { version: 1 } as never;
  }, async () => "alice");
  await store.save("en-US", { subjectKey: "alice" });
  assert.deepEqual(headers, ["alice", "alice"]);
});

test("a manual save supersedes a slow preference read even when the transport ignores abort", async () => {
  const lifecycle = createPreferenceLifecycle();
  lifecycle.bind("alice");
  let finish!: (value: string) => void;
  const read = lifecycle.run(() => new Promise<string>((resolve) => { finish = resolve; }));
  const rejected = assert.rejects(read, { name: "AbortError" });
  await lifecycle.run(async () => undefined, true);
  finish("old-language");
  await rejected;
});

test("an old write completion cannot roll back the next subject", async () => {
  const lifecycle = createPreferenceLifecycle();
  lifecycle.bind("alice");
  let finish!: () => void;
  const write = lifecycle.run(() => new Promise<void>((resolve) => { finish = resolve; }), true);
  const rejected = assert.rejects(write, { name: "AbortError" });
  lifecycle.bind("bob");
  finish();
  await rejected;
});

test("save abandons the write when the subject changed during the version read", async () => {
  let writes = 0;
  let current = true;
  const store = createLocalePreferences(async (_path, init) => {
    if (init?.method === "PUT") { writes++; return {} as never; }
    current = false; // the identity switched while reading the version
    return { value: "en-US", version: 2 } as never;
  }, async () => true);
  await assert.rejects(
    store.save("zh-CN", { isCurrent: () => current }),
    (error) => error instanceof DOMException && error.name === "AbortError",
  );
  assert.equal(writes, 0, "a stale subject's write must never reach the new account");
});

test("load is dropped when the subject is already gone at request time", async () => {
  let reads = 0;
  const store = createLocalePreferences(async () => { reads++; return { value: "en-US", version: 1 } as never; }, async () => true);
  await assert.rejects(
    store.load({ isCurrent: () => false }),
    (error) => error instanceof DOMException && error.name === "AbortError",
  );
  assert.equal(reads, 0, "a superseded subject never issues the read");
});
