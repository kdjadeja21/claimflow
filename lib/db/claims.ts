import {
  collection,
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateId } from "@/lib/utils";
import type {
  Attendee,
  Claim,
  ClaimValidationResult,
  ScanAttempt,
} from "@/lib/types";

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

function makeClaimDocId(ticketId: string, claimType: string): string {
  return `${ticketId.toLowerCase().replace(/\//g, "_")}__${claimType}`;
}

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
