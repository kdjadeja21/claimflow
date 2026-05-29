"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/shared/AppShell";
import { PinGate } from "@/components/shared/PinGate";
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
      setAttendees(getAttendees().filter((attendee) => attendee.eventId === event?.eventId));
      setClaims(getClaims().filter((claim) => claim.eventId === event?.eventId));
      setAttempts(getScanAttempts().filter((attempt) => attempt.eventId === event?.eventId));
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
      enabledClaims.reduce<Record<string, number>>((counts, claim) => {
        counts[claim.claimType] = (counts[claim.claimType] ?? 0) + 1;
        return counts;
      }, {}),
    [enabledClaims]
  );

  const uniqueClaimed = new Set(enabledClaims.map((claim) => claim.ticketId.toLowerCase())).size;
  const totalInventory = enabledClaimTypes.reduce((total, item) => total + item.inventory, 0);
  const remainingInventory = Math.max(0, totalInventory - enabledClaims.length);
  const duplicateAttempts = attempts.filter((attempt) => attempt.status === "already_claimed").length;

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
                <CardTitle>Inventory velocity</CardTitle>
                <CardDescription>Real-time usage across enabled claim categories.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/setup">
                  Edit
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <InventoryBar claimTypes={enabledClaimTypes} claimCounts={claimCounts} />
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Activity
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em]">Claim history</h2>
                <p className="text-sm text-muted-foreground">
                  Latest approved scans sync every second. Retries show passed vs failed counts.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="w-fit shrink-0">
                <Link href="/attendees">
                  Attendees
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
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
