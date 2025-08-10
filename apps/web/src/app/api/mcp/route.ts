export const runtime = "nodejs";

import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { registerStravaMcp } from "@mcp/strava";
import { getUserStravaClient } from "@/lib/stravaClientFactory";

const baseHandler = createMcpHandler(
  (server) => {
    registerStravaMcp(server as any, { getClient: getUserStravaClient });
  },
  {},
  {
    basePath: "/api",
    verboseLogs: true,
  }
);

const handler = withMcpAuth(
  baseHandler,
  async (req, authHeader) => {
    const presented = (authHeader ?? "").replace(/^Bearer\s+/i, "").trim();
    const expected = (process.env.MCP_INTERNAL_TOKEN ?? "").trim();
    if (!expected || presented !== expected) return undefined;

    const userId = req.headers.get("x-user-id") ?? "unknown";

    return {
      token: "ok",
      scopes: ["strava"],
      clientId: userId,
      extra: { userId },
    };
  },
  { required: true }
);

export { handler as GET, handler as POST };
