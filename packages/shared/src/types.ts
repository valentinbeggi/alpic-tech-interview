export type UserId = string;

export type StravaScope =
  | "read"
  | "read_all"
  | "profile:read_all"
  | "profile:write"
  | "activity:read"
  | "activity:read_all"
  | "activity:write";
