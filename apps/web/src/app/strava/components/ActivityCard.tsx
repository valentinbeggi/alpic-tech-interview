import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PolylinePreview } from "@/app/strava/components/PolylinePreview";
import {
  formatDistance,
  formatDuration,
  formatLocalDate,
} from "@/app/strava/utils/format";
import type { Activity } from "@/app/strava/types";
import { Map, Clock, ThumbsUp, Image } from "lucide-react";

export function ActivityCard({ activity }: { activity: Activity }) {
  const title = activity.name ?? "Activity";
  const sport = activity.sport_type ?? activity.type ?? "Workout";
  const distance = formatDistance(activity.distance);
  const duration = formatDuration(
    activity.moving_time ?? activity.elapsed_time
  );
  const when = formatLocalDate(activity.start_date_local);
  const primaryPhoto = activity.photos?.primary?.urls
    ? Object.values(activity.photos.primary.urls).at(-1)
    : null;
  const poly = activity.map?.summary_polyline || activity.map?.polyline || "";

  return (
    <Card className="overflow-hidden border-white/10 bg-background/50 shadow-lg backdrop-blur-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{when}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="whitespace-nowrap border-white/20"
            >
              {sport}
            </Badge>
            {activity.visibility && (
              <Badge
                variant="secondary"
                className="whitespace-nowrap bg-white/10"
              >
                {activity.visibility}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <div className="order-2 h-40 w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent md:order-1 md:col-span-2">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : poly ? (
            <PolylinePreview encoded={poly} />
          ) : (
            <div className="relative flex h-full items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(252,76,2,0.08),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,122,51,0.08),transparent_40%)]" />
              <Map className="z-10 h-10 w-10 text-[#FC4C02]/70" />
            </div>
          )}
        </div>
        <div className="order-1 flex flex-col justify-center gap-2 md:order-2">
          <div className="flex items-baseline justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Map className="h-4 w-4 text-[#FC4C02]/80" />
              Distance
            </span>
            <span className="font-medium">{distance}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-[#FC4C02]/80" />
              Duration
            </span>
            <span className="font-medium">{duration}</span>
          </div>
          {typeof activity.kudos_count === "number" && (
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <ThumbsUp className="h-4 w-4 text-[#FC4C02]/80" />
                Kudos
              </span>
              <span className="font-medium">{activity.kudos_count}</span>
            </div>
          )}
          {typeof activity.total_photo_count === "number" && (
            <div className="flex items-baseline justify-between">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Image className="h-4 w-4 text-[#FC4C02]/80" />
                Photos
              </span>
              <span className="font-medium">{activity.total_photo_count}</span>
            </div>
          )}
          <div className="pt-1">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-white/20 bg-white/5 hover:bg-white/10"
            >
              <a
                href={`https://www.strava.com/activities/${activity.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Strava
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
