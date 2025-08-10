export type User = { name?: string | null; image?: string | null };

export type Activity = {
  id: number;
  name: string;
  sport_type?: string;
  type?: string;
  distance?: number;
  elapsed_time?: number;
  moving_time?: number;
  start_date_local?: string;
  timezone?: string;
  total_photo_count?: number;
  kudos_count?: number;
  visibility?: string;
  map?: { summary_polyline?: string; polyline?: string };
  photos?: { primary?: { urls?: Record<string, string> } };
};
