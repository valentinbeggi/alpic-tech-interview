"use client";
import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, SendHorizonal } from "lucide-react";
import { BubbleUser, QuickChip } from "@/app/strava/components/ChatBubbles";
import { StravaHeader } from "@/app/strava/components/StravaHeader";
import { AssistantChunk } from "@/app/strava/components/AssistantChunk";
import type { User } from "@/app/strava/types";
import { useGroupedTranscript } from "./strava/hooks/useGroupedTranscript";

type Props = {
  stravaConnected: boolean;
  user: User | null;
};

export default function StravaCoachPage({ stravaConnected, user }: Props) {
  const [input, setInput] = React.useState("");
  const { messages, status, error, sendMessage, stop } = useChat();

  const asUser = (text: string) => ({
    role: "user" as const,
    parts: [{ type: "text" as const, text }],
  });

  const grouped = useGroupedTranscript(messages);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <StravaHeader stravaConnected={stravaConnected} user={user} />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:pt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <QuickChip
            onClick={() =>
              sendMessage(asUser("What are my last 3 activities?"))
            }
            label="Last 3 activities"
          />
          <QuickChip
            onClick={() =>
              sendMessage(asUser("Rename my last run to Test Rename"))
            }
            label="Rename last run"
          />
          <QuickChip
            onClick={() =>
              sendMessage(
                asUser(
                  "Log a 45-min strength session yesterday at 18:15 (private)"
                )
              )
            }
            label="Log a strength session"
          />
          <QuickChip
            onClick={() => sendMessage(asUser("Star segment 123456"))}
            label="Star a segment"
          />
        </div>
        <Separator className="mb-3" />
        <ScrollArea className="h-[60vh] rounded-lg border">
          <div className="space-y-4 p-4">
            {grouped.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] ${
                      isUser ? "text-right" : "text-left"
                    }`}
                  >
                    {isUser ? (
                      <BubbleUser>{m.text}</BubbleUser>
                    ) : (
                      <AssistantChunk
                        text={m.text}
                        prevUserText={m.prevUserText ?? ""}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {status === "streaming" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking…
              </div>
            )}
            {error && (
              <div className="text-sm text-red-600">
                {String(error?.message || error)}
              </div>
            )}
          </div>
        </ScrollArea>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = input.trim();
            if (!t || status !== "ready") return;
            sendMessage(asUser(t));
            setInput("");
          }}
          className="mt-3 flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your Strava…"
            disabled={status !== "ready"}
          />
          {status === "streaming" ? (
            <Button type="button" variant="secondary" onClick={() => stop()}>
              Stop
            </Button>
          ) : (
            <Button type="submit">
              <SendHorizonal className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
        </form>
      </main>
    </div>
  );
}
