"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppShell } from "@/components/layout/AppShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ClaimFeed } from "@/components/dashboard/ClaimFeed";
import { InventoryBar } from "@/components/dashboard/InventoryBar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteClaimRecord } from "@/lib/db";
import { useActiveEvent } from "@/hooks/useActiveEvent";
import { useEventData } from "@/hooks/useEventData";
import { useEventStats } from "@/hooks/useEventStats";
import type { Claim } from "@/lib/types";

export default function StatsPage() {
  const { user } = useAuth();
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
  const canDeleteClaims = !!event && !!user && user.uid === event.ownerUid;

  async function handleDeleteClaim(claim: Claim) {
    if (!event || !user || user.uid !== event.ownerUid) {
      toast.error("Only the event creator can delete claim history records.");
      return;
    }

    try {
      await deleteClaimRecord(event.eventId, claim.id);
      toast.success("Claim history record deleted");
    } catch {
      toast.error("Failed to delete claim history record");
    }
  }

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
            canDeleteClaims={canDeleteClaims}
            onDeleteClaim={handleDeleteClaim}
          />
        </section>
      </div>
    </AppShell>
  );
}
