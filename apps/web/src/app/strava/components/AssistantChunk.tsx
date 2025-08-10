"use client";

import * as React from "react";
import { ActivityCard } from "@/app/strava/components/ActivityCard";
import { BubbleAssistant } from "@/app/strava/components/ChatBubbles";
import { ActionResultCard } from "@/app/strava/components/ActionResultCard";
import {
  extractPayload,
  buildAutoCaption,
} from "@/app/strava/utils/assistantPayload";

export function AssistantChunk({
  text,
  prevUserText = "",
}: {
  text: string;
  prevUserText?: string;
}) {
  const payload = React.useMemo(() => extractPayload(text), [text]);

  const caption =
    !payload.plainText &&
    (payload.activities.length > 0 || payload.actions.length > 0)
      ? buildAutoCaption(prevUserText, payload)
      : "";

  if (payload.empty && !caption) return null;

  return (
    <div className="space-y-3">
      {(payload.plainText || caption) && (
        <BubbleAssistant>{payload.plainText || caption}</BubbleAssistant>
      )}

      {payload.actions.map((a, idx) => (
        <ActionResultCard key={`action-${idx}`} action={a} />
      ))}

      {payload.activities.map((a, idx) => (
        <ActivityCard key={`${a.id}-${idx}`} activity={a} />
      ))}
    </div>
  );
}
