function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

export function sanitizeToolNames<T extends Record<string, any>>(raw: T) {
  const out: Record<string, any> = Object.create(null);
  const used = new Set<string>();

  for (const [original, tool] of Object.entries(raw)) {
    let safe = sanitizeName(original);
    if (used.has(safe)) {
      let i = 2;
      while (used.has(`${safe}_${i}`)) i++;
      safe = sanitizeName(`${safe}_${i}`);
    }
    used.add(safe);
    out[safe] = tool;
  }

  return out;
}
