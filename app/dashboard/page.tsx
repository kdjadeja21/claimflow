"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Plus, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  createEvent,
  getMyEvents,
  setUserActiveEventId,
} from "@/lib/db";
import { AuthGate } from "@/components/shared/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { EventCard } from "@/components/events/EventCard";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import type { ClaimEvent } from "@/lib/types";

function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<ClaimEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getMyEvents(user.uid)
      .then(setEvents)
      .catch((err) => {
        console.error(err);
        toast.error("Could not load your events. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function handleCreate() {
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const event = await createEvent(newName.trim(), user.uid);
      await setUserActiveEventId(user.uid, event.eventId);
      setDialogOpen(false);
      router.push("/setup");
    } catch {
      toast.error("Failed to create event");
    } finally {
      setCreating(false);
    }
  }

  async function handleSelect(event: ClaimEvent) {
    if (!user) return;
    try {
      await setUserActiveEventId(user.uid, event.eventId);
      router.push("/");
    } catch {
      toast.error("Failed to select event");
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="size-4" aria-hidden />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">ClaimFlow</h1>
              <p className="text-xs text-muted-foreground">{user?.displayName ?? user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>

        {/* My Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">My Events</h2>
              <p className="text-sm text-muted-foreground">
                Select an event to manage, or create a new one.
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="shrink-0">
                  <Plus className="size-4" aria-hidden />
                  New event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create event</DialogTitle>
                  <DialogDescription>
                    Give your event a name. You&apos;ll configure claim types and
                    share settings on the next screen.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5 py-2">
                  <Label htmlFor="event-name">Event name</Label>
                  <Input
                    id="event-name"
                    className="h-10"
                    placeholder="e.g. Annual Gala 2026"
                    value={newName}
                    autoFocus
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newName.trim() || creating}
                  >
                    {creating ? "Creating…" : "Create & configure"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="items-center pb-2 text-center">
                <span className="mb-2 flex size-12 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="size-5 text-muted-foreground" aria-hidden />
                </span>
                <CardTitle className="text-base">No events yet</CardTitle>
                <CardDescription>
                  Create your first event to get started.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" aria-hidden />
                  Create event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  onSelect={() => handleSelect(event)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}
