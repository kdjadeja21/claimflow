import type { ClaimType } from "@/lib/types";

export const DEFAULT_CLAIM_TYPES: ClaimType[] = [
  { id: "snacks", label: "Snacks", inventory: 100, enabled: true },
];

/** How long a scan result overlay stays visible (ms). */
export const SCAN_RESULT_VISIBLE_MS = 3000;

/** Debounce window to ignore duplicate scans of the same ticket (ms). */
export const SCAN_DEDUPE_MS = 2500;

/** Vibration pattern when a claim is approved (ms). */
export const VIBRATE_APPROVED_MS = 120;

/** Vibration pattern when a claim is rejected or duplicate (ms). */
export const VIBRATE_REJECTED_MS = [80, 80, 160] as const;
