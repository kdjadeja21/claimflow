"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [lastTicketId, setLastTicketId] = useState("");

  useEffect(() => {
    if (!result) return;
    const timeout = window.setTimeout(
      () => setResult(null),
      SCAN_RESULT_VISIBLE_MS
    );
    return () => window.clearTimeout(timeout);
  }, [result]);

  async function handleScan(payload: string) {
    if (!eventId) return;
    const { ticketId, lumaTicketUrl } = parseQRPayload(payload);

    if (!ticketId || !claimType || ticketId === lastTicketId) return;

    setLastTicketId(ticketId);
    window.setTimeout(() => setLastTicketId(""), SCAN_DEDUPE_MS);

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
      toast.error("Scan failed. Please try again.");
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
