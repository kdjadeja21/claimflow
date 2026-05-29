export type ClaimStatus = "approved" | "already_claimed" | "invalid_qr";

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
}

export interface Attendee {
  ticketId: string;
  name: string;
  email: string;
  eventId: string;
  lumaTicketUrl?: string;
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
