"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, QrCode, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/shared/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveEvent, getAttendees, getClaims, initializeClaimFlow } from "@/lib/storage";
import type { ClaimEvent } from "@/lib/types";

export default function Home() {
  const [activeEvent, setActiveEvent] = useState<ClaimEvent | null>(null);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [claimCount, setClaimCount] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      initializeClaimFlow();
      const event = getActiveEvent();
      const eventAttendees = getAttendees().filter((a) => a.eventId === event?.eventId);
      const eventClaims = getClaims().filter((c) => c.eventId === event?.eventId);
      const enabledClaimTypeIds = new Set((event?.claimTypes ?? []).filter((c) => c.enabled).map((c) => c.id));
      const totalInventory = (event?.claimTypes ?? []).filter((c) => c.enabled).reduce((t, c) => t + c.inventory, 0);
      const enabledClaims = eventClaims.filter((c) => enabledClaimTypeIds.has(c.claimType));

      setActiveEvent(event);
      setAttendeeCount(eventAttendees.length);
      setClaimCount(enabledClaims.length);
      setRemaining(Math.max(0, totalInventory - enabledClaims.length));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AppShell title="Command center" description="Premium QR claim verification for event teams.">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_30px_90px_-55px_rgb(15_23_42/0.65)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative">
            <Badge variant="outline" className="gap-1.5">
              <Sparkles className="size-3" />
              Live event operations
            </Badge>
            <h2 className="mt-6 max-w-2xl text-4xl font-bold tracking-[-0.06em] text-balance sm:text-5xl lg:text-6xl">
              {activeEvent?.eventName ?? "My Event"}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Scan, validate, and distribute snacks, meals, or swag with a polished workflow
              built for busy check-in teams.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/scan">
                  Start scanning
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {[
            { label: "Claims", value: claimCount, icon: ShieldCheck },
            { label: "Attendees", value: attendeeCount, icon: Users },
            { label: "Remaining", value: remaining, icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </p>
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-5 text-4xl font-bold tabular-nums tracking-[-0.05em]">
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            href: "/scan",
            label: "Volunteer console",
            description: "Camera-first scanner with manual fallback and instant approval states.",
            icon: QrCode,
          },
          {
            href: "/dashboard",
            label: "Organizer dashboard",
            description: "Live inventory, duplicate attempts, and recent activity in one view.",
            icon: BarChart3,
          },
          {
            href: "/setup",
            label: "Event setup",
            description: "Tune claim types, inventory, attendees, and organizer access.",
            icon: Settings,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="group block">
              <Card className="h-full hover:-translate-y-1 hover:border-primary/30">
                <CardContent className="flex h-full flex-col p-6">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-[-0.03em]">{item.label}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Open
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
