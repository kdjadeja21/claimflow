"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeToEventData } from "@/lib/db";
import { usePublicEvent } from "@/app/e/[slug]/layout";
import { AppShell } from "@/components/shared/AppShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ClaimFeed } from "@/components/dashboard/ClaimFeed";
import { InventoryBar } from "@/components/dashboard/InventoryBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Attendee, Claim, ScanAttempt } from "@/lib/types";

export default function PublicStatsPage() {
  const { event, slug } = usePublicEvent();

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [attempts, setAttempts] = useState<ScanAttempt[]>([]);

  useEffect(() => {
    const unsub = subscribeToEventData(event.eventId, (data) => {
      setClaims(data.claims);
      setAttempts(data.attempts);
      setAttendees(data.attendees);
    });
    return unsub;
  }, [event.eventId]);

  const enabledClaimTypes = useMemo(
    () => event.claimTypes.filter((ct) => ct.enabled),
    [event]
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
    <AppShell
      title="Stats"
      description={event.eventName}
      navMode="public"
      slug={slug}
      backHref={`/e/${slug}`}
    >
      <div className="space-y-6">
        <StatsGrid
          totalAttendees={attendees.length}
          uniqueClaimed={uniqueClaimed}
          remainingInventory={remainingInventory}
          duplicateAttempts={duplicateAttempts}
        />

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Real-time usage across enabled claim categories.</CardDescription>
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
          />
          <ClaimFeed
            claims={claims}
            attendees={attendees}
            claimTypes={event.claimTypes}
            attempts={attempts}
          />
        </section>
      </div>
    </AppShell>
  );
}
