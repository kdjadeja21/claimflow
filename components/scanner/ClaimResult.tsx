"use client";

import { CheckCircle2, CircleX, TriangleAlert } from "lucide-react";
import type { ClaimValidationResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const resultConfig = {
  approved: {
    icon: CheckCircle2,
    title: "Approved",
    bg: "bg-emerald-400",
    header: "bg-emerald-600",
    iconClass: "text-black",
    textClass: "text-black",
  },
  already_claimed: {
    icon: TriangleAlert,
    title: "Already claimed",
    bg: "bg-amber-400",
    header: "bg-amber-600",
    iconClass: "text-black",
    textClass: "text-black",
  },
  invalid_qr: {
    icon: CircleX,
    title: "Invalid QR",
    bg: "bg-rose-500",
    header: "bg-rose-700",
    iconClass: "text-black",
    textClass: "text-black",
  },
};

export function ClaimResult({
  result,
}: {
  result: ClaimValidationResult;
  onReset: () => void;
}) {
  const config = resultConfig[result.status];
  const Icon = config.icon;

  return (
    <div className={cn("absolute inset-0 flex flex-col overflow-hidden rounded-2xl", config.bg)}>
      <div className={cn("px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-black/70", config.header)}>
        Scanner paused
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <Icon className={cn("size-20 stroke-[1.5]", config.iconClass)} />
        <h2 className={cn("text-3xl font-bold tracking-tight", config.textClass)}>
          {config.title}
        </h2>
        <p className={cn("text-sm font-medium", config.textClass, "opacity-75")}>
          {result.message}
        </p>
        {result.attendee ? (
          <p className={cn("text-xs font-semibold opacity-60", config.textClass)}>
            {result.attendee.name || result.attendee.ticketId}
          </p>
        ) : null}
      </div>
    </div>
  );
}
