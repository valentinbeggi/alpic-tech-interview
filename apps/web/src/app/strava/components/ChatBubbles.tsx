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
      className="rounded-full"
      type="button"
      onClick={onClick}
    >
      <Sparkles className="mr-1 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

export function BubbleUser({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-block rounded-2xl bg-primary px-3 py-2 text-primary-foreground shadow-sm">
      {children}
    </div>
  );
}

export function BubbleAssistant({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-block rounded-2xl bg-muted px-3 py-2 text-muted-foreground shadow-sm">
      {children}
    </div>
  );
}
