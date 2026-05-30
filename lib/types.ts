export type ClaimStatus =
  | "approved"
  | "already_claimed"
  | "invalid_qr"
  | "not_allowed";

export interface ClaimType {
  id: string;
  label: string;
  inventory: number;
  enabled: boolean;
}

export interface ClaimEvent {
  eventId: string;
  eventName: string;
  claimTypes: ClaimType[];
  createdAt: string;
  ownerUid: string;
  isPublic: boolean;
  publicSlug?: string;
  pinHash?: string;
}

export interface Attendee {
  ticketId: string;
  name: string;
  email: string;
  eventId: string;
  lumaTicketUrl?: string;
  phone?: string;
  company?: string;
  ticketType?: string;
  approvalStatus?: string;
  checkedInAt?: string;
  professionalStatus?: string;
}

export interface Claim {
  id: string;
  ticketId: string;
  claimType: string;
  claimedAt: string;
  claimedBy: string;
  eventId: string;
  lumaTicketUrl?: string;
}

export interface ScanAttempt {
  id: string;
  ticketId: string;
  claimType: string;
  status: ClaimStatus;
  scannedAt: string;
  scannedBy: string;
  eventId: string;
}

export interface AppSettings {
  organizerPin: string;
  volunteerName: string;
  activeEventId: string | null;
}

export interface ClaimValidationResult {
  status: ClaimStatus;
  message: string;
  attendee?: Attendee;
  claim?: Claim;
}

export interface EventData {
  event: ClaimEvent;
  claims: Claim[];
  attempts: ScanAttempt[];
  attendees: Attendee[];
}
