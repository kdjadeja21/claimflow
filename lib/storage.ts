import type {
  AppSettings,
  Attendee,
  Claim,
  ClaimEvent,
  ClaimType,
  ClaimValidationResult,
  ScanAttempt,
} from "@/lib/types";
import { generateId } from "@/lib/utils";

const KEYS = {
  events: "claimflow:events",
  attendees: "claimflow:attendees",
  claims: "claimflow:claims",
  attempts: "claimflow:scan-attempts",
  settings: "claimflow:settings",
} as const;

export const DEFAULT_CLAIM_TYPES: ClaimType[] = [
  { id: "snacks", label: "Snacks", inventory: 100, enabled: true },
  { id: "lunch", label: "Lunch", inventory: 100, enabled: true },
  { id: "swag", label: "Swag", inventory: 75, enabled: true },
  { id: "tshirts", label: "T-shirts", inventory: 50, enabled: true },
];

const DEFAULT_EVENT_ID = "event-demo";

export const DEFAULT_SETTINGS: AppSettings = {
  organizerPin: "1234",
  volunteerName: "Volunteer",
  activeEventId: DEFAULT_EVENT_ID,
};

export function createDefaultEvent(): ClaimEvent {
  return {
    eventId: DEFAULT_EVENT_ID,
    eventName: "Community Meetup",
    claimTypes: DEFAULT_CLAIM_TYPES,
    createdAt: new Date().toISOString(),
    ownerUid: "",
    isPublic: false,
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readKey<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeKey<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("claimflow:data-change"));
}

export function initializeClaimFlow() {
  if (!canUseStorage()) {
    return;
  }

  if (!window.localStorage.getItem(KEYS.events)) {
    writeKey(KEYS.events, [createDefaultEvent()]);
  }

  if (!window.localStorage.getItem(KEYS.settings)) {
    writeKey(KEYS.settings, DEFAULT_SETTINGS);
  }

  if (!window.localStorage.getItem(KEYS.attendees)) {
    writeKey(KEYS.attendees, []);
  }

  if (!window.localStorage.getItem(KEYS.claims)) {
    writeKey(KEYS.claims, []);
  }

  if (!window.localStorage.getItem(KEYS.attempts)) {
    writeKey(KEYS.attempts, []);
  }
}

export function getEvents() {
  return readKey<ClaimEvent[]>(KEYS.events, []);
}

export function saveEvents(events: ClaimEvent[]) {
  writeKey(KEYS.events, events);
}

export function getAttendees() {
  return readKey<Attendee[]>(KEYS.attendees, []);
}

export function saveAttendees(attendees: Attendee[]) {
  writeKey(KEYS.attendees, attendees);
}

export function getClaims() {
  return readKey<Claim[]>(KEYS.claims, []);
}

export function saveClaims(claims: Claim[]) {
  writeKey(KEYS.claims, claims);
}

export function getScanAttempts() {
  return readKey<ScanAttempt[]>(KEYS.attempts, []);
}

export function saveScanAttempts(attempts: ScanAttempt[]) {
  writeKey(KEYS.attempts, attempts);
}

