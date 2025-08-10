import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@/lib/auth";
import { experimental_createMCPClient } from "ai";
import { Client as McpCoreClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { sanitizeToolNames } from "./sanitizeToolNames";
import { toolGuideFromMcp } from "./toolGuideFromMcp";
import { PARIS_TZ, toLocalISOString } from "@mcp/strava";

export const runtime = "nodejs";
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const uiMessages = (body.messages ?? []) as UIMessage[];

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const origin = `${proto}://${host}`;

  const headers = {
    Authorization: `Bearer ${process.env.MCP_INTERNAL_TOKEN ?? ""}`,
    "x-user-id": session.user.id,
  };

  const athlete = await readAthleteResource(origin, headers).catch(() => null);

  const transport = new StreamableHTTPClientTransport(
    new URL(`${origin}/api/mcp`),
    {
      requestInit: { headers },
    }
  );
  const mcp = await experimental_createMCPClient({ transport });
  try {
    const rawTools = await mcp.tools();
    const nowParisISO = toLocalISOString(new Date(), PARIS_TZ);
    const guide = toolGuideFromMcp(rawTools, {
      nowLocalISO: nowParisISO,
      timeZone: PARIS_TZ,
    });

    // 🔑 Build system messages in UIMessage shape
    const systemUi: UIMessage[] = [
      {
        role: "system",
        parts: [{ type: "text", text: guide }],
        id: "",
      },
      ...(athlete
        ? [
            {
              role: "system",
              parts: [
                {
                  type: "text",
                  text:
                    "Current Strava athlete (summary; use tools for fresh details): " +
                    JSON.stringify({
                      id: athlete.id,
                      firstname: athlete.firstname,
                      lastname: athlete.lastname,
                      city: athlete.city,
                      weight: athlete.weight,
                    }),
                },
              ],
            } as UIMessage,
          ]
        : []),
    ];

    const messages = convertToModelMessages([...systemUi, ...uiMessages]);

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      tools: sanitizeToolNames(rawTools),
      onFinish: async () => {
        await mcp.close();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    await mcp.close().catch(() => {});
    return new Response((err as Error)?.message ?? "Generation failed", {
      status: 500,
    });
  }
}

async function readAthleteResource(
  origin: string,
  headers: Record<string, string>
) {
  const t = new StreamableHTTPClientTransport(new URL(`${origin}/api/mcp`), {
    requestInit: { headers },
  });
  const client = new McpCoreClient({ name: "web-app", version: "1.0.0" });
  await client.connect(t);
  try {
    const res = await client.readResource({ uri: "strava://athlete" });
    const txt = res?.contents?.[0]?.text;
    return txt ? JSON.parse(txt as string) : null;
  } finally {
    await client.close().catch(() => {});
  }
}
