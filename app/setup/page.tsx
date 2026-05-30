"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Hash,
  KeyRound,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { PinGate } from "@/components/shared/PinGate";
import { Switch } from "@/components/ui/switch";
import {
  createDefaultEvent,
  getActiveEvent,
  getSettings,
  initializeClaimFlow,
  resetClaimsForEvent,
  saveSettings,
  upsertEvent,
} from "@/lib/storage";
import type { ClaimEvent, ClaimType } from "@/lib/types";
import { cn, generateId } from "@/lib/utils";

export default function SetupPage() {
  const [event, setEvent] = useState<ClaimEvent | null>(null);
  const [newClaimLabel, setNewClaimLabel] = useState("");
  const [newClaimInventory, setNewClaimInventory] = useState(50);
  const [pin, setPin] = useState("1234");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      initializeClaimFlow();
      setEvent(getActiveEvent() ?? createDefaultEvent());
      setPin(getSettings().organizerPin);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function save(nextEvent = event) {
    if (!nextEvent) return;
    upsertEvent(nextEvent);
    saveSettings({ ...getSettings(), organizerPin: pin || "1234" });
    setEvent(nextEvent);
    toast.success("Setup saved");
  }

  function updateClaimType(id: string, updates: Partial<ClaimType>, autosave = false) {
    if (!event) return;
    const next = {
      ...event,
      claimTypes: event.claimTypes.map((ct) =>
        ct.id === id ? { ...ct, ...updates } : ct
      ),
    };
    setEvent(next);
    if (autosave) upsertEvent(next);
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

  function resetClaims() {
    if (!event) return;
    resetClaimsForEvent(event.eventId);
    setResetOpen(false);
    toast.success("Claims reset");
  }

  const enabledCount = event?.claimTypes.filter((ct) => ct.enabled).length ?? 0;
  const totalCount = event?.claimTypes.length ?? 0;

  return (
    <AppShell title="Setup" description="Configure event details and inventory.">
      <PinGate>
        <div className="space-y-6">
          <PageHeader
            label="Configuration"
            title={event?.eventName || "Event setup"}
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
                      value={event?.eventName ?? ""}
                      onChange={(e) =>
                        setEvent((cur) =>
                          cur ? { ...cur, eventName: e.target.value } : createDefaultEvent()
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                      <KeyRound className="size-4" aria-hidden />
                    </span>
                    <div>
                      <CardTitle>Security</CardTitle>
                      <CardDescription>4-digit PIN required to access this page.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    <Label htmlFor="organizer-pin">Organizer PIN</Label>
                    <Input
                      id="organizer-pin"
                      className="h-10 font-mono tracking-[0.3em]"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <Button className="h-10 w-full" onClick={() => save()}>
                  <CheckCircle2 className="size-4" aria-hidden />
                  Save setup
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
                        This clears claim history and duplicate attempts for the active event.
                        Attendees and setup stay saved.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setResetOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={resetClaims}>
                        Reset claims
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
                {event?.claimTypes.length === 0 && (
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center">
                    <Package className="size-7 text-muted-foreground/40" aria-hidden />
                    <p className="text-sm text-muted-foreground">No claim types yet.</p>
                    <p className="text-xs text-muted-foreground/70">Add one below to get started.</p>
                  </div>
                )}

                {event?.claimTypes.map((ct, index) => (
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
                              updateClaimType(ct.id, { enabled: checked }, true)
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
      </PinGate>
    </AppShell>
  );
}
