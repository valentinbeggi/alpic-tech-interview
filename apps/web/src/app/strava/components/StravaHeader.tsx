import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/app/strava/types";
import { signIn } from "next-auth/react";

function StravaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Strava">
      <path
        fill="#FC4C02"
        d="M13.5 14.5L17 8l3.5 6.5h-3l-1.5-2.8-1.5 2.8h-3L14 8l-3.5 6.5h3zM6 20l5.5-10L17 20h-3l-2.5-4.7L9 20H6z"
      />
    </svg>
  );
}

export function StravaHeader({
  stravaConnected,
  user,
}: {
  stravaConnected: boolean;
  user: User | null;
}) {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-white/10 bg-background/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <StravaMark className="h-6 w-6" />
          <div className="bg-gradient-to-r from-[#FC4C02] to-[#FF7A33] bg-clip-text font-semibold tracking-tight text-transparent">
            Strava Coach & Concierge
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stravaConnected ? (
            <>
              <Avatar className="h-8 w-8 ring-1 ring-white/20">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback>
                  {(user?.name ?? "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:block">
                {user?.name ?? "Connected"}
              </span>
              <Separator orientation="vertical" className="mx-1 h-6" />
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/5 backdrop-blur hover:bg-white/10"
              >
                <a href="/api/auth/signout">Sign out</a>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="bg-gradient-to-r from-[#FC4C02] to-[#FF7A33] text-white shadow-md hover:from-[#E64502] hover:to-[#FF6A13]"
              onClick={() => signIn("strava")}
            >
              Sign in with Strava
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
