"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { verifyPin } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VolunteerPinGateProps {
  pinHash: string;
  slug: string;
  eventName: string;
  children: React.ReactNode;
}

const SESSION_KEY = (slug: string) => `claimflow:vol-pin:${slug}`;

export function VolunteerPinGate({
  pinHash,
  slug,
  eventName,
  children,
}: VolunteerPinGateProps) {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsUnlocked(
      typeof window !== "undefined" &&
        window.sessionStorage.getItem(SESSION_KEY(slug)) === "true"
    );
    setReady(true);
  }, [slug]);

  async function unlock() {
    if (!pin) return;
    setChecking(true);
    try {
      const ok = await verifyPin(pin, pinHash);
      if (ok) {
        window.sessionStorage.setItem(SESSION_KEY(slug), "true");
        setIsUnlocked(true);
        setError("");
      } else {
        setError("Incorrect PIN. Check with the event organizer.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (!ready) return null;
  if (isUnlocked) return <>{children}</>;

  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center pb-2 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-muted">
            <KeyRound className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <CardTitle>Volunteer access</CardTitle>
          <CardDescription>
            Enter the PIN provided by the organizer to start scanning for{" "}
            <strong>{eventName}</strong>.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vol-pin">PIN</Label>
            <Input
              id="vol-pin"
              inputMode="numeric"
              maxLength={8}
              placeholder="• • • •"
              type="password"
              className="h-12 text-center text-xl tracking-[0.4em]"
              value={pin}
              autoFocus
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") unlock();
              }}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button
            className="h-10 w-full"
            onClick={unlock}
            disabled={!pin || checking}
          >
            {checking ? "Checking…" : "Unlock scanner"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
