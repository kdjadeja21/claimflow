"use client";

import { usePublicEvent } from "@/components/providers/PublicEventProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ScannerPanel } from "@/components/scanner/ScannerPanel";
import { VolunteerPinGate } from "@/components/shared/VolunteerPinGate";

export default function PublicScanPage() {
  const { event, slug } = usePublicEvent();

  if (!event.pinHash) {
    return (
      <AppShell
        title="Scanner"
        description={event.eventName}
        navMode="public"
        slug={slug}
        backHref={`/e/${slug}`}
      >
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            This event has not been set up for volunteer scanning.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Scanner"
      description={event.eventName}
      navMode="public"
      slug={slug}
      backHref={`/e/${slug}`}
    >
      <VolunteerPinGate pinHash={event.pinHash} slug={slug} eventName={event.eventName}>
        <ScannerPanel
          eventId={event.eventId}
          scannedBy="Volunteer"
          claimTypes={event.claimTypes}
          emptyMessage="No claim types are active for this event."
        />
      </VolunteerPinGate>
    </AppShell>
  );
}
