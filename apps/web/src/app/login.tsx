"use client";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center py-16">
      <p className="mb-4 text-lg font-medium">
        Connect your Strava account to start chatting with your coach.
      </p>
      <Button
        size="lg"
        className="bg-[#FC4C02] hover:bg-[#E64502]"
        onClick={() => signIn("strava")}
      >
        Sign in with Strava
      </Button>
    </main>
  );
}
