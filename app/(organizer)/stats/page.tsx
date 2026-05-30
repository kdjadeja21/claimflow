"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ClaimFeed } from "@/components/dashboard/ClaimFeed";
import { InventoryBar } from "@/components/dashboard/InventoryBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveEvent } from "@/hooks/useActiveEvent";
import { useEventData } from "@/hooks/useEventData";
import { useEventStats } from "@/hooks/useEventStats";

export default function StatsPage() {
  const { eventId } = useActiveEvent();
  const { event, claims, attempts, attendees } = useEventData(eventId);
  const {
    enabledClaimTypes,
    claimCounts,
    uniqueClaimed,
    remainingInventory,
    duplicateAttempts,
    attendeeCount,
  } = useEventStats(event, { claims, attempts, attendees });

  return (
    <AppShell title="Stats" description={event?.eventName ?? "Live claim analytics"}>
      <div className="space-y-6">
        <StatsGrid
          totalAttendees={attendeeCount}
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
            claimTypes={event?.claimTypes ?? []}
            attempts={attempts}
          />
        </section>
      </div>
    </AppShell>
  );
}
