"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/app/strava/utils/assistantPayload";

export function ActionResultCard({ action }: { action: ActionResult }) {
  if (action.kind === "rename") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">
                Renamed activity
              </div>
              <div className="text-xs text-muted-foreground">
                ID {action.id}
              </div>
            </div>
            <Badge variant="secondary">Success</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          <div className="truncate text-sm">
            New title: <span className="font-medium">{action.name}</span>
          </div>
          {action.url && (
            <Button asChild size="sm" variant="outline">
              <a href={action.url} target="_blank" rel="noreferrer">
                Open
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (action.kind === "upload") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">Upload</div>
              <div className="text-xs text-muted-foreground">
                {typeof action.id === "number"
                  ? `ID ${action.id}`
                  : "Processing"}
              </div>
            </div>
            <Badge variant="secondary">{action.status ?? "Status"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          <div className="text-sm">File upload status shown above.</div>
          {action.url && (
            <Button asChild size="sm" variant="outline">
              <a href={action.url} target="_blank" rel="noreferrer">
                Open
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (action.kind === "star") {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">
                {action.starred ? "Segment starred" : "Segment unstarred"}
              </div>
              {typeof action.segmentId === "number" && (
                <div className="text-xs text-muted-foreground">
                  Segment ID {action.segmentId}
                </div>
              )}
            </div>
            <Badge variant="secondary">Success</Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">Done</div>
          </div>
          <Badge variant="secondary">Success</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <div className="text-sm">Your request was completed.</div>
        {"url" in action && action.url ? (
          <Button asChild size="sm" variant="outline">
            <a href={action.url} target="_blank" rel="noreferrer">
              Open
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
