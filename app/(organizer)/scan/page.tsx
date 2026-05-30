"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getEventById } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { ScannerPanel } from "@/components/scanner/ScannerPanel";
import { useActiveEvent } from "@/hooks/useActiveEvent";
import type { ClaimType } from "@/lib/types";

export default function ScanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { eventId } = useActiveEvent();
  const [eventName, setEventName] = useState<string | undefined>();
  const [claimTypes, setClaimTypes] = useState<ClaimType[]>([]);

  useEffect(() => {
    if (!eventId) return;
    getEventById(eventId).then((ev) => {
      if (!ev) {
        router.replace("/dashboard");
        return;
      }
      setEventName(ev.eventName);
      setClaimTypes(ev.claimTypes);
    });
  }, [eventId, router]);

  const scannedBy = user?.displayName || user?.email || "Volunteer";

  return (
    <AppShell title="Scanner" description={eventName ?? "Scan or enter ticket IDs to validate claims."}>
      {eventId ? (
        <ScannerPanel
          eventId={eventId}
          scannedBy={scannedBy}
          claimTypes={claimTypes}
        />
      ) : null}
    </AppShell>
  );
}
