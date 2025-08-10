import { z } from "zod";

export const UploadStatus = z.object({
  id: z.number().optional(),
  external_id: z.string().nullish(),
  error: z.string().nullish(),
  status: z.string(),
  activity_id: z.number().nullish()
});
export type UploadStatus = z.infer<typeof UploadStatus>;

export const ActivityCreateInput = z.object({
  name: z.string(),
  type: z.string().default("Workout"),
  start_date_local: z.string(),
  elapsed_time: z.number(),
  description: z.string().optional(),
  distance: z.number().optional(),
  trainer: z.number().optional(),
  commute: z.number().optional(),
  hide_from_home: z.boolean().optional(),
  private: z.boolean().optional()
});
export type ActivityCreateInput = z.infer<typeof ActivityCreateInput>;
