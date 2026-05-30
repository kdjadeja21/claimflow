import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Attendee } from "@/lib/types";

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

export async function deleteAttendee(
  ticketId: string,
  eventId: string
): Promise<void> {
  await deleteDoc(
    doc(db, "events", eventId, "attendees", ticketId.toLowerCase())
  );
}
