"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  UserX,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  addAttendee,
  deleteAllAttendees,
  deleteAttendee,
  deleteSelectedAttendees,
  getAttendees,
  getEventById,
  getUserActiveEventId,
} from "@/lib/db";
import { ImportDialog } from "@/components/attendees/ImportDialog";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Attendee, ClaimEvent } from "@/lib/types";

const emptyForm = { ticketId: "", name: "", email: "" };

export default function AttendeesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeEvent, setActiveEvent] = useState<ClaimEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [query, setQuery] = useState("");

  // Add attendee dialog
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Delete dialogs
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function refresh(eventId: string) {
    const list = await getAttendees(eventId);
    setAttendees(list);
    setSelected(new Set());
  }

  useEffect(() => {
    if (!user) return;
    getUserActiveEventId(user.uid).then((id) => {
      if (!id) { router.replace("/dashboard"); return; }
      getEventById(id).then((ev) => {
        if (!ev) { router.replace("/dashboard"); return; }
        setActiveEvent(ev);
        refresh(ev.eventId);
      });
    });
  }, [user, router]);

  const filteredAttendees = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter((a) =>
      [a.ticketId, a.name, a.email, a.company, a.ticketType]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [attendees, query]);

  const allVisibleSelected =
    filteredAttendees.length > 0 &&
    filteredAttendees.every((a) => selected.has(a.ticketId));

  function toggleOne(ticketId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  }

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredAttendees.forEach((a) => next.delete(a.ticketId));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredAttendees.forEach((a) => next.add(a.ticketId));
        return next;
      });
    }
  }

  async function submitAttendee() {
    if (!activeEvent || !form.ticketId.trim()) return;
    setSaving(true);
    try {
      await addAttendee({
        ticketId: form.ticketId,
        name: form.name || form.ticketId,
        email: form.email,
        eventId: activeEvent.eventId,
      });
      setForm(emptyForm);
      setAddOpen(false);
      await refresh(activeEvent.eventId);
      toast.success("Attendee saved");
    } catch {
      toast.error("Failed to save attendee");
    } finally {
      setSaving(false);
    }
  }

  async function remove(ticketId: string) {
    if (!activeEvent) return;
    try {
      await deleteAttendee(ticketId, activeEvent.eventId);
      await refresh(activeEvent.eventId);
      toast.success("Attendee removed");
    } catch {
      toast.error("Failed to remove attendee");
    }
  }

  async function handleDeleteSelected() {
    if (!activeEvent || selected.size === 0) return;
    setDeleting(true);
    try {
      await deleteSelectedAttendees([...selected], activeEvent.eventId);
      setDeleteSelectedOpen(false);
      await refresh(activeEvent.eventId);
      toast.success(`Removed ${selected.size} attendee${selected.size !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to delete selected attendees");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteAll() {
    if (!activeEvent) return;
    setDeleting(true);
    try {
      await deleteAllAttendees(activeEvent.eventId);
      setDeleteAllOpen(false);
      await refresh(activeEvent.eventId);
      toast.success("All attendees removed");
    } catch {
      toast.error("Failed to delete attendees");
    } finally {
      setDeleting(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <AppShell
      title="Attendees"
      description={activeEvent?.eventName ?? "Manage event tickets"}
    >
      <div className="space-y-6">
        <PageHeader
          label="Directory"
          title="Attendees"
          description={
            attendees.length > 0
              ? `${attendees.length} attendee${attendees.length !== 1 ? "s" : ""} · ${activeEvent?.eventName ?? ""}`
              : "No attendees yet"
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {activeEvent && (
                <ImportDialog
                  eventId={activeEvent.eventId}
                  onImported={() => refresh(activeEvent.eventId)}
                />
              )}

              {/* Add attendee dialog */}
              <Dialog
                open={addOpen}
                onOpenChange={(o) => {
                  setAddOpen(o);
                  if (!o) setForm(emptyForm);
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9 gap-2">
                    <Plus className="size-4" aria-hidden />
                    Add attendee
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Add attendee</DialogTitle>
                    <DialogDescription>
                      Ticket ID must match the QR payload or manual entry.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ticket-id">Ticket ID</Label>
                      <Input
                        id="ticket-id"
                        className="h-10"
                        placeholder="e.g. ZtMnELdMgQCoRfc"
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
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={submitAttendee}
                      disabled={!form.ticketId.trim() || saving}
                    >
                      {saving ? "Saving…" : "Save attendee"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <Card>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                className="h-9 pl-9"
                placeholder="Search by name, email, or ticket ID…"
                value={query}
                aria-label="Search attendees"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Right side actions */}
            <div className="flex shrink-0 items-center gap-2">
              {query && (
                <span className="text-xs text-muted-foreground">
                  {filteredAttendees.length} result{filteredAttendees.length !== 1 ? "s" : ""}
                </span>
              )}

              {/* Bulk delete selected */}
              {selectedCount > 0 && (
                <Dialog open={deleteSelectedOpen} onOpenChange={setDeleteSelectedOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-9 gap-1.5">
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete {selectedCount}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Delete {selectedCount} attendee{selectedCount !== 1 ? "s" : ""}?</DialogTitle>
                      <DialogDescription>
                        This will permanently remove the selected attendee{selectedCount !== 1 ? "s" : ""} from the directory. Their claim history stays intact.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteSelectedOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteSelected}
                        disabled={deleting}
                      >
                        {deleting ? "Deleting…" : `Delete ${selectedCount}`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Delete all */}
              {attendees.length > 0 && selectedCount === 0 && (
                <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <UserX className="size-3.5" aria-hidden />
                      Clear all
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                          <AlertTriangle className="size-5" aria-hidden />
                        </span>
                        <div>
                          <DialogTitle>Clear all {attendees.length} attendees?</DialogTitle>
                          <DialogDescription className="mt-1">
                            This permanently removes all attendees from this event. Claim history and scan records are not affected. This cannot be undone.
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteAllOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAll}
                        disabled={deleting}
                      >
                        {deleting ? "Clearing…" : `Clear all ${attendees.length}`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Select-all row */}
          {filteredAttendees.length > 0 && (
            <div className="flex items-center gap-3 border-b border-border bg-muted/20 px-4 py-2">
              <input
                type="checkbox"
                id="select-all"
                checked={allVisibleSelected}
                onChange={toggleAll}
                className="size-4 cursor-pointer accent-primary"
                aria-label="Select all visible attendees"
              />
              <label
                htmlFor="select-all"
                className="cursor-pointer select-none text-xs font-medium text-muted-foreground"
              >
                {allVisibleSelected
                  ? `Deselect all (${filteredAttendees.length})`
                  : `Select all (${filteredAttendees.length})`}
              </label>
              {selectedCount > 0 && (
                <Badge variant="secondary" className="ml-auto tabular-nums">
                  {selectedCount} selected
                </Badge>
              )}
            </div>
          )}

          {/* Directory list */}
          {filteredAttendees.length === 0 ? (
            <CardContent className="p-6">
              <EmptyState
                icon={Users}
                title={query ? "No attendees match your search" : "No attendees yet"}
                description={
                  query
                    ? "Try a different name, ticket ID, or email."
                    : "Import a Luma CSV or add attendees manually to get started."
                }
                action={
                  !query ? (
                    <div className="flex flex-wrap justify-center gap-2">
                      {activeEvent && (
                        <ImportDialog
                          eventId={activeEvent.eventId}
                          onImported={() => refresh(activeEvent.eventId)}
                        />
                      )}
                      <Button size="sm" variant="outline" className="h-9" onClick={() => setAddOpen(true)}>
                        <Plus className="size-4" aria-hidden />
                        Add manually
                      </Button>
                    </div>
                  ) : undefined
                }
              />
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {filteredAttendees.map((attendee) => {
                const isSelected = selected.has(attendee.ticketId);
                const initials = (attendee.name || attendee.ticketId)
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={attendee.ticketId}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-colors",
                      isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                    )}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(attendee.ticketId)}
                      className="size-4 shrink-0 cursor-pointer accent-primary"
                      aria-label={`Select ${attendee.name || attendee.ticketId}`}
                    />

                    {/* Avatar */}
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground"
                    >
                      {initials}
                    </span>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {attendee.name || attendee.ticketId}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {attendee.email || "—"}
                        {attendee.company ? ` · ${attendee.company}` : ""}
                      </p>
                    </div>

                    {/* Ticket type badge */}
                    {attendee.ticketType && (
                      <Badge
                        variant="secondary"
                        className="hidden shrink-0 text-[11px] sm:inline-flex"
                      >
                        {attendee.ticketType}
                      </Badge>
                    )}

                    {/* Luma link */}
                    {attendee.lumaTicketUrl && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        asChild
                        aria-label={`View Luma ticket for ${attendee.name || attendee.ticketId}`}
                      >
                        <a
                          href={attendee.lumaTicketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      </Button>
                    )}

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${attendee.name || attendee.ticketId}`}
                      onClick={() => remove(attendee.ticketId)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer count */}
          {attendees.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <p className="text-xs text-muted-foreground">
                {filteredAttendees.length === attendees.length
                  ? `${attendees.length} attendee${attendees.length !== 1 ? "s" : ""} total`
                  : `Showing ${filteredAttendees.length} of ${attendees.length}`}
              </p>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
