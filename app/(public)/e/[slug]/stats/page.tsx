"use client";

import { usePublicEvent } from "@/components/providers/PublicEventProvider";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ClaimFeed } from "@/components/dashboard/ClaimFeed";
import { InventoryBar } from "@/components/dashboard/InventoryBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEventData } from "@/hooks/useEventData";
import { useEventStats } from "@/hooks/useEventStats";

export default function PublicStatsPage() {
  const { event, slug } = usePublicEvent();
  const { claims, attempts, attendees } = useEventData(event.eventId);
  const {
    enabledClaimTypes,
    claimCounts,
    uniqueClaimed,
    remainingInventory,
    duplicateAttempts,
    attendeeCount,
  } = useEventStats(event, { claims, attempts, attendees });

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
          totalAttendees={attendeeCount}
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
