"use client";

import { CheckCircle2, CircleX, TriangleAlert, X } from "lucide-react";
import type { ClaimValidationResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const resultConfig = {
  approved: {
    icon: CheckCircle2,
    title: "Approved",
    bg: "bg-emerald-600",
    iconClass: "text-white",
    textClass: "text-white",
    subClass: "text-emerald-100",
  },
  already_claimed: {
    icon: TriangleAlert,
    title: "Already claimed",
    bg: "bg-amber-500",
    iconClass: "text-white",
    textClass: "text-white",
    subClass: "text-amber-100",
  },
  invalid_qr: {
    icon: CircleX,
    title: "Invalid QR",
    bg: "bg-destructive",
    iconClass: "text-white",
    textClass: "text-white",
    subClass: "text-red-100",
  },
};

export function ClaimResult({
  result,
  onReset,
}: {
  result: ClaimValidationResult;
  onReset: () => void;
}) {
  const config = resultConfig[result.status];
  const Icon = config.icon;

  return (
    <div
      className={cn("absolute inset-0 flex flex-col overflow-hidden rounded-lg", config.bg)}
      role="alert"
      aria-live="assertive"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
          Scanner paused
        </span>
        <button
          type="button"
          onClick={onReset}
          className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Dismiss and resume scanning"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <Icon className={cn("size-16 stroke-[1.5]", config.iconClass)} aria-hidden />
        <div>
          <h2 className={cn("text-2xl font-semibold tracking-tight", config.textClass)}>
            {config.title}
          </h2>
          <p className={cn("mt-1 text-sm font-medium", config.subClass)}>
            {result.message}
          </p>
          {result.attendee && (
            <p className={cn("mt-1 text-xs font-medium", config.subClass, "opacity-80")}>
              {result.attendee.name || result.attendee.ticketId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
