"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Search, Trash2, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/shared/AppShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PinGate } from "@/components/shared/PinGate";
import {
  addAttendee,
  deleteAttendee,
  getActiveEvent,
  getAttendees,
  initializeClaimFlow,
} from "@/lib/storage";
import type { Attendee, ClaimEvent } from "@/lib/types";

const emptyForm = {
  ticketId: "",
  name: "",
  email: "",
};

export default function AttendeesPage() {
  const [activeEvent, setActiveEvent] = useState<ClaimEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [csv, setCsv] = useState("");
  const [query, setQuery] = useState("");

  function refresh() {
    const event = getActiveEvent();
    setActiveEvent(event);
    setAttendees(getAttendees().filter((a) => a.eventId === event?.eventId));
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      initializeClaimFlow();
      refresh();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const filteredAttendees = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter((a) =>
      [a.ticketId, a.name, a.email].some((v) => v.toLowerCase().includes(q))
    );
  }, [attendees, query]);

  function submitAttendee() {
    if (!activeEvent || !form.ticketId.trim()) return;
    addAttendee({
      ticketId: form.ticketId,
      name: form.name || form.ticketId,
      email: form.email,
      eventId: activeEvent.eventId,
    });
    setForm(emptyForm);
    refresh();
    toast.success("Attendee saved");
  }

  function importCsv() {
    if (!activeEvent || !csv.trim()) return;
    const rows = csv
      .split(/\r?\n/)
      .map((r) => r.trim())
      .filter(Boolean);

    rows.forEach((row) => {
      const [ticketId = "", name = "", email = ""] = row.split(",").map((c) => c.trim());
      if (ticketId && ticketId.toLowerCase() !== "ticketid") {
        addAttendee({ ticketId, name: name || ticketId, email, eventId: activeEvent.eventId });
      }
    });

    setCsv("");
    refresh();
    toast.success(`Imported ${rows.length} rows`);
  }

  function remove(ticketId: string) {
    if (!activeEvent) return;
    deleteAttendee(ticketId, activeEvent.eventId);
    refresh();
  }

  return (
    <AppShell title="Attendees" description={activeEvent?.eventName ?? "Manage event tickets"}>
      <PinGate>
        <div className="space-y-6">
          <PageHeader
            label="Directory"
            title="Attendees"
            description={`${attendees.length} total for this event`}
          />

          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">

            {/* Left: forms */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add attendee</CardTitle>
                  <CardDescription>
                    Ticket IDs must match the QR payload or manual entry.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ticket-id">Ticket ID</Label>
                    <Input
                      id="ticket-id"
                      className="h-10"
                      placeholder="LUMA-12345"
                      value={form.ticketId}
                      onChange={(e) => setForm({ ...form, ticketId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="attendee-name">Name</Label>
                    <Input
                      id="attendee-name"
                      className="h-10"
                      placeholder="Ada Lovelace"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="attendee-email">Email</Label>
                    <Input
                      id="attendee-email"
                      className="h-10"
                      placeholder="ada@example.com"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <Button className="h-10 w-full" onClick={submitAttendee}>
                    Save attendee
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bulk import</CardTitle>
                  <CardDescription>
                    Paste CSV rows: <code className="rounded bg-muted px-1 text-xs">ticketId,name,email</code>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 resize-y"
                    placeholder={"ticketId,name,email\nLUMA-123,Ada,ada@example.com"}
                    value={csv}
                    aria-label="CSV import data"
                    onChange={(e) => setCsv(e.target.value)}
                  />
                  <Button className="h-10 w-full" variant="outline" onClick={importCsv}>
                    <Upload className="size-4" aria-hidden />
                    Import CSV
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right: directory */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    className="h-10 pl-9"
                    placeholder="Search by name, ID, or email…"
                    value={query}
                    aria-label="Search attendees"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {query && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {filteredAttendees.length} result{filteredAttendees.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {filteredAttendees.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={query ? "No attendees match your search" : "No attendees yet"}
                  description={
                    query
                      ? "Try a different name, ticket ID, or email."
                      : "Add attendees manually or import a CSV to populate this event."
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {filteredAttendees.map((attendee) => (
                    <div
                      key={attendee.ticketId}
                      className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {attendee.name || attendee.ticketId}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {attendee.ticketId}
                          {attendee.email ? ` · ${attendee.email}` : ""}
                        </p>
                      </div>
                      {attendee.lumaTicketUrl && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          asChild
                          aria-label={`View ticket for ${attendee.name || attendee.ticketId}`}
                        >
                          <a href={attendee.lumaTicketUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${attendee.name || attendee.ticketId}`}
                        onClick={() => remove(attendee.ticketId)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </PinGate>
    </AppShell>
  );
}
