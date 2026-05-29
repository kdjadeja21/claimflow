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
    <div className="grid min-h-[65dvh] place-items-center">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center pb-4 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-3xl bg-primary/10 shadow-inner">
            <Lock className="size-5 text-primary" />
          </div>
          <CardTitle>Organizer access</CardTitle>
          <CardDescription>Enter the 4-digit organizer PIN to continue.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organizer-pin">PIN</Label>
            <Input
              id="organizer-pin"
              inputMode="numeric"
              maxLength={4}
              placeholder="• • • •"
              type="password"
              className="h-14 text-center text-xl tracking-[0.4em]"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  unlock();
                }
              }}
            />
          </div>

          {error ? (
            <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}

          <Button className="h-12 w-full" onClick={unlock}>
            Unlock
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
