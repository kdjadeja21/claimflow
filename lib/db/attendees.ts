import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Attendee } from "@/lib/types";

const BATCH_SIZE = 500;

export async function getAttendees(eventId: string): Promise<Attendee[]> {
  const snap = await getDocs(collection(db, "events", eventId, "attendees"));
  return snap.docs.map((d) => d.data() as Attendee);
}

export async function addAttendee(attendee: Attendee): Promise<void> {
  if (!attendee.ticketId.trim()) return;
  const normalized = { ...attendee, ticketId: attendee.ticketId.trim() };
  await setDoc(
    doc(
      db,
      "events",
      attendee.eventId,
      "attendees",
      normalized.ticketId.toLowerCase()
    ),
    normalized,
    { merge: true }
  );
}

export async function bulkAddAttendees(attendees: Attendee[]): Promise<number> {
  const valid = attendees.filter((a) => a.ticketId.trim());
  if (valid.length === 0) return 0;

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const chunk = valid.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const attendee of chunk) {
      const normalized = { ...attendee, ticketId: attendee.ticketId.trim() };
      const ref = doc(
        db,
        "events",
        attendee.eventId,
        "attendees",
        normalized.ticketId.toLowerCase()
      );
      batch.set(ref, normalized, { merge: true });
    }

    await batch.commit();
  }

  return valid.length;
}

export async function deleteAttendee(
  ticketId: string,
  eventId: string
): Promise<void> {
  await deleteDoc(
    doc(db, "events", eventId, "attendees", ticketId.toLowerCase())
  );
}

export async function deleteSelectedAttendees(
  ticketIds: string[],
  eventId: string
): Promise<void> {
  if (ticketIds.length === 0) return;

  for (let i = 0; i < ticketIds.length; i += BATCH_SIZE) {
    const chunk = ticketIds.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, "events", eventId, "attendees", id.toLowerCase()));
    }
    await batch.commit();
  }
}

export async function deleteAllAttendees(eventId: string): Promise<void> {
  const snap = await getDocs(collection(db, "events", eventId, "attendees"));
  if (snap.empty) return;

  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const d of chunk) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
}
