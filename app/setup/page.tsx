"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Hash,
  KeyRound,
  Lock,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  getEventById,
  getUserActiveEventId,
  makeEventPrivate,
  makeEventPublic,
  resetEventClaims,
  updateEvent,
} from "@/lib/db";
import { AuthGate } from "@/components/shared/AuthGate";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { ClaimEvent, ClaimType } from "@/lib/types";
import { cn, generateId } from "@/lib/utils";

function SetupContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<ClaimEvent | null>(null);
  const [newClaimLabel, setNewClaimLabel] = useState("");
  const [newClaimInventory, setNewClaimInventory] = useState(50);
  const [saving, setSaving] = useState(false);

  // Reset dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Make public dialog
  const [publicDialogOpen, setPublicDialogOpen] = useState(false);
  const [volunteerPin, setVolunteerPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Copy URL feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserActiveEventId(user.uid).then((id) => {
      if (!id) {
        router.replace("/dashboard");
        return;
      }
      getEventById(id).then((ev) => {
        if (!ev) {
          router.replace("/dashboard");
          return;
        }
        setEvent(ev);
      });
    });
  }, [user, router]);

  const publicUrl =
    event?.publicSlug
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/e/${event.publicSlug}`
      : null;

  async function save(nextEvent = event) {
    if (!nextEvent) return;
    setSaving(true);
    try {
      await updateEvent({
        eventId: nextEvent.eventId,
        eventName: nextEvent.eventName,
        claimTypes: nextEvent.claimTypes,
      });
      setEvent(nextEvent);
      toast.success("Setup saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function updateClaimType(id: string, updates: Partial<ClaimType>) {
    if (!event) return;
    setEvent({
      ...event,
      claimTypes: event.claimTypes.map((ct) =>
        ct.id === id ? { ...ct, ...updates } : ct
      ),
    });
  }

  function addClaimType() {
    if (!event || !newClaimLabel.trim()) return;
    setEvent({
      ...event,
      claimTypes: [
        ...event.claimTypes,
        {
          id: generateId("claim_type"),
          label: newClaimLabel.trim(),
          inventory: Math.max(0, newClaimInventory),
          enabled: true,
        },
      ],
    });
    setNewClaimLabel("");
    setNewClaimInventory(50);
  }

  function removeClaimType(id: string) {
    if (!event) return;
    setEvent({ ...event, claimTypes: event.claimTypes.filter((ct) => ct.id !== id) });
  }

  async function handleReset() {
    if (!event) return;
    setResetting(true);
    try {
      await resetEventClaims(event.eventId);
      setResetOpen(false);
      toast.success("Claims reset");
    } catch {
      toast.error("Failed to reset claims");
    } finally {
      setResetting(false);
    }
  }

  async function handleMakePublic() {
    if (!event) return;
    if (!volunteerPin || volunteerPin.length < 4) {
      setPinError("PIN must be at least 4 digits.");
      return;
    }
    setPublishing(true);
    try {
      const { publicSlug } = await makeEventPublic(
        event.eventId,
        volunteerPin,
        event.publicSlug
      );
      setEvent({ ...event, isPublic: true, publicSlug });
      setPublicDialogOpen(false);
      setVolunteerPin("");
      setPinError("");
      toast.success("Event is now public");
    } catch {
      toast.error("Failed to publish event");
    } finally {
      setPublishing(false);
    }
  }

  async function handleMakePrivate() {
    if (!event) return;
    try {
      await makeEventPrivate(event.eventId);
      setEvent({ ...event, isPublic: false });
      toast.success("Event set to private");
    } catch {
      toast.error("Failed to update visibility");
    }
  }

  function copyUrl() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const enabledCount = event?.claimTypes.filter((ct) => ct.enabled).length ?? 0;
  const totalCount = event?.claimTypes.length ?? 0;

  if (!event) {
    return (
      <AppShell title="Setup" description="Configure event details and inventory.">
        <div className="flex h-48 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Setup" description="Configure event details and inventory.">
      <div className="space-y-6">
        <PageHeader
          label="Configuration"
          title={event.eventName || "Event setup"}
          description={`${totalCount} claim type${totalCount !== 1 ? "s" : ""} · ${enabledCount} enabled`}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">

          {/* Left column */}
          <div className="space-y-4">

            {/* Event details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Hash className="size-4" aria-hidden />
                  </span>
                  <div>
                    <CardTitle>Event details</CardTitle>
                    <CardDescription>Name shown to volunteers on the scan screen.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="event-name">Event name</Label>
                  <Input
                    id="event-name"
                    className="h-10"
                    placeholder="e.g. Annual Gala 2026"
                    value={event.eventName}
                    onChange={(e) =>
                      setEvent((cur) => cur ? { ...cur, eventName: e.target.value } : cur)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Public sharing */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    "flex size-8 items-center justify-center rounded-md",
                    event.isPublic
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {event.isPublic
                      ? <Globe className="size-4" aria-hidden />
                      : <Lock className="size-4" aria-hidden />
                    }
                  </span>
                  <div>
                    <CardTitle>Volunteer access</CardTitle>
                    <CardDescription>
                      Share a link with your team. They need the PIN to scan.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "inline-flex size-2 rounded-full",
                      event.isPublic ? "bg-emerald-500" : "bg-muted-foreground/40"
                    )} />
                    <span className="text-sm font-medium">
                      {event.isPublic ? "Public" : "Private"}
                    </span>
                  </div>

                  {event.isPublic ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleMakePrivate}
                    >
                      Make private
                    </Button>
                  ) : (
                    <Dialog open={publicDialogOpen} onOpenChange={(o) => { setPublicDialogOpen(o); setPinError(""); setVolunteerPin(""); }}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="h-7 text-xs">
                          Make public
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Set volunteer PIN</DialogTitle>
                          <DialogDescription>
                            Volunteers must enter this PIN before they can start scanning.
                            Share the PIN with your team along with the event link.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-1.5 py-2">
                          <Label htmlFor="vol-pin">
                            <KeyRound className="mr-1.5 inline size-3.5" aria-hidden />
                            Volunteer PIN (min. 4 digits)
                          </Label>
                          <Input
                            id="vol-pin"
                            className="h-10 font-mono tracking-[0.3em]"
                            inputMode="numeric"
                            maxLength={8}
                            placeholder="e.g. 4321"
                            autoFocus
                            value={volunteerPin}
                            onChange={(e) => { setVolunteerPin(e.target.value.replace(/\D/g, "")); setPinError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleMakePublic()}
                          />
                          {pinError && (
                            <p role="alert" className="text-sm text-destructive">{pinError}</p>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPublicDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleMakePublic}
                            disabled={!volunteerPin || publishing}
                          >
                            {publishing ? "Publishing…" : "Publish event"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Public URL display */}
                {event.isPublic && publicUrl && (
                  <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      Volunteer link
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-white/60 px-2 py-1 text-xs dark:bg-black/20">
                        {publicUrl}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={copyUrl}
                        aria-label="Copy link"
                        className="shrink-0 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                      >
                        <Copy className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        asChild
                        aria-label="Test link"
                        className="shrink-0 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                      >
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      </Button>
                    </div>
                    {copied && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Link copied!
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button className="h-10 w-full" onClick={() => save()} disabled={saving}>
                <CheckCircle2 className="size-4" aria-hidden />
                {saving ? "Saving…" : "Save setup"}
              </Button>

              <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 w-full" variant="destructive">
                    <AlertTriangle className="size-4" aria-hidden />
                    Reset all claims
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset all claims?</DialogTitle>
                    <DialogDescription>
                      This clears claim history and duplicate attempts for this event.
                      Attendees and setup stay saved.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setResetOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleReset} disabled={resetting}>
                      {resetting ? "Resetting…" : "Reset claims"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Right column — claim types */}
          <Card className="self-start">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <Package className="size-4" aria-hidden />
                  </span>
                  <div>
                    <CardTitle>Claim types</CardTitle>
                    <CardDescription>Enable, disable, or adjust inventory per category.</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {enabledCount}/{totalCount}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {event.claimTypes.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center">
                  <Package className="size-7 text-muted-foreground/40" aria-hidden />
                  <p className="text-sm text-muted-foreground">No claim types yet.</p>
                  <p className="text-xs text-muted-foreground/70">Add one below to get started.</p>
                </div>
              )}

              {event.claimTypes.map((ct, index) => (
                <div
                  key={ct.id}
                  className={cn(
                    "rounded-lg border bg-card transition-colors",
                    ct.enabled ? "border-border" : "border-border/50 opacity-60"
                  )}
                >
                  <div className="space-y-2.5 p-3">
                    {/* Row 1: index + label + delete */}
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold tabular-nums text-muted-foreground bg-muted">
                        {index + 1}
                      </span>
                      <Input
                        className="h-9 flex-1 text-sm"
                        value={ct.label}
                        aria-label={`Claim type ${index + 1} name`}
                        onChange={(e) => updateClaimType(ct.id, { label: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${ct.label}`}
                        onClick={() => removeClaimType(ct.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>

                    {/* Row 2: inventory + enabled toggle */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Qty
                        </span>
                        <Input
                          className="h-6 flex-1 border-0 bg-transparent p-0 text-right text-sm font-medium tabular-nums shadow-none focus-visible:ring-0"
                          inputMode="numeric"
                          type="number"
                          min={0}
                          aria-label={`${ct.label} inventory`}
                          value={ct.inventory}
                          onChange={(e) =>
                            updateClaimType(ct.id, { inventory: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                        <Switch
                          checked={ct.enabled}
                          aria-label={`${ct.enabled ? "Disable" : "Enable"} ${ct.label}`}
                          onCheckedChange={(checked) =>
                            updateClaimType(ct.id, { enabled: checked })
                          }
                        />
                        <span className={ct.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                          {ct.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Add new claim type */}
              <div className="space-y-2.5 rounded-lg border border-dashed border-border bg-muted/20 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Add claim type
                </p>
                <div className="grid grid-cols-[1fr_80px] gap-2">
                  <Input
                    className="h-9"
                    placeholder="e.g. Dinner"
                    value={newClaimLabel}
                    aria-label="New claim type name"
                    onChange={(e) => setNewClaimLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addClaimType()}
                  />
                  <Input
                    className="h-9 text-center"
                    inputMode="numeric"
                    type="number"
                    min={0}
                    aria-label="New claim type inventory"
                    value={newClaimInventory}
                    onChange={(e) => setNewClaimInventory(Number(e.target.value) || 0)}
                  />
                </div>
                <Button
                  className="h-9 w-full"
                  variant="outline"
                  disabled={!newClaimLabel.trim()}
                  onClick={addClaimType}
                >
                  <Plus className="size-4" aria-hidden />
                  Add type
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default function SetupPage() {
  return (
    <AuthGate>
      <SetupContent />
    </AuthGate>
  );
}
