"use client";

import { useMemo } from "react";
import type { Attendee, Claim, ClaimEvent, ClaimType, ScanAttempt } from "@/lib/types";

interface EventDataSlice {
  claims: Claim[];
  attempts: ScanAttempt[];
  attendees: Attendee[];
}

export function useEventStats(
  event: ClaimEvent | null | undefined,
  data: EventDataSlice
) {
  const enabledClaimTypes = useMemo(
    () => (event?.claimTypes ?? []).filter((ct) => ct.enabled),
    [event]
  );

  const enabledClaimTypeIds = useMemo(
    () => new Set(enabledClaimTypes.map((ct) => ct.id)),
    [enabledClaimTypes]
  );

  const enabledClaims = useMemo(
    () => data.claims.filter((c) => enabledClaimTypeIds.has(c.claimType)),
    [data.claims, enabledClaimTypeIds]
  );

  const claimCounts = useMemo(
    () =>
      enabledClaims.reduce<Record<string, number>>((acc, claim) => {
        acc[claim.claimType] = (acc[claim.claimType] ?? 0) + 1;
        return acc;
      }, {}),
    [enabledClaims]
  );

  const uniqueClaimed = useMemo(
    () => new Set(enabledClaims.map((c) => c.ticketId.toLowerCase())).size,
    [enabledClaims]
  );

  const totalInventory = useMemo(
    () => enabledClaimTypes.reduce((t, ct) => t + ct.inventory, 0),
    [enabledClaimTypes]
  );

  const remainingInventory = Math.max(0, totalInventory - enabledClaims.length);
  const duplicateAttempts = data.attempts.filter(
    (a) => a.status === "already_claimed"
  ).length;

  return {
    enabledClaimTypes,
    enabledClaims,
    claimCounts,
    uniqueClaimed,
    totalInventory,
    remainingInventory,
    duplicateAttempts,
    attendeeCount: data.attendees.length,
    claimCount: enabledClaims.length,
  };
}

export function getEnabledClaimTypes(claimTypes: ClaimType[]): ClaimType[] {
  return claimTypes.filter((ct) => ct.enabled);
}
