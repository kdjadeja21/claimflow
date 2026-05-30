"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getUserActiveEventId, subscribeToEventData } from "@/lib/db";
import { AuthGate } from "@/components/shared/AuthGate";
import { AppShell } from "@/components/shared/AppShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ClaimFeed } from "@/components/dashboard/ClaimFeed";
import { InventoryBar } from "@/components/dashboard/InventoryBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Attendee, Claim, ClaimEvent, ScanAttempt } from "@/lib/types";

function StatsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeEvent, setActiveEvent] = useState<ClaimEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [attempts, setAttempts] = useState<ScanAttempt[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserActiveEventId(user.uid).then((id) => {
      if (!id) {
        router.replace("/dashboard");
        return;
      }
      setEventId(id);
    });
  }, [user, router]);

  useEffect(() => {
    if (!eventId) return;
    const unsub = subscribeToEventData(eventId, (data) => {
      setActiveEvent(data.event);
      setClaims(data.claims);
      setAttempts(data.attempts);
      setAttendees(data.attendees);
    });
    return unsub;
  }, [eventId]);

  const enabledClaimTypes = useMemo(
    () => (activeEvent?.claimTypes ?? []).filter((ct) => ct.enabled),
    [activeEvent]
  );
  const enabledClaimTypeIds = useMemo(
    () => new Set(enabledClaimTypes.map((ct) => ct.id)),
    [enabledClaimTypes]
  );
  const enabledClaims = useMemo(
    () => claims.filter((c) => enabledClaimTypeIds.has(c.claimType)),
    [claims, enabledClaimTypeIds]
  );
  const claimCounts = useMemo(
    () =>
      enabledClaims.reduce<Record<string, number>>((acc, claim) => {
        acc[claim.claimType] = (acc[claim.claimType] ?? 0) + 1;
        return acc;
      }, {}),
    [enabledClaims]
  );

  const uniqueClaimed = new Set(enabledClaims.map((c) => c.ticketId.toLowerCase())).size;
  const totalInventory = enabledClaimTypes.reduce((t, ct) => t + ct.inventory, 0);
  const remainingInventory = Math.max(0, totalInventory - enabledClaims.length);
  const duplicateAttempts = attempts.filter((a) => a.status === "already_claimed").length;

  return (
    <AppShell title="Stats" description={activeEvent?.eventName ?? "Live claim analytics"}>
      <div className="space-y-6">
        <StatsGrid
          totalAttendees={attendees.length}
          uniqueClaimed={uniqueClaimed}
          remainingInventory={remainingInventory}
          duplicateAttempts={duplicateAttempts}
        />

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Real-time usage across enabled claim categories.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/setup">
                Edit
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <InventoryBar claimTypes={enabledClaimTypes} claimCounts={claimCounts} />
          </CardContent>
        </Card>

        <section className="space-y-3">
          <SectionHeader
            label="Activity"
            title="Claim history"
            description="Latest approved scans. Updates in real time."
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/attendees">
                  Attendees
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            }
          />
          <ClaimFeed
            claims={claims}
            attendees={attendees}
            claimTypes={activeEvent?.claimTypes ?? []}
            attempts={attempts}
          />
        </section>
      </div>
    </AppShell>
  );
}

export default function StatsPage() {
  return (
    <AuthGate>
      <StatsContent />
    </AuthGate>
  );
}
