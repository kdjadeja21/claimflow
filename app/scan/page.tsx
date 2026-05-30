"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/AppShell";
import { ClaimResult } from "@/components/scanner/ClaimResult";
import { ManualEntry } from "@/components/scanner/ManualEntry";
import { QRScanner } from "@/components/scanner/QRScanner";
import {
  addAttendee,
  getActiveClaimTypes,
  getSettings,
  initializeClaimFlow,
  validateAndRecordClaim,
} from "@/lib/storage";
import type { ClaimType, ClaimValidationResult } from "@/lib/types";
import { parseQRPayload } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ScanPage() {
  const [claimTypes, setClaimTypes] = useState<ClaimType[]>([]);
  const [claimType, setClaimType] = useState("");
  const [volunteerName, setVolunteerName] = useState("Volunteer");
  const [result, setResult] = useState<ClaimValidationResult | null>(null);
  const [lastTicketId, setLastTicketId] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      initializeClaimFlow();
      const activeClaimTypes = getActiveClaimTypes();
      const settings = getSettings();

      setClaimTypes(activeClaimTypes);
      setClaimType(activeClaimTypes[0]?.id ?? "");
      setVolunteerName(settings.volunteerName);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!result) return;
    const timeout = window.setTimeout(() => setResult(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [result]);

  function handleScan(payload: string) {
    const { ticketId, lumaTicketUrl } = parseQRPayload(payload);

    if (!ticketId || !claimType || ticketId === lastTicketId) return;

    setLastTicketId(ticketId);
    window.setTimeout(() => setLastTicketId(""), 2500);

    const nextResult = validateAndRecordClaim(ticketId, claimType, volunteerName || "Volunteer", lumaTicketUrl);

    if (lumaTicketUrl && nextResult.attendee && !nextResult.attendee.lumaTicketUrl) {
      addAttendee({ ...nextResult.attendee, lumaTicketUrl });
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
  }

  return (
    <AppShell title="Scanner" description="Scan or enter ticket IDs to validate claims.">
      <div className="mx-auto flex max-w-sm flex-col gap-4">

        {/* Claim type selector */}
        {claimTypes.length > 0 ? (
          <div
            role="group"
            aria-label="Claim type"
            className="flex flex-wrap gap-2"
          >
            {claimTypes.map((item) => (
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
              No claim types configured. Ask an organizer to set up the event.
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
    </AppShell>
  );
}
