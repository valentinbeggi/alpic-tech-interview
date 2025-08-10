import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import { Strava, StravaClient } from "@strava/sdk";

const TOKEN_URL = "https://www.strava.com/oauth/token";

export async function getUserStravaClient(
  userId: string
): Promise<StravaClient> {
  const tokenRefresher = async () => {
    const acc = await db.query.accounts.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.userId, userId), eq(t.provider, "strava")),
    });
    if (!acc) throw new Error("No Strava account linked");

    const now = Math.floor(Date.now() / 1000);

    if ((acc.expires_at ?? 0) - now <= 60) {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AUTH_STRAVA_ID!,
          client_secret: process.env.AUTH_STRAVA_SECRET!,
          grant_type: "refresh_token",
          refresh_token: acc.refresh_token ?? "",
        }),
      });

      if (!res.ok) throw new Error(`Refresh failed: ${await res.text()}`);

      const data = await res.json();

      await db
        .update(schema.accounts)
        .set({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
        })
        .where(eq(schema.accounts.providerAccountId, acc.providerAccountId));

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
      };
    }

    return {
      accessToken: acc.access_token!,
      refreshToken: acc.refresh_token ?? "",
      expiresAt: acc.expires_at ?? 0,
    };
  };

  return Strava(tokenRefresher);
}
