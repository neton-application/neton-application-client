"use client";
import { apiFetch } from "@neton/application-client-runtime/client";
import { createLocalePreferences, createPreferenceLifecycle } from "./locale-preference-store";
import { loginHref } from "@neton/application-client-runtime/public";
import { site } from "@/generated/site.generated";

const preferences = createLocalePreferences(apiFetch, async () => {
  const res = await fetch("/api/session", { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error("SESSION_UNAVAILABLE");
  const body = await res.json();
  return body?.data?.authenticated === true ? String(body.data.user.userId) : false;
});

/**
 * The console can swap the authenticated identity while staying on the same path (re-auth in
 * another tab, then a client navigation that re-renders the protected layout for a different
 * member). Load and save must follow *that* identity, never the one that started an in-flight
 * request. `setActiveSubject` is the single source of truth the provider calls on every subject
 * change; it bumps an epoch, aborts the previous subject's pending requests, and lets `load`/`save`
 * detect that they were superseded and drop their result without touching the new account.
 */
const lifecycle = createPreferenceLifecycle();

/** Bind subsequent reads/writes to `subject`; discards anything the previous subject left in flight. */
export function setActiveSubject(subject: string | undefined): void {
  lifecycle.bind(subject);
}

/** True when a rejection came from a subject switch rather than a real failure — the UI should stay silent. */
export function isSuperseded(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function subjectChanged(error: unknown): never {
  // A cookie changed outside this mounted protected layout. Drop the whole previous user's
  // workspace, not only its language; an RSC refresh can retain the old client-side store.
  if (error instanceof DOMException && error.message === "SUBJECT_CHANGED") window.location.reload();
  if (error instanceof Error && error.name === "SessionExpiredError") {
    window.location.assign(loginHref(window.location.pathname + window.location.search, site.consoleBasePath));
  }
  throw error;
}

export function loadUserLocale(): Promise<string | null | undefined> {
  return lifecycle.run((options) => preferences.load(options)).catch(subjectChanged);
}

export function saveUserLocale(locale: string): Promise<void> {
  return lifecycle.run((options) => preferences.save(locale, options), true).catch(subjectChanged);
}
