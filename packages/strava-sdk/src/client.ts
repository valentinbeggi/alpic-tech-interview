export const STRAVA_API = "https://www.strava.com/api/v3";

export type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix seconds
};

export type TokenRefresher = () => Promise<TokenBundle>;

/** Minimal activity types we actually use. */
export interface ActivitySummary {
  id: number;
  name: string;
  start_date_local: string; // "YYYY-MM-DDTHH:mm:ssZ" from API
  sport_type?: string; // e.g. "Run", "Workout"
  type?: string; // legacy type, e.g. "Run", "Workout"
  [k: string]: unknown;
}

export interface Activity extends ActivitySummary {
  // Activity detail fields (subset)
  description?: string | null;
  private?: boolean;
  distance?: number;
  elapsed_time?: number;
  moving_time?: number;
  timezone?: string;
  [k: string]: unknown;
}

export interface ListActivitiesParams {
  page?: number;
  per_page?: number; // default: 30, max 200
  before?: number; // unix seconds
  after?: number; // unix seconds
}

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
    // refresh once if expiring soon
    const fresh = await getTokens();
    accessToken = fresh.accessToken;
  }

  let res = await doFetch(accessToken);
  if (res.status === 401) {
    const fresh = await getTokens();
    res = await doFetch(fresh.accessToken);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const Strava = (getTokens: TokenRefresher) => ({
  /** POST /activities */
  createManualActivity: (input: Record<string, unknown>): Promise<Activity> =>
    stravaFetch<Activity>(
      "/activities",
      { method: "POST", body: JSON.stringify(input) },
      getTokens
    ),

  /** PUT /activities/{id} */
  updateActivity: (
    id: number,
    body: Record<string, unknown>
  ): Promise<Activity> =>
    stravaFetch<Activity>(
      `/activities/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      getTokens
    ),

  /** GET /activities/{id} */
  getActivityById: (id: number): Promise<Activity> =>
    stravaFetch<Activity>(`/activities/${id}`, { method: "GET" }, getTokens),

  /** GET /athlete/activities (newest first) */
  listMyActivities: (
    params?: ListActivitiesParams
  ): Promise<ActivitySummary[]> => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.per_page) q.set("per_page", String(params.per_page));
    if (params?.before) q.set("before", String(params.before));
    if (params?.after) q.set("after", String(params.after));
    const qs = q.toString() ? `?${q.toString()}` : "";
    return stravaFetch<ActivitySummary[]>(
      `/athlete/activities${qs}`,
      { method: "GET" },
      getTokens
    );
  },

  /** POST /uploads (multipart) */
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

  /** GET /uploads/{uploadId} */
  checkUpload: (uploadId: number) =>
    stravaFetch<{ id: number; status: string; error?: string }>(
      `/uploads/${uploadId}`,
      { method: "GET" },
      getTokens
    ),

  /** PUT /segments/{id}/starred */
  starSegment: (segmentId: number, starred: boolean): Promise<Activity> =>
    stravaFetch<Activity>(
      `/segments/${segmentId}/starred`,
      { method: "PUT", body: JSON.stringify({ starred }) },
      getTokens
    ),

  /** PUT /athlete */
  updateAthlete: (body: Record<string, unknown>) =>
    stravaFetch(
      `/athlete`,
      { method: "PUT", body: JSON.stringify(body) },
      getTokens
    ),

  /** GET /athlete */
  me: () => stravaFetch(`/athlete`, { method: "GET" }, getTokens),
});

export type StravaClient = ReturnType<typeof Strava>;
