import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUserId } from "./getUserId";
import { daysBetween, PARIS_TZ, toLocalISOString } from "./toLocalIsoString";
import { StravaClient } from "@strava/sdk";
import { findLatestActivity, findLatestActivities } from "./stravaHelpers";
import {
  createManualShape,
  getActivityShape,
  getLastActivityShape,
  getRecentActivitiesShape,
  renameActivityShape,
  renameArgsShape,
} from "./schemas";

export type StravaClientFactory = (userId: string) => Promise<StravaClient>;

export function registerStravaMcp(
  server: McpServer,
  deps: { getClient: StravaClientFactory }
) {
  server.registerTool(
    "strava.createManualActivity",
    {
      title: "Create manual activity",
      description: "Create a manual activity on Strava.",
      inputSchema: createManualShape,
    },
    async (args, extra) => {
      const input = z.object(createManualShape).parse(args);
      const userId = getUserId(extra);
      const client = await deps.getClient(userId);

      const cleaned = String(input.start_date_local).replace(
        /([Zz]|[+-]\d{2}:?\d{2})$/,
        ""
      );
      const start = new Date(cleaned);
      if (Number.isNaN(start.getTime())) {
        throw new Error(
          `Invalid start_date_local "${
            input.start_date_local
          }". Use "YYYY-MM-DDTHH:mm:ss" in ${PARIS_TZ}, e.g. "${toLocalISOString(
            new Date(),
            PARIS_TZ
          )}".`
        );
      }

      const today = new Date();
      if (daysBetween(start, today) > 2) {
        throw new Error(
          `This looks older than 2 days (${cleaned}). If you intended a past date, say it explicitly (e.g. "on 2025-08-03 at 09:00"). Otherwise, use today's date in ${PARIS_TZ}.`
        );
      }

      const activity = { ...input, start_date_local: cleaned };
      const res = await client.createManualActivity(activity);
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  server.registerTool(
    "strava.getActivity",
    {
      title: "Get activity by ID",
      description: "Fetch a Strava activity by its numeric ID.",
      inputSchema: getActivityShape,
    },
    async (args, extra) => {
      const { id } = z.object(getActivityShape).parse(args);
      const userId = getUserId(extra);
      const client = await deps.getClient(userId);
      const res = await client.getActivityById(id);
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  server.registerTool(
    "strava.getLastActivity",
    {
      title: "Get last activity",
      description:
        "Fetch the most recent activity (optionally filter by sport like 'Run' or 'Workout').",
      inputSchema: getLastActivityShape,
    },
    async (args, extra) => {
      const { sport } = z.object(getLastActivityShape).parse(args);
      const userId = getUserId(extra);
      const client = await deps.getClient(userId);
      const latest = await findLatestActivity(client, sport);
      if (!latest) throw new Error("No activities found for this account.");
      return { content: [{ type: "text", text: JSON.stringify(latest) }] };
    }
  );

  server.registerTool(
    "strava.getRecentActivities",
    {
      title: "Get recent activities",
      description:
        "Fetch the last N activities (optionally filter by sport like 'Run' or 'Workout').",
      inputSchema: getRecentActivitiesShape,
    },
    async (args, extra) => {
      const { count, sport } = z.object(getRecentActivitiesShape).parse(args);
      const userId = getUserId(extra);
      const client = await deps.getClient(userId);
      const list = await findLatestActivities(client, count, sport);
      return { content: [{ type: "text", text: JSON.stringify(list) }] };
    }
  );

  server.registerTool(
    "strava.renameActivity",
    {
      title: "Rename activity",
      description:
        "Rename an activity. If 'id' is omitted, renames the most recent activity; if 'sport' is provided, renames the most recent activity matching that sport.",
      inputSchema: renameActivityShape,
    },
    async (args, extra) => {
      const { name, id, sport } = z.object(renameActivityShape).parse(args);
      const userId = getUserId(extra);
      const client = await deps.getClient(userId);

      let targetId = id;
      if (!targetId) {
        const latest = await findLatestActivity(client, sport);
        if (!latest) throw new Error("No activities found to rename.");
        targetId = latest.id;
      }

      const updated = await client.updateActivity(targetId, { name });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: updated.id,
              name: updated.name,
              url: `https://www.strava.com/activities/${updated.id}`,
            }),
          },
        ],
      };
    }
  );

  server.registerResource(
    "athlete",
    new ResourceTemplate("strava://athlete", {
      list: async () => ({
        resources: [{ name: "athlete", uri: "strava://athlete" }],
      }),
    }),
    {
      title: "Athlete profile",
      description: "Current athlete profile (JSON).",
      mimeType: "application/json",
    },
    async (uri, _params, extra) => {
      const userId = getUserId(extra);
      const client = await deps.getClient(userId);
      const me = await client.me();
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(me),
          },
        ],
      };
    }
  );

  const argsShape = renameArgsShape;
  server.registerPrompt(
    "rename-activity",
    {
      title: "Strava title generator",
      description:
        "Suggests short, friendly titles. Use 'strava.renameActivity' to apply.",
      argsSchema: argsShape,
    },
    (args) => {
      const raw = z.object(argsShape).parse(args);
      const { city, distanceKm, sport } = z
        .object({
          city: z.string().optional(),
          distanceKm: z.coerce.number().positive().max(1000).optional(),
          sport: z.string().optional(),
        })
        .parse(raw);

      return {
        messages: [
          {
            role: "assistant",
            content: {
              type: "text",
              text: "You generate concise, playful Strava titles.",
            },
          },
          {
            role: "user",
            content: {
              type: "text",
              text: `Title for a ${sport ?? "workout"}${
                distanceKm ? ` of ${distanceKm} km` : ""
              }${city ? ` in ${city}` : ""}.`,
            },
          },
        ],
      };
    }
  );
}
