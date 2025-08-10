export function getUserId(extra: {
  authInfo?: { clientId?: string; extra?: unknown };
}) {
  const fromExtra = (extra.authInfo?.extra as { userId?: string } | undefined)
    ?.userId;
  const id = fromExtra ?? extra.authInfo?.clientId;
  if (!id) throw new Error("No authenticated user.");
  return id;
}
