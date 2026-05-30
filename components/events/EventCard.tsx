"use client";

import { Calendar, ChevronRight, Globe, Lock } from "lucide-react";
import type { ClaimEvent } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function EventCard({
  event,
  onSelect,
}: {
  event: ClaimEvent;
  onSelect: () => void;
}) {
  const activeCount = event.claimTypes.filter((c) => c.enabled).length;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-start gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Calendar className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold tracking-tight">{event.eventName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {activeCount} active claim type
          {activeCount !== 1 ? "s" : ""} · {formatDateTime(event.createdAt)}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {event.isPublic ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Globe className="size-3" aria-hidden />
              Public
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Lock className="size-3" aria-hidden />
              Private
            </span>
          )}
        </div>
      </div>
      <ChevronRight
        className="mt-0.5 size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
        aria-hidden
      />
    </button>
  );
}
