import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getUserId } from "./getUserId";
import { daysBetween, PARIS_TZ, toLocalISOString } from "./toLocalIsoString";
import { ActivitySummary, StravaClient } from "@strava/sdk";

function matchesSport(a: ActivitySummary, want?: string) {
  if (!want) return true;
  const target = want.trim().toLowerCase();
  const s1 = (a.sport_type ?? "").toLowerCase();
  const s2 = (a.type ?? "").toLowerCase();
  return s1 === target || s2 === target;
}

async function findLatestActivity(
  client: StravaClient,
  sport?: string
): Promise<ActivitySummary | undefined> {
  const batch = await client.listMyActivities({ per_page: 50 });
  return batch.find((a) => matchesSport(a, sport)) ?? batch[0];
}

// New: fetch latest N activities with optional sport filter
async function findLatestActivities(
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

export type StravaClientFactory = (userId: string) => Promise<StravaClient>;

export function registerStravaMcp(
  server: McpServer,
  deps: { getClient: StravaClientFactory }
) {
  // ----- SCHEMAS -----
  const createManualShape = {
    name: z.string(),
    type: z.string().default("Workout"),
    start_date_local: z.string(), // "YYYY-MM-DDTHH:mm:ss" (local)
    elapsed_time: z.number(), // seconds
    description: z.string().optional(),
    distance: z.number().optional(), // meters
    commute: z.boolean().optional(),
    private: z.boolean().optional(),
  } as const;

  const updateAthleteShape = {
    weight: z.number().optional(),
  } as const;

  const starSegmentShape = {
    segmentId: z.number(),
    starred: z.boolean(),
  } as const;

  const getActivityShape = {
    id: z.number(),
  } as const;

  const getLastActivityShape = {
    sport: z.string().optional(), // e.g. "Run", "Workout"
  } as const;

  // New: recent activities schema
  const getRecentActivitiesShape = {
    count: z.number().int().positive().max(50).default(3),
    sport: z.string().optional(),
  } as const;

  const renameActivityShape = {
    name: z.string().min(1), // new title
    id: z.number().optional(), // optional explicit id
    sport: z.string().optional(), // optional selector when id omitted
  } as const;

  // ----- TOOLS -----

  // CREATE MANUAL ACTIVITY (with date guard)
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

      // Normalize / validate start_date_local — expect "YYYY-MM-DDTHH:mm:ss" (no timezone).
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

      // Guard: if more than 2 days in the past and not explicit, encourage confirmation
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

  // UPDATE ATHLETE
  server.registerTool(
    "strava.updateAthlete",
    {
      title: "Update athlete profile",
      description: "Update profile fields such as weight.",
      inputSchema: updateAthleteShape,
    },
    async (args, extra) => {
      const body = z.object(updateAthleteShape).parse(args);
      const userId = getUserId(extra);
      const client = await deps.getClient(userId);
      const res = await client.updateAthlete(body);
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  // STAR / UNSTAR SEGMENT
  server.registerTool(
    "strava.starSegment",
    {
      title: "Star/unstar a segment",
      description: "Manage starred segments.",
      inputSchema: starSegmentShape,
    },
    async (args, extra) => {
      const { segmentId, starred } = z.object(starSegmentShape).parse(args);
      const userId = getUserId(extra);
      const client = await deps.getClient(userId);
      const res = await client.starSegment(segmentId, starred);
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  // GET ACTIVITY BY ID (explicit)
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

  // GET LAST ACTIVITY (no id required; optional sport filter)
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

  // New: GET LAST N ACTIVITIES (optionally filter by sport)
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

  // RENAME ACTIVITY (no id required; picks latest or latest matching sport)
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

  // ----- RESOURCE (current athlete) -----
  server.registerResource(
    "athlete",
    new ResourceTemplate("strava://athlete/{userId}", { list: undefined }),
    {
      title: "Athlete profile",
      description: "Current athlete profile (JSON).",
      mimeType: "application/json",
    },
    async (_uri, _params, extra) => {
      const userId = getUserId(extra);
      const client = await deps.getClient(userId);
      const me = await client.me();
      return {
        contents: [
          {
            uri: `strava://athlete/${userId}`,
            mimeType: "application/json",
            text: JSON.stringify(me),
          },
        ],
      };
    }
  );

  // ----- PROMPT (generator only; does NOT rename) -----
  const renameArgsShape = {
    city: z.string().optional(),
    distanceKm: z.string().optional(),
    sport: z.string().optional(),
  } as const;

  server.registerPrompt(
    "rename-activity",
    {
      title: "Strava title generator",
      description:
        "Suggests short, friendly titles. Use 'strava.renameActivity' to apply.",
      argsSchema: renameArgsShape,
    },
    (args, _extra) => {
      const raw = z.object(renameArgsShape).parse(args);
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
