"use client";

import { useEffect, useState } from "react";
import { subscribeToEventData } from "@/lib/db";
import type { Attendee, Claim, ClaimEvent, ScanAttempt } from "@/lib/types";

const EMPTY_DATA = {
  event: null as ClaimEvent | null,
  claims: [] as Claim[],
  attempts: [] as ScanAttempt[],
  attendees: [] as Attendee[],
};

export function useEventData(eventId: string | null) {
  const [data, setData] = useState(EMPTY_DATA);

  useEffect(() => {
    if (!eventId) return;
    const unsub = subscribeToEventData(eventId, setData);
    return unsub;
  }, [eventId]);

  return data;
}
