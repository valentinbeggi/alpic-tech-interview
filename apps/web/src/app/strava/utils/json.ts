export function walk(node: any, hit: (x: any) => void) {
  if (node == null) return;

  if (typeof node === "string") {
    const s = node.trim();
    if (s.startsWith("{") || s.startsWith("[")) {
      const inner = safeJSON(s);
      if (inner) walk(inner, hit);
    }
    return;
  }

  hit(node);

  if (Array.isArray(node)) {
    for (const item of node) walk(item, hit);
  } else if (typeof node === "object") {
    for (const v of Object.values(node)) walk(v, hit);
  }
}

export function extractTopLevelJSONBlocks(text: string): string[] {
  const blocks: string[] = [];
  let depth = 0,
    start = -1,
    inStr = false,
    strQuote: '"' | "'" | null = null,
    escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inStr) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === strQuote) {
        inStr = false;
        strQuote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inStr = true;
      strQuote = ch as '"' | "'";
      continue;
    }

    if (ch === "{" || ch === "[") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }

    if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        blocks.push(text.slice(start, i + 1));
        start = -1;
      }
      continue;
    }
  }

  return blocks;
}

export function safeJSON(s: string): any | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
