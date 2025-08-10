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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">{when}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="whitespace-nowrap">
              {sport}
            </Badge>
            {activity.visibility && (
              <Badge variant="secondary" className="whitespace-nowrap">
                {activity.visibility}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <div className="order-2 h-40 w-full overflow-hidden rounded-xl border bg-muted md:order-1 md:col-span-2">
          {primaryPhoto ? (
            <img
              src={primaryPhoto}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : poly ? (
            <PolylinePreview encoded={poly} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No preview available
            </div>
          )}
        </div>
        <div className="order-1 flex flex-col justify-center gap-2 md:order-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Distance</span>
            <span className="font-medium">{distance}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="font-medium">{duration}</span>
          </div>
          {typeof activity.kudos_count === "number" && (
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Kudos</span>
              <span className="font-medium">{activity.kudos_count}</span>
            </div>
          )}
          {typeof activity.total_photo_count === "number" && (
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Photos</span>
              <span className="font-medium">{activity.total_photo_count}</span>
            </div>
          )}
          <div className="pt-1">
            <Button asChild variant="outline" size="sm" className="w-full">
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
