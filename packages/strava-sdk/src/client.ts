const STRAVA_API = "https://www.strava.com/api/v3";

export type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type TokenRefresher = () => Promise<TokenBundle>;

async function stravaFetch<T>(
  path: string,
  init: RequestInit,
  getTokens: TokenRefresher
): Promise<T> {
  let { accessToken, expiresAt } = await getTokens();
  const doFetch = async (token: string) =>
    fetch(`${STRAVA_API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

  const now = Math.floor(Date.now() / 1000);
  if (expiresAt - now <= 60) {
    await getTokens();
    const a = await getTokens();
    accessToken = a.accessToken;
  }

  let res = await doFetch(accessToken);
  if (res.status === 401) {
    await getTokens();
    const a = await getTokens();
    res = await doFetch(a.accessToken);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const Strava = (getTokens: TokenRefresher) => ({
  createManualActivity: (input: Record<string, unknown>) =>
    stravaFetch(
      "/activities",
      { method: "POST", body: JSON.stringify(input) },
      getTokens
    ),

  updateActivity: (id: number, body: Record<string, unknown>) =>
    stravaFetch(
      `/activities/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      getTokens
    ),

  uploadFile: (
    file: File | Blob,
    data_type: "fit" | "gpx" | "tcx",
    name?: string
  ) =>
    (async () => {
      const tokens = await getTokens();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("data_type", data_type);
      if (name) fd.append("name", name);

      const res = await fetch(`${STRAVA_API}/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        body: fd,
      });
      if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
      return (await res.json()) as { id: number; status: string };
    })(),

  checkUpload: (uploadId: number) =>
    stravaFetch(`/uploads/${uploadId}`, { method: "GET" }, getTokens),

  starSegment: (segmentId: number, starred: boolean) =>
    stravaFetch(
      `/segments/${segmentId}/starred`,
      {
        method: "PUT",
        body: JSON.stringify({ starred }),
      },
      getTokens
    ),

  updateAthlete: (body: Record<string, unknown>) =>
    stravaFetch(
      `/athlete`,
      { method: "PUT", body: JSON.stringify(body) },
      getTokens
    ),

  me: () => stravaFetch(`/athlete`, { method: "GET" }, getTokens),
});

export type StravaClient = ReturnType<typeof Strava>;
