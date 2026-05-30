import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Attendee,
  Claim,
  ClaimEvent,
  ScanAttempt,
} from "@/lib/types";

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
