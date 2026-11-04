/** Match the existing session-error contract, excluding credential/business failures such as 10011. */
export function isSessionFailure(code: number): boolean {
  return [10000, 10001, 10002, 10003, 10005, 10006, 10009, 10010].includes(code);
}

export function preferenceSubjectRejection(expected: string, profile: { code: number; data?: { id: string | number } }): Response | null {
  if (isSessionFailure(profile.code)) return null; // let the original endpoint return its normal 401
  if (profile.code !== 0 || profile.data?.id === undefined) {
    return Response.json({ code: 3, message: "PREFERENCE_IDENTITY_UNAVAILABLE" }, {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    });
  }
  if (String(profile.data.id) === expected) return null;
  return Response.json({ code: 10205, message: "PREFERENCE_SUBJECT_CHANGED" }, {
    status: 409, headers: { "Cache-Control": "private, no-store" },
  });
}