export function getSettings() {
  return readKey<AppSettings>(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings) {
  writeKey(KEYS.settings, settings);
}

export function getActiveEvent() {
  const settings = getSettings();
  return getEvents().find((event) => event.eventId === settings.activeEventId) ?? null;
}

export function getActiveClaimTypes() {
  return getActiveEvent()?.claimTypes.filter((claimType) => claimType.enabled) ?? [];
}

export function upsertEvent(event: ClaimEvent) {
  const events = getEvents();
  const exists = events.some((item) => item.eventId === event.eventId);

  saveEvents(exists ? events.map((item) => (item.eventId === event.eventId ? event : item)) : [...events, event]);
  saveSettings({ ...getSettings(), activeEventId: event.eventId });
}

export function resetClaimsForEvent(eventId: string) {
  saveClaims(getClaims().filter((claim) => claim.eventId !== eventId));
  saveScanAttempts(getScanAttempts().filter((attempt) => attempt.eventId !== eventId));
}

export function addAttendee(attendee: Attendee) {
  const attendees = getAttendees();
  const normalizedTicketId = attendee.ticketId.trim();

  if (!normalizedTicketId) {
    return;
  }

  const nextAttendee = { ...attendee, ticketId: normalizedTicketId };
  const exists = attendees.some(
    (item) => item.ticketId.toLowerCase() === normalizedTicketId.toLowerCase() && item.eventId === attendee.eventId
  );

  saveAttendees(
    exists
      ? attendees.map((item) =>
          item.ticketId.toLowerCase() === normalizedTicketId.toLowerCase() && item.eventId === attendee.eventId
            ? nextAttendee
            : item
        )
      : [...attendees, nextAttendee]
  );
}

export function deleteAttendee(ticketId: string, eventId: string) {
  saveAttendees(getAttendees().filter((attendee) => attendee.ticketId !== ticketId || attendee.eventId !== eventId));
}

export function validateAndRecordClaim(
  ticketId: string,
  claimType: string,
  scannedBy: string,
  lumaTicketUrl?: string
): ClaimValidationResult {
  const activeEvent = getActiveEvent();
  const normalizedTicketId = ticketId.trim();

  if (!activeEvent || !normalizedTicketId) {
    return recordAttempt({
      ticketId: normalizedTicketId,
      claimType,
      status: "invalid_qr",
      scannedBy,
      eventId: activeEvent?.eventId ?? "unknown",
      message: "Invalid QR. No active event or ticket ID was found.",
    });
  }

  const attendee = getAttendees().find(
    (item) => item.eventId === activeEvent.eventId && item.ticketId.toLowerCase() === normalizedTicketId.toLowerCase()
  );

  const displayName = attendee?.name || attendee?.ticketId || normalizedTicketId;
  const resolvedTicketId = attendee?.ticketId ?? normalizedTicketId;

  const existingClaim = getClaims().find(
    (claim) =>
      claim.eventId === activeEvent.eventId &&
      claim.ticketId.toLowerCase() === normalizedTicketId.toLowerCase() &&
      claim.claimType === claimType
  );

  if (existingClaim) {
    return recordAttempt({
      ticketId: resolvedTicketId,
      claimType,
      status: "already_claimed",
      scannedBy,
      eventId: activeEvent.eventId,
      message: `${displayName} already claimed this item.`,
      attendee,
      claim: existingClaim,
    });
  }

  const claim: Claim = {
    id: generateId("claim"),
    ticketId: resolvedTicketId,
    claimType,
    claimedAt: new Date().toISOString(),
    claimedBy: scannedBy,
    eventId: activeEvent.eventId,
    ...(lumaTicketUrl ? { lumaTicketUrl } : {}),
  };

  saveClaims([...getClaims(), claim]);

  return recordAttempt({
    ticketId: resolvedTicketId,
    claimType,
    status: "approved",
    scannedBy,
    eventId: activeEvent.eventId,
    message: `${displayName} is approved.`,
    attendee,
    claim,
  });
}

function recordAttempt({
  ticketId,
  claimType,
  status,
  scannedBy,
  eventId,
  message,
  attendee,
  claim,
}: {
  ticketId: string;
  claimType: string;
  status: ScanAttempt["status"];
  scannedBy: string;
  eventId: string;
  message: string;
  attendee?: Attendee;
  claim?: Claim;
}): ClaimValidationResult {
  const attempt: ScanAttempt = {
    id: generateId("scan"),
    ticketId,
    claimType,
    status,
    scannedAt: new Date().toISOString(),
    scannedBy,
    eventId,
  };

  saveScanAttempts([...getScanAttempts(), attempt]);

  return {
    status,
    message,
    attendee,
    claim,
  };
}
