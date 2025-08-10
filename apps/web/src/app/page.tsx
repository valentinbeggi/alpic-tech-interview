import StravaCoachPage from "./page-client";
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  const stravaConnected = Boolean(session?.user?.id);
  return (
    <StravaCoachPage
      stravaConnected={stravaConnected}
      user={session?.user ?? null}
    />
  );
}
