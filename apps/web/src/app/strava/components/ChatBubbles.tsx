import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function QuickChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className="rounded-full border border-white/20 bg-white/10 text-foreground shadow-sm backdrop-blur transition-colors duration-200 hover:border-[#FC4C02]/40 hover:bg-white/20 hover:shadow-[0_0_0_3px_rgba(252,76,2,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC4C02]/40"
      type="button"
      onClick={onClick}
    >
      <Sparkles className="mr-1 h-3.5 w-3.5 text-[#FC4C02]" />
      {label}
    </Button>
  );
}

export function BubbleUser({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-block rounded-2xl bg-gradient-to-r from-[#FC4C02] to-[#FF7A33] px-3 py-2 text-white shadow-md">
      {children}
    </div>
  );
}

export function BubbleAssistant({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-block rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-foreground shadow-sm backdrop-blur">
      {children}
    </div>
  );
}
