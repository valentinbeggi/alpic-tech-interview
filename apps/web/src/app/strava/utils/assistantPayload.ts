import {
  extractTopLevelJSONBlocks,
  safeJSON,
  walk,
} from "@/app/strava/utils/json";
import type { Activity } from "@/app/strava/types";

export type ActionResult =
  | { kind: "rename"; id: number; name: string; url?: string }
  | { kind: "upload"; id?: number; status?: string; url?: string }
  | { kind: "star"; segmentId?: number; starred?: boolean }
  | {
      kind: "generic";
      title: string;
      details?: Record<string, unknown>;
      url?: string;
    };

export type ExtractedPayload = {
  plainText: string;
  activities: Activity[];
  actions: ActionResult[];
  empty: boolean;
};

export function extractPayload(raw: string): ExtractedPayload {
  // raw is either normal prose or the tool's output text (often JSON)
  const trimmed = (raw ?? "").trim();

  const activities = extractActivitiesDeep(trimmed);
  let actions = extractActionsDeep(trimmed);

  // Avoid duplicate "upload" cards when the same id is an activity
  const activityIds = new Set(activities.map((a) => a.id));
  actions = actions.filter(
    (a) => !(a.kind === "upload" && a.id && activityIds.has(a.id))
  );

  // If the whole thing is JSON, don't show it as prose
  const plainText = isPureJSON(trimmed) ? "" : trimmed;

  const empty = !plainText && activities.length === 0 && actions.length === 0;

  return { plainText, activities, actions, empty };
}

export function buildAutoCaption(
  prevUserText: string,
  payload: { activities: Activity[]; actions: ActionResult[] }
) {
  if (payload.actions.length > 0 && payload.activities.length === 0) {
    const first = payload.actions[0];
    if (first.kind === "rename") return "Done! I renamed your activity:";
    if (first.kind === "upload") return "Upload status:";
    if (first.kind === "star")
      return first.starred ? "Segment starred:" : "Segment unstarred:";
    return "Done:";
  }
  if (payload.activities.length > 0) {
    const n = payload.activities.length;
    if (/last\s+\d+/i.test(prevUserText))
      return `Here are your last ${n} activities:`;
    if (/recent|latest/i.test(prevUserText))
      return `Here are your recent activities:`;
    return `Here you go:`;
  }
  return "";
}

/* =================== Activities =================== */

function extractActivitiesDeep(text: string): Activity[] {
  const out: Activity[] = [];

  const hit = (node: any) => {
    if (isActivity(node)) out.push(normalizeActivity(node));
    if (Array.isArray(node)) {
      for (const x of node) if (isActivity(x)) out.push(normalizeActivity(x));
    }
  };

  // 1) Whole string may be a JSON object/array
  const whole = safeJSON(text);
  if (whole) walk(whole, hit);

  // 2) Or multiple JSON blocks in the same string (joined outputs)
  for (const block of extractTopLevelJSONBlocks(text)) {
    const parsed = safeJSON(block);
    if (parsed) walk(parsed, hit);
  }

  return dedupeActivities(out);
}

function isActivity(a: any): boolean {
  return (
    a &&
    typeof a === "object" &&
    typeof a.id === "number" &&
    typeof a.name === "string" &&
    (typeof a.sport_type === "string" || typeof a.type === "string")
  );
}

function normalizeActivity(a: any): Activity {
  return {
    id: a.id,
    name: a.name,
    sport_type: a.sport_type,
    type: a.type,
    distance: a.distance,
    elapsed_time: a.elapsed_time,
    moving_time: a.moving_time,
    start_date_local: a.start_date_local,
    timezone: a.timezone,
    total_photo_count: a.total_photo_count ?? a.photo_count,
    kudos_count: a.kudos_count,
    visibility: a.visibility,
    map: a.map,
    photos: a.photos,
  };
}

function dedupeActivities(list: Activity[]): Activity[] {
  const seen = new Set<number>();
  const out: Activity[] = [];
  for (const a of list) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}

/* =================== Actions =================== */

function extractActionsDeep(text: string): ActionResult[] {
  const out: ActionResult[] = [];

  const consider = (node: any) => {
    const act =
      detectRename(node) ||
      detectUpload(node) ||
      detectStar(node) ||
      detectGeneric(node);
    if (act) out.push(act);
  };

  // Whole JSON
  const whole = safeJSON(text);
  if (whole) walk(whole, consider);

  // Multiple blocks
  for (const block of extractTopLevelJSONBlocks(text)) {
    const parsed = safeJSON(block);
    if (parsed) walk(parsed, consider);
  }

  return out;
}

function detectRename(obj: any): ActionResult | null {
  if (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "number" &&
    typeof obj.name === "string"
  ) {
    if (
      typeof obj.url === "string" &&
      /strava\.com\/activities\/\d+/.test(obj.url)
    ) {
      return { kind: "rename", id: obj.id, name: obj.name, url: obj.url };
    }
  }
  return null;
}

function detectUpload(obj: any): ActionResult | null {
  // don't misclassify activities
  if (isActivity(obj)) return null;
  if (!obj || typeof obj !== "object") return null;

  const hasStatus = typeof obj.status === "string" && obj.status.length > 0;
  const hasUploadId =
    typeof obj.upload_id === "number" && Number.isFinite(obj.upload_id);
  const hasExternalId =
    typeof obj.external_id === "string" && obj.external_id.length > 0;

  const looksLikeUpload =
    hasStatus ||
    hasUploadId ||
    (hasExternalId && !("sport_type" in obj) && !("type" in obj));
  if (!looksLikeUpload) return null;

  return {
    kind: "upload",
    id: hasUploadId
      ? obj.upload_id
      : typeof obj.id === "number"
      ? obj.id
      : undefined,
    status: hasStatus ? obj.status : undefined,
    url: typeof obj.url === "string" ? obj.url : undefined,
  };
}

function detectStar(obj: any): ActionResult | null {
  if (
    obj &&
    typeof obj === "object" &&
    ("segmentId" in obj || "starred" in obj)
  ) {
    return {
      kind: "star",
      segmentId: typeof obj.segmentId === "number" ? obj.segmentId : undefined,
      starred: typeof obj.starred === "boolean" ? obj.starred : undefined,
    };
  }
  return null;
}

function detectGeneric(obj: any): ActionResult | null {
  if (obj && typeof obj === "object") {
    if (isActivity(obj)) return null;
    if (typeof obj.name === "string" || typeof obj.url === "string") {
      return {
        kind: "generic",
        title: typeof obj.name === "string" ? obj.name : "Done",
        url: typeof obj.url === "string" ? obj.url : undefined,
        details: obj,
      };
    }
  }
  return null;
}

/* =================== Utils =================== */

function isPureJSON(s: string): boolean {
  if (!s) return false;
  if (safeJSON(s)) return true;
  const blocks = extractTopLevelJSONBlocks(s);
  return blocks.length === 1 && s === blocks[0];
}
