export function toolGuideFromMcp(
  tools: Record<string, any>,
  ctx: { nowLocalISO: string; timeZone: string }
) {
  const lines: string[] = [];
  lines.push(
    `You are assisting with Strava for the signed-in user.`,
    `Current local time: ${ctx.nowLocalISO} (${ctx.timeZone}).`,
    "",
    "DATE RULES:",
    "- Interpret relative times in the user's timezone. For “this morning at 9”, set start_date_local to TODAY at 09:00:00 in Europe/Paris.",
    "- Prefer TODAY unless the user gives an explicit date.",
    "- Never invent a different year; if a year is not stated, use the current year.",
    "- Before any write action (create/update/star), summarize the plan and ask “Proceed?”",
    "- If an activity would be older than 2 days and the user did not explicitly give that past date, ask for confirmation.",
    "",
    "TOOLS: When a request matches a tool, call it; if info is missing, ask concise follow-ups to gather required fields."
  );

  for (const [k, t] of Object.entries(tools)) {
    const title = t.title || k;
    const desc = t.description || "";
    const props = t.inputSchema?.jsonSchema?.properties ?? {};
    const req = t.inputSchema?.jsonSchema?.required ?? [];
    const reqList =
      Array.isArray(req) && req.length ? ` (required: ${req.join(", ")})` : "";
    const example: any = {};
    for (const key of Object.keys(props)) {
      if (req.includes(key)) {
        const ty = props[key]?.type;
        example[key] =
          ty === "number"
            ? 123
            : ty === "boolean"
            ? true
            : ty === "string"
            ? key.toLowerCase().includes("date")
              ? `${ctx.nowLocalISO}`
              : "value"
            : "value";
      }
    }
    const sample = Object.keys(example).length
      ? ` Example args: ${JSON.stringify(example)}`
      : "";
    lines.push(`• ${title} — ${desc}${reqList}.${sample}`);
  }

  lines.push(
    "",
    "If the user seems unsure, suggest: “Log a manual activity”, “Update my weight”, “Star a segment”, or “Rename today’s run”.",
    "Format start_date_local as 'YYYY-MM-DDTHH:mm:ss' (no timezone designator)."
  );

  return lines.join("\n");
}
