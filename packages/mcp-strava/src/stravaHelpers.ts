import { ActivitySummary, StravaClient } from "@strava/sdk";

function matchesSport(a: ActivitySummary, want?: string) {
  if (!want) return true;
  const target = want.trim().toLowerCase();
  const s1 = (a.sport_type ?? "").toLowerCase();
  const s2 = (a.type ?? "").toLowerCase();
  return s1 === target || s2 === target;
}

export async function findLatestActivity(
  client: StravaClient,
  sport?: string
): Promise<ActivitySummary | undefined> {
  const batch = await client.listMyActivities({ per_page: 50 });
  return batch.find((a) => matchesSport(a, sport)) ?? batch[0];
}

export async function findLatestActivities(
  client: StravaClient,
  count: number,
  sport?: string
): Promise<ActivitySummary[]> {
  const out: ActivitySummary[] = [];
  let page = 1;
  const per_page = Math.min(Math.max(count, 30), 200);
  while (out.length < count) {
    const batch = await client.listMyActivities({ page, per_page });
    if (!batch.length) break;
    for (const a of batch) {
      if (matchesSport(a, sport)) out.push(a);
      if (out.length >= count) break;
    }
    page++;
    if (page > 10) break;
  }
  return out.slice(0, count);
}
