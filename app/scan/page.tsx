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
    <AppShell title="Scanner">
      <div className="mx-auto flex max-w-sm flex-col gap-4">
        {/* Claim type pill toggles */}
        {claimTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {claimTypes.map((item) => (
              <button
                key={item.id}
                onClick={() => setClaimType(item.id)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                  claimType === item.id
                    ? "bg-lime-400 text-black"
                    : "border border-border bg-transparent text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No claim types configured. Ask an organizer to set up the event.
          </p>
        )}

        {/* Scanner with result overlay */}
        <div className="relative">
          <QRScanner paused={Boolean(result) || !claimType} onScan={handleScan} />
          {result ? (
            <ClaimResult result={result} onReset={() => setResult(null)} />
          ) : null}
        </div>

        <ManualEntry onSubmit={handleScan} />
      </div>
    </AppShell>
  );
}
