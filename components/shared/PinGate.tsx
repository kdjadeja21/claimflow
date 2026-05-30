"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSettings, initializeClaimFlow } from "@/lib/storage";

export function PinGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      initializeClaimFlow();
      setIsUnlocked(window.sessionStorage.getItem("claimflow:pin-unlocked") === "true");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function unlock() {
    if (pin === getSettings().organizerPin) {
      window.sessionStorage.setItem("claimflow:pin-unlocked", "true");
      setIsUnlocked(true);
      setError("");
      return;
    }
    setError("Incorrect PIN. The default PIN is 1234.");
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center pb-2 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-muted">
            <Lock className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <CardTitle>Organizer access</CardTitle>
          <CardDescription>Enter the 4-digit organizer PIN to continue.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="organizer-pin">PIN</Label>
            <Input
              id="organizer-pin"
              inputMode="numeric"
              maxLength={4}
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

          <Button className="h-10 w-full" onClick={unlock}>
            Unlock
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
