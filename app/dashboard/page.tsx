"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/shared/AppShell";
import { PinGate } from "@/components/shared/PinGate";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ClaimFeed } from "@/components/dashboard/ClaimFeed";
import { InventoryBar } from "@/components/dashboard/InventoryBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import {
  getActiveEvent,
  getAttendees,
  getClaims,
  getScanAttempts,
  initializeClaimFlow,
} from "@/lib/storage";
import type { Attendee, Claim, ClaimEvent, ScanAttempt } from "@/lib/types";

export default function DashboardPage() {
  const [activeEvent, setActiveEvent] = useState<ClaimEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [attempts, setAttempts] = useState<ScanAttempt[]>([]);

  useEffect(() => {
    initializeClaimFlow();

    function refresh() {
      const event = getActiveEvent();
      setActiveEvent(event);
      setAttendees(getAttendees().filter((a) => a.eventId === event?.eventId));
      setClaims(getClaims().filter((c) => c.eventId === event?.eventId));
      setAttempts(getScanAttempts().filter((a) => a.eventId === event?.eventId));
    }

    refresh();
    const interval = window.setInterval(refresh, 1000);
    window.addEventListener("claimflow:data-change", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("claimflow:data-change", refresh);
    };
  }, []);

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
    <AppShell title="Dashboard" description={activeEvent?.eventName ?? "Live claim analytics"}>
      <PinGate>
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
              description="Latest approved scans. Auto-refreshes every second."
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
      </PinGate>
    </AppShell>
  );
}
