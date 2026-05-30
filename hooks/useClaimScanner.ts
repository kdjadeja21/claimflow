"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { addAttendee, validateAndRecordClaim } from "@/lib/db";
import {
  SCAN_DEDUPE_MS,
  SCAN_RESULT_VISIBLE_MS,
  VIBRATE_APPROVED_MS,
  VIBRATE_REJECTED_MS,
} from "@/lib/constants";
import type { ClaimType, ClaimValidationResult } from "@/lib/types";
import { parseQRPayload } from "@/lib/utils";

interface UseClaimScannerOptions {
  eventId: string | null | undefined;
  scannedBy: string;
  claimTypes: ClaimType[];
}

export function useClaimScanner({
  eventId,
  scannedBy,
  claimTypes,
}: UseClaimScannerOptions) {
  const [selectedClaimType, setSelectedClaimType] = useState<string | null>(null);

  const enabledClaimTypes = useMemo(
    () => claimTypes.filter((ct) => ct.enabled),
    [claimTypes]
  );

  const claimType = selectedClaimType ?? enabledClaimTypes[0]?.id ?? "";
  const [result, setResult] = useState<ClaimValidationResult | null>(null);

  // Dedupe guards are refs (not state) so they update synchronously within a
  // single tick. html5-qrcode fires the decode callback ~12x/sec plus a
  // periodic inverted-frame fallback, so many callbacks arrive before any
  // setState commits. A ref lock is the only reliable way to drop them.
  const processingRef = useRef(false);
  const lastTicketRef = useRef<{ id: string; at: number } | null>(null);

  useEffect(() => {
    if (!result) return;
    const timeout = window.setTimeout(
      () => setResult(null),
      SCAN_RESULT_VISIBLE_MS
    );
    return () => window.clearTimeout(timeout);
  }, [result]);

  async function handleScan(payload: string) {
    if (!eventId || !claimType) return;
    const { ticketId, lumaTicketUrl } = parseQRPayload(payload);
    if (!ticketId) return;

    // Drop while a claim is already being recorded.
    if (processingRef.current) return;

    // Drop repeats of the same ticket inside the dedupe window.
    const now = Date.now();
    const last = lastTicketRef.current;
    if (last && last.id === ticketId && now - last.at < SCAN_DEDUPE_MS) return;

    processingRef.current = true;
    lastTicketRef.current = { id: ticketId, at: now };

    try {
      const nextResult = await validateAndRecordClaim(
        ticketId,
        claimType,
        scannedBy,
        eventId,
        lumaTicketUrl
      );

      if (lumaTicketUrl && nextResult.attendee && !nextResult.attendee.lumaTicketUrl) {
        await addAttendee({ ...nextResult.attendee, lumaTicketUrl });
      }

      setResult(nextResult);

      if (navigator.vibrate) {
        navigator.vibrate(
          nextResult.status === "approved"
            ? VIBRATE_APPROVED_MS
            : [...VIBRATE_REJECTED_MS]
        );
      }

      if (nextResult.status === "approved") {
        toast.success("Claim approved");
      } else {
        toast.error(nextResult.message);
      }
    } catch {
      // Allow an immediate retry of a failed scan rather than locking it out.
      lastTicketRef.current = null;
      toast.error("Scan failed. Please try again.");
    } finally {
      // Refresh the timestamp so the dedupe window starts after work finishes.
      if (lastTicketRef.current?.id === ticketId) {
        lastTicketRef.current = { id: ticketId, at: Date.now() };
      }
      processingRef.current = false;
    }
  }

  return {
    claimType,
    setClaimType: setSelectedClaimType,
    result,
    setResult,
    enabledClaimTypes,
    handleScan,
  };
}
