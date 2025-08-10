import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/app/strava/types";

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
    <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <StravaMark className="h-6 w-6" />
          <div className="font-semibold tracking-tight">
            Strava Coach & Concierge
          </div>
        </div>
        <div className="flex items-center gap-3">
          {stravaConnected ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback>
                  {(user?.name ?? "U").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:block">
                {user?.name ?? "Connected"}
              </span>
              <Separator orientation="vertical" className="mx-1 h-6" />
              <Button asChild variant="outline" size="sm">
                <a href="/api/auth/signout">Sign out</a>
              </Button>
            </>
          ) : (
            <Button
              asChild
              size="sm"
              className="bg-[#FC4C02] hover:bg-[#E64502]"
            >
              <a href="/api/auth/strava">Sign in with Strava</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
