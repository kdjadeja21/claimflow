import Papa from "papaparse";
import type { Attendee } from "@/lib/types";
import { parseQRPayload } from "@/lib/utils";

export interface LumaCsvSkip {
  row: number;
  reason: string;
}

export interface LumaCsvParseResult {
  rows: Attendee[];
  totalRows: number;
  skipped: LumaCsvSkip[];
  duplicateTicketIds: string[];
}

const COLUMN_ALIASES: Record<string, string[]> = {
  qr_code_url: ["qr_code_url", "qr code url"],
  name: ["name"],
  email: ["email"],
  phone_number: ["phone_number", "phone number", "phone"],
  ticket_name: ["ticket_name", "ticket name"],
  approval_status: ["approval_status", "approval status"],
  checked_in_at: ["checked_in_at", "checked in at"],
  guest_id: ["guest_id", "guest id"],
  professional_status: [
    "are you student or working professional?",
    "professional status",
  ],
  company: [
    "if professional what company do you work for?",
    "company",
  ],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function buildColumnMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = findColumnIndex(headers, aliases);
    if (idx !== -1) map[key] = idx;
  }
  return map;
}

function cell(row: string[], index: number | undefined): string {
  if (index === undefined || index < 0) return "";
  return (row[index] ?? "").trim();
}

function omitEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      result[key as keyof T] = value as T[keyof T];
    }
  }
  return result;
}

function mapRowToAttendee(
  row: string[],
  columnMap: Record<string, number>,
  eventId: string,
  rowNumber: number
): { attendee?: Attendee; skip?: LumaCsvSkip } {
  const qrCodeUrl = cell(row, columnMap.qr_code_url);
  const guestId = cell(row, columnMap.guest_id);
  const name = cell(row, columnMap.name);
  const email = cell(row, columnMap.email);

  let ticketId = "";
  let lumaTicketUrl: string | undefined;

  if (qrCodeUrl) {
    const parsed = parseQRPayload(qrCodeUrl);
    ticketId = parsed.ticketId;
    lumaTicketUrl = parsed.lumaTicketUrl;
  }

  if (!ticketId && guestId) {
    ticketId = guestId;
  }

  if (!ticketId) {
    return {
      skip: {
        row: rowNumber,
        reason: "Missing ticket ID (no qr_code_url pk or guest_id)",
      },
    };
  }

  const attendee = omitEmpty({
    ticketId,
    name: name || ticketId,
    email,
    eventId,
    lumaTicketUrl,
    phone: cell(row, columnMap.phone_number),
    ticketType: cell(row, columnMap.ticket_name),
    approvalStatus: cell(row, columnMap.approval_status),
    checkedInAt: cell(row, columnMap.checked_in_at),
    professionalStatus: cell(row, columnMap.professional_status),
    company: cell(row, columnMap.company),
  }) as Attendee;

  return { attendee };
}

export function parseLumaCsv(csvText: string, eventId: string): LumaCsvParseResult {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message ?? "Failed to parse CSV");
  }

  const data = parsed.data;
  if (data.length === 0) {
    return { rows: [], totalRows: 0, skipped: [], duplicateTicketIds: [] };
  }

  const headers = data[0] ?? [];
  const columnMap = buildColumnMap(headers);

  if (columnMap.qr_code_url === undefined && columnMap.guest_id === undefined) {
    throw new Error(
      "Unrecognized CSV format. Expected Luma export with qr_code_url or guest_id column."
    );
  }

  const rows: Attendee[] = [];
  const skipped: LumaCsvSkip[] = [];
  const seenTicketIds = new Map<string, number>();
  const duplicateTicketIds: string[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.every((cell) => !cell?.trim())) continue;

    const { attendee, skip } = mapRowToAttendee(row, columnMap, eventId, i + 1);

    if (skip) {
      skipped.push(skip);
      continue;
    }

    if (!attendee) continue;

    const key = attendee.ticketId.toLowerCase();
    if (seenTicketIds.has(key)) {
      duplicateTicketIds.push(attendee.ticketId);
      continue;
    }

    seenTicketIds.set(key, i + 1);
    rows.push(attendee);
  }

  return {
    rows,
    totalRows: data.length - 1,
    skipped,
    duplicateTicketIds,
  };
}
