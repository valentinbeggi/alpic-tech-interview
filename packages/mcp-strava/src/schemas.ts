import { z } from "zod";

export const createManualShape = {
  name: z.string(),
  type: z.string().default("Workout"),
  start_date_local: z.string(),
  elapsed_time: z.number(),
  description: z.string().optional(),
  distance: z.number().optional(),
  commute: z.boolean().optional(),
  private: z.boolean().optional(),
} as const;

export const getActivityShape = {
  id: z.number(),
} as const;

export const getLastActivityShape = {
  sport: z.string().optional(),
} as const;

export const getRecentActivitiesShape = {
  count: z.number().int().positive().max(50).default(3),
  sport: z.string().optional(),
} as const;

export const renameActivityShape = {
  name: z.string().min(1),
  id: z.number().optional(),
  sport: z.string().optional(),
} as const;

export const renameArgsShape = {
  city: z.string().optional(),
  distanceKm: z.string().optional(),
  sport: z.string().optional(),
} as const;
