"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/shared/AppShell";
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
    setAttendees(getAttendees().filter((attendee) => attendee.eventId === event?.eventId));
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      initializeClaimFlow();
      refresh();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const filteredAttendees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return attendees;
    }

    return attendees.filter((attendee) =>
      [attendee.ticketId, attendee.name, attendee.email].some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [attendees, query]);

  function submitAttendee() {
    if (!activeEvent || !form.ticketId.trim()) {
      return;
    }

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
    if (!activeEvent || !csv.trim()) {
      return;
    }

    const rows = csv
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean);

    rows.forEach((row) => {
      const [ticketId = "", name = "", email = ""] = row.split(",").map((cell) => cell.trim());

      if (ticketId && ticketId.toLowerCase() !== "ticketid") {
        addAttendee({
          ticketId,
          name: name || ticketId,
          email,
          eventId: activeEvent.eventId,
        });
      }
    });

    setCsv("");
    refresh();
    toast.success(`Imported ${rows.length} rows`);
  }

  function remove(ticketId: string) {
    if (!activeEvent) {
      return;
    }

    deleteAttendee(ticketId, activeEvent.eventId);
    refresh();
  }

  return (
    <AppShell title="Attendees" description={activeEvent?.eventName ?? "Manage event tickets"}>
      <PinGate>
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Add attendee</CardTitle>
              <CardDescription>Ticket IDs must match the QR payload or manual entry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ticket-id">Ticket ID</Label>
                <Input
                  id="ticket-id"
                  className="h-12"
                  placeholder="LUMA-12345"
                  value={form.ticketId}
                  onChange={(event) => setForm({ ...form, ticketId: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendee-name">Name</Label>
                <Input
                  id="attendee-name"
                  className="h-12"
                  placeholder="Ada Lovelace"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendee-email">Email</Label>
                <Input
                  id="attendee-email"
                  className="h-12"
                  placeholder="ada@example.com"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <Button className="h-12 w-full" onClick={submitAttendee}>
                Save attendee
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk import</CardTitle>
              <CardDescription>Paste CSV rows in this format: ticketId,name,email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="min-h-32 w-full rounded-2xl border border-input bg-background/70 p-3 text-sm shadow-sm outline-none transition-all placeholder:text-muted-foreground focus-visible:border-ring/70 focus-visible:ring-4 focus-visible:ring-ring/15"
                placeholder={"ticketId,name,email\nLUMA-123,Ada,ada@example.com"}
                value={csv}
                onChange={(event) => setCsv(event.target.value)}
              />
              <Button className="h-12 w-full" variant="outline" onClick={importCsv}>
                <Upload className="size-4" />
                Import CSV
              </Button>
            </CardContent>
          </Card>
          </div>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Directory
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em]">Attendee list</h2>
                <p className="text-sm text-muted-foreground">{attendees.length} total</p>
              </div>
              <Input
                className="h-11 max-w-48"
                placeholder="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              {filteredAttendees.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-14 text-center">
                    <p className="text-sm font-semibold">No attendees found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add attendees manually or import a CSV to populate this event.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-sm backdrop-blur">
                  {filteredAttendees.map((attendee) => (
                    <div
                      key={attendee.ticketId}
                      className="flex items-center justify-between gap-3 border-b border-border/60 p-4 last:border-b-0 hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{attendee.name || attendee.ticketId}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {attendee.ticketId} · {attendee.email || "No email"}
                        </p>
                      </div>
                      {attendee.lumaTicketUrl ? (
                        <Button variant="ghost" size="icon-lg" asChild>
                          <a href={attendee.lumaTicketUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="icon-lg" onClick={() => remove(attendee.ticketId)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </PinGate>
    </AppShell>
  );
}
