import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateId } from "@/lib/utils";
import type {
  Attendee,
  Claim,
  ClaimEvent,
  ClaimType,
  ClaimValidationResult,
  ScanAttempt,
} from "@/lib/types";

// ─── PIN helpers ─────────────────────────────────────────────────────────────

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const candidate = await hashPin(pin);
  return candidate === hash;
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function generateSlug(eventName: string): string {
  const base = eventName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

// Claim doc IDs are deterministic so a Firestore transaction can `get` them
function makeClaimDocId(ticketId: string, claimType: string): string {
  return `${ticketId.toLowerCase().replace(/\//g, "_")}__${claimType}`;
}

// ─── Default claim types ─────────────────────────────────────────────────────

export const DEFAULT_CLAIM_TYPES: ClaimType[] = [
  { id: "snacks", label: "Snacks", inventory: 100, enabled: true },
];

// ─── Events ──────────────────────────────────────────────────────────────────

export async function createEvent(
  eventName: string,
  ownerUid: string
): Promise<ClaimEvent> {
  const eventId = generateId("event");
  const event: ClaimEvent = {
    eventId,
    eventName,
    claimTypes: DEFAULT_CLAIM_TYPES,
    createdAt: new Date().toISOString(),
    ownerUid,
    isPublic: false,
  };
  await setDoc(doc(db, "events", eventId), event);
  return event;
}

export async function getMyEvents(ownerUid: string): Promise<ClaimEvent[]> {
  const q = query(collection(db, "events"), where("ownerUid", "==", ownerUid));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as ClaimEvent)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getEventById(eventId: string): Promise<ClaimEvent | null> {
  const snap = await getDoc(doc(db, "events", eventId));
  return snap.exists() ? (snap.data() as ClaimEvent) : null;
}

export async function getEventBySlug(slug: string): Promise<ClaimEvent | null> {
  const q = query(
    collection(db, "events"),
    where("publicSlug", "==", slug),
    where("isPublic", "==", true)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as ClaimEvent;
}

export async function updateEvent(
  event: Partial<ClaimEvent> & { eventId: string }
): Promise<void> {
  const { eventId, ...rest } = event;
  await updateDoc(doc(db, "events", eventId), rest as Record<string, unknown>);
}

export async function makeEventPublic(
  eventId: string,
  pin: string,
  currentSlug?: string
): Promise<{ publicSlug: string }> {
  const pinHash = await hashPin(pin);
  const publicSlug = currentSlug ?? generateSlug((await getEventById(eventId))?.eventName ?? "event");
  await updateDoc(doc(db, "events", eventId), {
    isPublic: true,
    publicSlug,
    pinHash,
  });
  return { publicSlug };
}

export async function makeEventPrivate(eventId: string): Promise<void> {
  await updateDoc(doc(db, "events", eventId), {
    isPublic: false,
  });
}

export async function resetEventClaims(eventId: string): Promise<void> {
  const batch = writeBatch(db);

  const claimsSnap = await getDocs(collection(db, "events", eventId, "claims"));
  claimsSnap.docs.forEach((d) => batch.delete(d.ref));

  const attemptsSnap = await getDocs(collection(db, "events", eventId, "attempts"));
  attemptsSnap.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
}

// ─── User preferences ────────────────────────────────────────────────────────

export async function getUserActiveEventId(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ((snap.data().activeEventId as string) ?? null) : null;
}

export async function setUserActiveEventId(
  uid: string,
  eventId: string
): Promise<void> {
  await setDoc(doc(db, "users", uid), { activeEventId: eventId }, { merge: true });
}

// ─── Attendees ───────────────────────────────────────────────────────────────

export async function getAttendees(eventId: string): Promise<Attendee[]> {
  const snap = await getDocs(collection(db, "events", eventId, "attendees"));
  return snap.docs.map((d) => d.data() as Attendee);
}

export async function addAttendee(attendee: Attendee): Promise<void> {
  if (!attendee.ticketId.trim()) return;
  const normalized = { ...attendee, ticketId: attendee.ticketId.trim() };
  await setDoc(
    doc(db, "events", attendee.eventId, "attendees", normalized.ticketId.toLowerCase()),
    normalized,
    { merge: true }
  );
}

export async function deleteAttendee(
  ticketId: string,
  eventId: string
): Promise<void> {
  await deleteDoc(
    doc(db, "events", eventId, "attendees", ticketId.toLowerCase())
  );
}

// ─── Real-time subscriptions ──────────────────────────────────────────────────

export function subscribeToEventData(
  eventId: string,
  callback: (data: {
    event: ClaimEvent | null;
    claims: Claim[];
    attempts: ScanAttempt[];
    attendees: Attendee[];
  }) => void
): () => void {
  let eventDoc: ClaimEvent | null = null;
  let claims: Claim[] = [];
  let attempts: ScanAttempt[] = [];
  let attendees: Attendee[] = [];

  function emit() {
    callback({ event: eventDoc, claims, attempts, attendees });
  }

  const unsubEvent = onSnapshot(doc(db, "events", eventId), (snap) => {
    eventDoc = snap.exists() ? (snap.data() as ClaimEvent) : null;
    emit();
  });

  const unsubClaims = onSnapshot(
    collection(db, "events", eventId, "claims"),
    (snap) => {
      claims = snap.docs.map((d) => d.data() as Claim);
      emit();
    }
  );

  const unsubAttempts = onSnapshot(
    collection(db, "events", eventId, "attempts"),
    (snap) => {
      attempts = snap.docs.map((d) => d.data() as ScanAttempt);
      emit();
    }
  );

  const unsubAttendees = onSnapshot(
    collection(db, "events", eventId, "attendees"),
    (snap) => {
      attendees = snap.docs.map((d) => d.data() as Attendee);
      emit();
    }
  );

  return () => {
    unsubEvent();
    unsubClaims();
    unsubAttempts();
    unsubAttendees();
  };
}

// ─── Claim validation ────────────────────────────────────────────────────────

export async function validateAndRecordClaim(
  ticketId: string,
  claimType: string,
  scannedBy: string,
  eventId: string,
  lumaTicketUrl?: string
): Promise<ClaimValidationResult> {
  const normalizedTicketId = ticketId.trim();
  if (!normalizedTicketId || !eventId) {
    return {
      status: "invalid_qr",
      message: "Invalid QR. No ticket ID found.",
    };
  }

  const claimDocId = makeClaimDocId(normalizedTicketId, claimType);
  const claimRef = doc(db, "events", eventId, "claims", claimDocId);
  const attemptRef = doc(
    collection(db, "events", eventId, "attempts"),
    generateId("scan")
  );

  const attendeeSnap = await getDoc(
    doc(db, "events", eventId, "attendees", normalizedTicketId.toLowerCase())
  );
  const attendee = attendeeSnap.exists()
    ? (attendeeSnap.data() as Attendee)
    : undefined;

  const displayName =
    attendee?.name || attendee?.ticketId || normalizedTicketId;

  return runTransaction(db, async (tx) => {
    const claimSnap = await tx.get(claimRef);

    const attemptBase: ScanAttempt = {
      id: attemptRef.id,
      ticketId: normalizedTicketId,
      claimType,
      scannedAt: new Date().toISOString(),
      scannedBy,
      eventId,
      status: "approved",
    };

    if (claimSnap.exists()) {
      const attempt: ScanAttempt = { ...attemptBase, status: "already_claimed" };
      tx.set(attemptRef, attempt);
      return {
        status: "already_claimed" as const,
        message: `${displayName} already claimed this item.`,
        attendee,
        claim: claimSnap.data() as Claim,
      };
    }

    const claim: Claim = {
      id: claimDocId,
      ticketId: normalizedTicketId,
      claimType,
      claimedAt: new Date().toISOString(),
      claimedBy: scannedBy,
      eventId,
      ...(lumaTicketUrl ? { lumaTicketUrl } : {}),
    };

    tx.set(claimRef, claim);
    tx.set(attemptRef, attemptBase);

    return {
      status: "approved" as const,
      message: `${displayName} is approved.`,
      attendee,
      claim,
    };
  });
}
