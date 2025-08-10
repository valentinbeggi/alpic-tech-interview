import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { StravaClient } from "@strava/sdk";

export type StravaClientFactory = (userId: string) => Promise<StravaClient>;

export function registerStravaMcp(
  server: McpServer,
  deps: { getClient: StravaClientFactory }
) {
  const createManualShape = {
    userId: z.string(),
    name: z.string(),
    type: z.string().default("Workout"),
    start_date_local: z.string(), // ISO
    elapsed_time: z.number(), // seconds
    description: z.string().optional(),
    distance: z.number().optional(), // meters
    commute: z.boolean().optional(),
    private: z.boolean().optional(),
  } as const;

  const updateAthleteShape = {
    userId: z.string(),
    weight: z.number().optional(),
  } as const;

  const starSegmentShape = {
    userId: z.string(),
    segmentId: z.number(),
    starred: z.boolean(),
  } as const;

  // ----------------- TOOLS -----------------
  server.registerTool(
    "strava.createManualActivity",
    {
      title: "Create manual activity",
      description: "Create a manual activity on Strava.",
      inputSchema: createManualShape,
    },
    async (args) => {
      const input = z.object(createManualShape).parse(args);
      const { userId, ...activity } = input;
      const client = await deps.getClient(userId);
      const res = await client.createManualActivity(activity);
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  server.registerTool(
    "strava.updateAthlete",
    {
      title: "Update athlete profile",
      description: "Update profile fields such as weight.",
      inputSchema: updateAthleteShape,
    },
    async (args) => {
      const { userId, ...body } = z.object(updateAthleteShape).parse(args);
      const client = await deps.getClient(userId);
      const res = await client.updateAthlete(body);
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  server.registerTool(
    "strava.starSegment",
    {
      title: "Star/unstar a segment",
      description: "Manage starred segments.",
      inputSchema: starSegmentShape,
    },
    async (args) => {
      const { userId, segmentId, starred } = z
        .object(starSegmentShape)
        .parse(args);
      const client = await deps.getClient(userId);
      const res = await client.starSegment(segmentId, starred);
      return { content: [{ type: "text", text: JSON.stringify(res) }] };
    }
  );

  // ----------------- RESOURCE -----------------
  server.registerResource(
    "athlete",
    new ResourceTemplate("strava://athlete/{userId}", { list: undefined }),
    {
      title: "Athlete profile",
      description: "Current athlete profile (JSON).",
      mimeType: "application/json",
    },
    async (uri, params) => {
      const { userId } = z.object({ userId: z.string() }).parse(params);
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

  // ----------------- PROMPT -----------------
  const renameArgsShape = {
    city: z.string().optional(),
    distanceKm: z.string().optional(),
    sport: z.string().optional(),
  } as const;

  server.registerPrompt(
    "rename-activity",
    {
      title: "Strava title generator",
      description: "Short, friendly activity titles.",
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
