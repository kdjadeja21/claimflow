"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, QrCode, ShieldCheck, Users, Zap } from "lucide-react";
import { usePublicEvent } from "@/components/providers/PublicEventProvider";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { useEventData } from "@/hooks/useEventData";
import { useEventStats } from "@/hooks/useEventStats";

export default function PublicEventHome() {
  const { event, slug } = usePublicEvent();
  const { claims, attempts, attendees } = useEventData(event.eventId);
  const { claimCount, attendeeCount, remainingInventory } = useEventStats(event, {
    claims,
    attempts,
    attendees,
  });

  return (
    <AppShell
      title={event.eventName}
      description="Volunteer check-in station"
      navMode="public"
      slug={slug}
      backHref={`/e/${slug}`}
    >
      <div className="space-y-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Zap className="size-4" aria-hidden />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ClaimFlow · Volunteer
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {event.eventName}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Scan attendee QR codes to validate and distribute items. Enter your PIN when prompted.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild size="lg">
              <Link href={`/e/${slug}/scan`}>
                Start scanning
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            label="Claims"
            value={claimCount}
            icon={ShieldCheck}
            iconClassName="bg-primary/10 text-primary"
          />
          <StatCard
            label="Attendees"
            value={attendeeCount}
            icon={Users}
            iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Remaining"
            value={remainingInventory}
            icon={BarChart3}
            iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/e/${slug}/scan`}
            className="group card-surface flex flex-col gap-4 p-5 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <QrCode className="size-4" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-tight">Scan tickets</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Camera-first scanner with manual fallback and instant approval states.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Open
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>

          <Link
            href={`/e/${slug}/stats`}
            className="group card-surface flex flex-col gap-4 p-5 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <BarChart3 className="size-4" aria-hidden />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold tracking-tight">Live stats</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Real-time inventory usage and claim activity.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Open
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
