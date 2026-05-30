import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_CLAIM_TYPES } from "@/lib/constants";
import { generateId } from "@/lib/utils";
import type { ClaimEvent } from "@/lib/types";
import { hashPin } from "@/lib/db/claims";

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
  const publicSlug =
    currentSlug ??
    generateSlug((await getEventById(eventId))?.eventName ?? "event");
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

  const attemptsSnap = await getDocs(
    collection(db, "events", eventId, "attempts")
  );
  attemptsSnap.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
}

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
