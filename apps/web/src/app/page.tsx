import LoginPage from "./login";
import StravaCoachPage from "./page-client";
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  const stravaConnected = Boolean(session?.user?.id);

  if (!stravaConnected) {
    return <LoginPage />;
  }

  return (
    <StravaCoachPage
      stravaConnected={stravaConnected}
      user={session?.user ?? null}
    />
  );
}
