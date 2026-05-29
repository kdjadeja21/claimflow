import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(prefix: string) {
  return `${prefix}_${uuidv4()}`
}

export interface ParsedQRPayload {
  ticketId: string
  lumaTicketUrl?: string
}

export function parseQRPayload(payload: string): ParsedQRPayload {
  const trimmedPayload = payload.trim()

  if (!trimmedPayload) {
    return { ticketId: "" }
  }

  try {
    const parsed = JSON.parse(trimmedPayload) as Record<string, unknown>
    const ticketId = parsed.ticketId ?? parsed.ticket_id ?? parsed.id ?? parsed.code

    if (typeof ticketId === "string") {
      return { ticketId: ticketId.trim() }
    }
  } catch {
    // QR providers often encode plain IDs or URLs instead of JSON.
  }

  try {
    const url = new URL(trimmedPayload)
    const isLuma = url.hostname.endsWith("luma.com") || url.hostname === "lu.ma"

    if (isLuma && url.pathname.startsWith("/check-in/")) {
      const lumaGuestId = url.searchParams.get("pk")

      if (lumaGuestId) {
        const lumaEventId = url.pathname.split("/").filter(Boolean).at(-1)
        const lumaTicketUrl = lumaEventId
          ? `https://luma.com/e/ticket/${lumaEventId}?pk=${lumaGuestId.trim()}`
          : undefined

        return { ticketId: lumaGuestId.trim(), lumaTicketUrl }
      }
    }

    return {
      ticketId: (
        url.searchParams.get("ticketId") ??
        url.searchParams.get("ticket_id") ??
        url.searchParams.get("ticket") ??
        url.pathname.split("/").filter(Boolean).at(-1) ??
        trimmedPayload
      ).trim(),
    }
  } catch {
    return { ticketId: trimmedPayload }
  }
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
