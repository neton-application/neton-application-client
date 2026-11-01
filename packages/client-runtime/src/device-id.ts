/**
 * Browser device id (ecosystem device-id contract).
 *
 * The id is a random RFC 4122 UUID v4 in lowercase hyphenated form. The browser generates it once from a
 * secure random source, persists it, and sends it with every login / register; the Next.js route handlers
 * only forward it (they must never invent one per request). The backend rejects anything else with
 * `DEVICE_ID_REQUIRED` / `INVALID_DEVICE_ID`.
 */

export const DEVICE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** localStorage key holding this browser's device id. */
export const DEVICE_ID_STORAGE_KEY = "neton.deviceId";

export function isDeviceId(value: unknown): value is string {
  return typeof value === "string" && DEVICE_ID_PATTERN.test(value);
}

/** The subset of Web Crypto the generator needs (injectable for tests). */
export interface DeviceIdCrypto {
  randomUUID?: () => string;
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
}

/** A fresh UUID v4 from a secure random source; never Math.random. */
export function generateDeviceId(source: DeviceIdCrypto = globalThis.crypto): string {
  if (typeof source.randomUUID === "function") {
    const id = source.randomUUID().toLowerCase();
    if (isDeviceId(id)) return id;
  }
  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Minimal Storage shape (injectable for tests). */
export interface DeviceIdStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let memoryDeviceId: string | undefined;

function defaultStorage(): DeviceIdStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined; // storage disabled (privacy mode / blocked third-party context)
  }
}

/**
 * This browser's persisted device id, generating and storing it on first use. A stored value that does not
 * match the contract is replaced. Without usable storage the id lives for the page lifetime only.
 */
export function getOrCreateDeviceId(storage: DeviceIdStorage | undefined = defaultStorage()): string {
  try {
    const stored = storage?.getItem(DEVICE_ID_STORAGE_KEY);
    if (isDeviceId(stored)) return stored;
  } catch {
    // unreadable storage: fall through to a new id
  }
  // Remember the id in memory too, so a page whose storage write fails keeps one id for its lifetime.
  const id = (memoryDeviceId ??= generateDeviceId());
  try {
    storage?.setItem(DEVICE_ID_STORAGE_KEY, id);
  } catch {
    // quota / disabled storage: still return a valid id for this request
  }
  return id;
}
