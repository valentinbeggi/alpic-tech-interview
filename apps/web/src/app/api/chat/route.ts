import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@/lib/auth";
import { experimental_createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { sanitizeToolNames } from "./sanitizeToolNames";
import { toolGuideFromMcp } from "./toolGuideFromMcp";
import { PARIS_TZ, toLocalISOString } from "@mcp/strava";

export const runtime = "nodejs";
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const uiMessages = body.messages ?? [];

  // Build origin from request (works locally and on Vercel)
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const origin = `${proto}://${host}`;

  // MCP over Streamable HTTP (headers go under requestInit)
  const transport = new StreamableHTTPClientTransport(
    new URL(`${origin}/api/mcp`),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.MCP_INTERNAL_TOKEN ?? ""}`,
          "x-user-id": session.user.id,
        },
      },
    }
  );

  const mcp = await experimental_createMCPClient({ transport });

  try {
    const rawTools = await mcp.tools();

    // Dynamic, time-aware instructions for the model
    const nowParisISO = toLocalISOString(new Date(), PARIS_TZ);
    const guide = toolGuideFromMcp(rawTools, {
      nowLocalISO: nowParisISO,
      timeZone: PARIS_TZ,
    });

    const messages = [
      { role: "system", content: guide } as const,
      ...convertToModelMessages(uiMessages),
    ];

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
