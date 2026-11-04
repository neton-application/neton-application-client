export const LANGUAGE_PATH = "/app/account/preferences/app.language";
interface Preference { value?: unknown; version: number }
type Request = <T>(path: string, init?: RequestInit) => Promise<T>;

/** Options that bind a request to the identity that started it, so a subject switch can cancel it. */
export interface PreferenceRequestOptions {
  /** Cancels the in-flight request when the active subject changes. */
  signal?: AbortSignal;
  /** False once the caller's subject is no longer current: the write must not land on another account. */
  isCurrent?: () => boolean;
  subjectKey?: string;
}

/**
 * Account JSON string preference `app.language`, read via optimistic-concurrency write.
 * Upstream only writes the canonical namespace. Forks with historical custom keys must perform
 * an explicit, bounded data migration; the shared runtime does not silently read or dual-write them.
 *
 * `isCurrent` is checked before both the version read and the write: once the identity has
 * changed the request is abandoned (an `AbortError`) so a slower subject A can never persist
 * its language onto subject B.
 */
export function createLocalePreferences(request: Request, authenticated: () => Promise<boolean | string>) {
  const superseded = () => new DOMException("SUPERSEDED", "AbortError");
  async function session(options: PreferenceRequestOptions) {
    const subject = await authenticated();
    if (options.isCurrent && !options.isCurrent()) throw superseded();
    if (options.subjectKey && !subject) throw Object.assign(new Error("SESSION_EXPIRED"), { name: "SessionExpiredError" });
    if (options.subjectKey && subject !== options.subjectKey) throw new DOMException("SUBJECT_CHANGED", "AbortError");
    return subject;
  }
  const headers = (options: PreferenceRequestOptions) => options.subjectKey
    ? { "X-Neton-Preference-Subject": options.subjectKey } : undefined;
  return {
    async load(options: PreferenceRequestOptions = {}): Promise<string | null | undefined> {
      const { signal, isCurrent = () => true } = options;
      const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000);
      const subject = await session(options);
      if (!subject) return undefined;
      const bound = typeof subject === "string" ? { ...options, subjectKey: subject } : options;
      if (!isCurrent()) throw superseded();
      const value = (await request<Preference>(LANGUAGE_PATH, { signal: requestSignal, headers: headers(bound) })).value;
      if (!isCurrent()) throw superseded();
      return typeof value === "string" ? value : null;
    },
    async save(locale: string, options: PreferenceRequestOptions = {}): Promise<void> {
      const { signal, isCurrent = () => true } = options;
      const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000);
      const subject = await session(options);
      if (!subject) return;
      const bound = typeof subject === "string" ? { ...options, subjectKey: subject } : options;
      if (!isCurrent()) throw superseded();
      const current = await request<Preference>(LANGUAGE_PATH, { signal: requestSignal, headers: headers(bound) });
      // Conflicts and read/write failures must reach the UI, never silently overwrite.
      // Re-check before writing: a subject switch mid-read must not target the new account.
      if (!isCurrent()) throw superseded();
      await request<Preference>(LANGUAGE_PATH, {
        method: "PUT", body: JSON.stringify({ value: locale, version: current.version }), signal: requestSignal, headers: headers(bound),
      });
    },
  };
}

/** Per-host lifecycle, independent of React. Aborting a fetch is not a server-side rollback. */
export function createPreferenceLifecycle() {
  let subject: string | undefined;
  let epoch = 0;
  const pending = new Set<AbortController>();
  let writeGate: Promise<void> | undefined;
  const invalidate = () => {
    epoch += 1;
    for (const controller of pending) controller.abort();
    pending.clear();
  };
  return {
    bind(next: string | undefined) {
      if (next !== subject) { subject = next; invalidate(); }
    },
    async run<T>(operation: (options: PreferenceRequestOptions) => Promise<T>, writing = false): Promise<T> {
      const scheduledSubject = subject;
      if (!writing) {
        while (writeGate) await writeGate;
        if (subject !== scheduledSubject) throw new DOMException("SUPERSEDED", "AbortError");
      }
      if (writing) invalidate(); // a pending old read must not undo a new manual selection
      let release: (() => void) | undefined;
      const gate = writing ? new Promise<void>((resolve) => { release = resolve; }) : undefined;
      if (gate) writeGate = gate;
      const generation = epoch;
      const controller = new AbortController();
      pending.add(controller);
      const isCurrent = () => generation === epoch;
      try {
        const value = await operation({ signal: controller.signal, isCurrent, subjectKey: subject });
        if (!isCurrent()) throw new DOMException("SUPERSEDED", "AbortError");
        return value;
      } catch (error) {
        if (!isCurrent()) throw new DOMException("SUPERSEDED", "AbortError");
        throw error;
      } finally {
        pending.delete(controller);
        release?.();
        if (writeGate === gate) writeGate = undefined;
      }
    },
  };
}
