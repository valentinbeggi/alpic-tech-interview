export function toolGuideFromMcp(tools: Record<string, any>) {
  const lines: string[] = [];
  lines.push(
    "You have these Strava tools. When a request matches a tool, call it; if info is missing, ask concise follow-ups to gather required fields. Confirm before updates."
  );

  for (const [k, t] of Object.entries(tools)) {
    const title = t.title || k;
    const desc = t.description || "";
    const props = t.inputSchema?.jsonSchema?.properties ?? {};
    const req = t.inputSchema?.jsonSchema?.required ?? [];
    const reqList =
      Array.isArray(req) && req.length ? ` (required: ${req.join(", ")})` : "";
    // tiny example JSON from schema
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
              ? new Date().toISOString()
              : "value"
            : "value";
      }
    }
    const sample = Object.keys(example).length
      ? ` Example args: ${JSON.stringify(example)}`
      : "";
    lines.push(`• ${title} — ${desc}${reqList}.${sample}`);
  }

  // nudge: concrete suggestions users can click/type
  lines.push(
    "If the user seems unsure, suggest: “Log a manual activity”, “Update my weight”, “Star a segment”, or “Rename today’s run”."
  );

  return lines.join("\n");
}
