import { useMemo } from "react";
import { extractTopLevelJSONBlocks, safeJSON } from "../utils/json";

function stripMcpNoise(raw: string): string {
  if (!raw) return "";
  let out = raw;

  for (const block of extractTopLevelJSONBlocks(raw)) {
    const obj = safeJSON(block);
    if (!obj || typeof obj !== "object") continue;

    const isStepStart = obj.type === "step-start";
    const isDynToolNoOutput =
      obj.type === "dynamic-tool" &&
      (!obj.output || !Array.isArray(obj.output.content));

    if (isStepStart || isDynToolNoOutput) {
      out = out.replace(block, "");
    }
  }

  return out.replace(/^[\s,]+/, "").trim();
}

function coalesceToolOutputs(raw: string): { text: string } | null {
  const pieces: string[] = [];

  for (const block of extractTopLevelJSONBlocks(raw)) {
    const obj = safeJSON(block);
    if (!obj || typeof obj !== "object") continue;
    if (obj.type !== "dynamic-tool") continue;

    const out = obj.output;
    if (!out || !Array.isArray(out.content)) continue;

    for (const item of out.content) {
      if (item?.type === "text" && typeof item.text === "string") {
        pieces.push(item.text);
      }
    }
  }

  if (!pieces.length) return null;
  return { text: pieces.join("\n").trim() };
}

function uiMessageToText(m: any): string {
  if ("parts" in m && Array.isArray(m.parts)) {
    return m.parts
      .map((p: any) => (p?.type === "text" ? p.text : JSON.stringify(p)))
      .join("");
  }
  return (m as any).content ?? "";
}

export const useGroupedTranscript = (messages: any[]) => {
  const linear = useMemo(() => {
    return messages.map((m) => {
      const raw = uiMessageToText(m);
      const tool = coalesceToolOutputs(raw);
      const clean = stripMcpNoise(raw);
      return {
        ...m,
        _raw: raw,
        _text: tool ? tool.text : clean,
        _isToolText: !!tool,
      };
    });
  }, [messages]);

  const grouped = useMemo(() => {
    type Row = {
      id: string;
      role: "user" | "assistant";
      text: string;
      prevUserText?: string;
    };

    const out: Row[] = [];
    let lastUserText = "";
    let aBuf: string[] = [];
    let aFirstId: string | null = null;

    const flushAssistant = () => {
      const text = aBuf
        .map((s) => s.trim())
        .filter(Boolean)
        .join("\n")
        .trim();
      if (text) {
        out.push({
          id: aFirstId ? `a-${aFirstId}` : `a-${out.length}`,
          role: "assistant",
          text,
          prevUserText: lastUserText,
        });
      }
      aBuf = [];
      aFirstId = null;
    };

    for (const m of linear) {
      const text = (m._text ?? "").trim();

      if (m.role === "user") {
        if (aBuf.length) flushAssistant();

        lastUserText = text;
        if (text) {
          out.push({ id: String(m.id), role: "user", text });
        }
        continue;
      }

      if (!aFirstId) aFirstId = String(m.id);
      if (text) aBuf.push(text);
    }

    if (aBuf.length) flushAssistant();

    return out;
  }, [linear]);

  return grouped;
};
