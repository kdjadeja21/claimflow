"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, QrCode, Settings, ShieldCheck, Users, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  getUserActiveEventId,
  subscribeToEventData,
} from "@/lib/db";
import { AuthGate } from "@/components/shared/AuthGate";
import { AppShell } from "@/components/shared/AppShell";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import type { Claim, ClaimEvent } from "@/lib/types";

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeEvent, setActiveEvent] = useState<ClaimEvent | null>(null);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [claimCount, setClaimCount] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserActiveEventId(user.uid).then((id) => {
      if (!id) {
        router.replace("/dashboard");
        return;
      }
      setEventId(id);
    });
  }, [user, router]);

  useEffect(() => {
    if (!eventId) return;
    const unsub = subscribeToEventData(eventId, ({ event, claims, attendees }) => {
      setActiveEvent(event);
      setAttendeeCount(attendees.length);

      const enabledIds = new Set(
        (event?.claimTypes ?? []).filter((c) => c.enabled).map((c) => c.id)
      );
      const totalInventory = (event?.claimTypes ?? [])
        .filter((c) => c.enabled)
        .reduce((t, c) => t + c.inventory, 0);
      const enabledClaims: Claim[] = claims.filter((c) => enabledIds.has(c.claimType));

      setClaimCount(enabledClaims.length);
      setRemaining(Math.max(0, totalInventory - enabledClaims.length));
    });
    return unsub;
  }, [eventId]);

  return (
    <AppShell title="Home" description="QR claim verification for event teams.">
      <div className="space-y-8">

        {/* Welcome banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Zap className="size-4" aria-hidden />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ClaimFlow
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {activeEvent?.eventName ?? "My Event"}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Scan, validate, and distribute snacks, meals, or swag with a polished workflow built for busy check-in teams.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild size="lg">
              <Link href="/scan">
                Start scanning
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/stats">Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Stats row */}
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
            value={remaining}
            icon={BarChart3}
            iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
        </div>

        {/* Navigation cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              href: "/scan",
              label: "Volunteer console",
              description: "Camera-first scanner with manual fallback and instant approval states.",
              icon: QrCode,
            },
            {
              href: "/stats",
              label: "Organizer dashboard",
              description: "Live inventory, duplicate attempts, and recent activity in one view.",
              icon: BarChart3,
            },
            {
              href: "/setup",
              label: "Event setup",
              description: "Tune claim types, inventory, and share a volunteer link.",
              icon: Settings,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group card-surface flex flex-col gap-4 p-5 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold tracking-tight">{item.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Open
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

export default function Home() {
  return (
    <AuthGate>
      <HomeContent />
    </AuthGate>
  );
}
