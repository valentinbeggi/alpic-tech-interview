"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function Home() {
  const { messages, status, error, sendMessage } = useChat();
  const [input, setInput] = useState("");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Strava Coach & Concierge</h1>

      <div className="border rounded p-3 h-[420px] overflow-y-auto mb-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id}>
            <div className="text-xs opacity-60 mb-1">{m.role}</div>
            <div className="whitespace-pre-wrap">
              {"parts" in m
                ? m.parts
                    .map((p) =>
                      p.type === "text" ? p.text : JSON.stringify(p)
                    )
                    .join("")
                : (m as any).content}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || status !== "ready") return;
          sendMessage({
            role: "user",
            parts: [{ type: "text", text: input.trim() }],
          });
          setInput("");
        }}
        className="flex gap-2"
      >
        <input
          className="border rounded px-3 py-2 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try: Log a 45-min strength session yesterday at 18:15 (private)"
          disabled={status !== "ready"}
        />
        <button
          disabled={status !== "ready"}
          className="border rounded px-3 py-2"
        >
          {status === "streaming" ? "Streaming…" : "Send"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mt-2">{String(error)}</p>}

      <div className="mt-6 text-sm">
        <a className="underline" href="/api/auth/signin">
          Sign in with Strava
        </a>
        {" · "}
        <a className="underline" href="/api/auth/signout">
          Sign out
        </a>
      </div>
    </main>
  );
}
