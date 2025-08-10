import NextAuth from "next-auth";
import Strava from "next-auth/providers/strava";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, schema } from "./db";

export const { handlers, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Strava({
      clientId: process.env.AUTH_STRAVA_ID!,
      clientSecret: process.env.AUTH_STRAVA_SECRET!,
    }),
  ],
  session: { strategy: "database" },
});
