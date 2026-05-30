"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { addAttendee, validateAndRecordClaim } from "@/lib/db";
import { usePublicEvent } from "@/app/e/[slug]/layout";
import { AppShell } from "@/components/shared/AppShell";
import { VolunteerPinGate } from "@/components/shared/VolunteerPinGate";
import { ClaimResult } from "@/components/scanner/ClaimResult";
import { ManualEntry } from "@/components/scanner/ManualEntry";
import { QRScanner } from "@/components/scanner/QRScanner";
import type { ClaimValidationResult } from "@/lib/types";
import { cn, parseQRPayload } from "@/lib/utils";

function ScannerContent({ pinHash }: { pinHash: string }) {
  const { event, slug } = usePublicEvent();
  const [claimType, setClaimType] = useState("");
  const [result, setResult] = useState<ClaimValidationResult | null>(null);
  const [lastTicketId, setLastTicketId] = useState("");

  const enabledClaimTypes = useMemo(
    () => event.claimTypes.filter((ct) => ct.enabled),
    [event]
  );

  useEffect(() => {
    if (!claimType && enabledClaimTypes.length > 0) {
      setClaimType(enabledClaimTypes[0]!.id);
    }
  }, [enabledClaimTypes, claimType]);

  useEffect(() => {
    if (!result) return;
    const t = window.setTimeout(() => setResult(null), 3000);
    return () => window.clearTimeout(t);
  }, [result]);

  async function handleScan(payload: string) {
    const { ticketId, lumaTicketUrl } = parseQRPayload(payload);
    if (!ticketId || !claimType || ticketId === lastTicketId) return;

    setLastTicketId(ticketId);
    window.setTimeout(() => setLastTicketId(""), 2500);

    try {
      const nextResult = await validateAndRecordClaim(
        ticketId,
        claimType,
        "Volunteer",
        event.eventId,
        lumaTicketUrl
      );

      if (lumaTicketUrl && nextResult.attendee && !nextResult.attendee.lumaTicketUrl) {
        await addAttendee({ ...nextResult.attendee, lumaTicketUrl });
      }

      setResult(nextResult);

      if (navigator.vibrate) {
        navigator.vibrate(nextResult.status === "approved" ? 120 : [80, 80, 160]);
      }

      if (nextResult.status === "approved") {
        toast.success("Claim approved");
      } else {
        toast.error(nextResult.message);
      }
    } catch {
      toast.error("Scan failed. Please try again.");
    }
  }

  return (
    <VolunteerPinGate pinHash={pinHash} slug={slug} eventName={event.eventName}>
      <div className="mx-auto flex max-w-sm flex-col gap-4">

        {/* Claim type selector */}
        {enabledClaimTypes.length > 0 ? (
          <div role="group" aria-label="Claim type" className="flex flex-wrap gap-2">
            {enabledClaimTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setClaimType(item.id)}
                aria-pressed={claimType === item.id}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  claimType === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              No claim types are active for this event.
            </p>
          </div>
        )}

        {/* Scanner with result overlay */}
        <div className="relative">
          <QRScanner paused={Boolean(result) || !claimType} onScan={handleScan} />
          {result && (
            <ClaimResult result={result} onReset={() => setResult(null)} />
          )}
        </div>

        <ManualEntry onSubmit={handleScan} />
      </div>
    </VolunteerPinGate>
  );
}

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
      <ScannerContent pinHash={event.pinHash} />
    </AppShell>
  );
}
