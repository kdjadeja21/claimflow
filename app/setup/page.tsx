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
  Settings2,
  Sparkles,
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

          {/* ── Hero banner ── */}
          <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-[color-mix(in_oklch,var(--primary)_12%,var(--card))] via-card/80 to-card/70 p-6 shadow-[0_30px_90px_-45px_color-mix(in_oklch,var(--primary)_40%,rgb(15_23_42))] backdrop-blur-xl sm:p-8">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -bottom-8 left-1/3 h-36 w-72 rounded-full bg-[color-mix(in_oklch,var(--chart-2)_12%,transparent)] blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge variant="outline" className="mb-3 gap-1.5">
                  <Sparkles className="size-3" />
                  Event configuration
                </Badge>
                <h2 className="text-2xl font-bold tracking-[-0.05em] text-balance sm:text-3xl">
                  {event?.eventName || "My Event"}
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {totalCount} claim type{totalCount !== 1 ? "s" : ""} &middot;&nbsp;
                  {enabledCount} enabled
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 shadow-[0_8px_24px_-8px_color-mix(in_oklch,var(--primary)_45%,transparent)]">
                  <Settings2 className="size-6 text-primary" />
                </span>
              </div>
            </div>
          </section>

          {/* ── Two-column layout ── */}
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">

            {/* Left column */}
            <div className="space-y-4">

              {/* Event card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/8 shadow-[0_4px_12px_-4px_color-mix(in_oklch,var(--primary)_35%,transparent)]">
                      <Hash className="size-4 text-primary" />
                    </span>
                    <div>
                      <CardTitle>Event details</CardTitle>
                      <CardDescription>Name shown to volunteers on the scan screen.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Event name
                    </Label>
                    <Input
                      id="event-name"
                      className="h-12"
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

              {/* Security card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/8 shadow-[0_4px_12px_-4px_rgb(245_158_11/0.3)]">
                      <KeyRound className="size-4 text-amber-500" />
                    </span>
                    <div>
                      <CardTitle>Security</CardTitle>
                      <CardDescription>4-digit PIN required to access this page.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="organizer-pin" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Organizer PIN
                    </Label>
                    <Input
                      id="organizer-pin"
                      className="h-12 font-mono tracking-[0.3em]"
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
              <div className="space-y-2.5">
                <Button
                  className="btn-gradient relative h-12 w-full overflow-hidden text-sm font-semibold"
                  onClick={() => save()}
                >
                  <CheckCircle2 className="size-4" />
                  Save setup
                </Button>

                <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="h-12 w-full"
                      variant="destructive"
                    >
                      <AlertTriangle className="size-4" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/8 shadow-[0_4px_12px_-4px_rgb(16_185_129/0.3)]">
                      <Package className="size-4 text-emerald-500" />
                    </span>
                    <div>
                      <CardTitle>Claim types</CardTitle>
                      <CardDescription>Enable, disable, or adjust inventory per category.</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="tabular-nums">
                    {enabledCount}/{totalCount}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {event?.claimTypes.length === 0 && (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/20 py-10 text-center">
                    <Package className="size-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No claim types yet.</p>
                    <p className="text-xs text-muted-foreground/70">Add one below to get started.</p>
                  </div>
                )}

                {event?.claimTypes.map((ct, index) => (
                  <div
                    key={ct.id}
                    className={cn(
                      "group relative rounded-2xl border bg-card/60 transition-all duration-200",
                      ct.enabled
                        ? "border-emerald-500/25 shadow-[0_2px_12px_-4px_rgb(16_185_129/0.15)]"
                        : "border-border/50 opacity-70"
                    )}
                  >
                    {/* Enabled indicator strip */}
                    <div
                      className={cn(
                        "absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-200",
                        ct.enabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                      )}
                    />

                    <div className="space-y-3 p-4 pl-5">
                      {/* Row 1: index badge + name input + delete */}
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold tabular-nums text-muted-foreground">
                          {index + 1}
                        </span>
                        <Input
                          className="h-10 flex-1 text-sm font-medium"
                          value={ct.label}
                          onChange={(e) => updateClaimType(ct.id, { label: e.target.value })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeClaimType(ct.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      {/* Row 2: inventory + toggle */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Qty
                          </span>
                          <Input
                            className="h-7 flex-1 border-0 bg-transparent p-0 text-right text-sm font-bold tabular-nums shadow-none focus-visible:ring-0"
                            inputMode="numeric"
                            type="number"
                            min={0}
                            value={ct.inventory}
                            onChange={(e) =>
                              updateClaimType(ct.id, { inventory: Number(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <label
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                            ct.enabled
                              ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Switch
                            checked={ct.enabled}
                            onCheckedChange={(checked) => updateClaimType(ct.id, { enabled: checked }, true)}
                          />
                          {ct.enabled ? "Enabled" : "Disabled"}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                <Separator className="my-2" />

                {/* Add new claim type */}
                <div className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/4 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Add claim type
                  </p>
                  <div className="grid grid-cols-[1fr_88px] gap-2">
                    <Input
                      className="h-11"
                      placeholder="e.g. Dinner"
                      value={newClaimLabel}
                      onChange={(e) => setNewClaimLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addClaimType()}
                    />
                    <Input
                      className="h-11 text-center"
                      inputMode="numeric"
                      type="number"
                      min={0}
                      value={newClaimInventory}
                      onChange={(e) => setNewClaimInventory(Number(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    className="h-11 w-full gap-1.5"
                    variant="outline"
                    disabled={!newClaimLabel.trim()}
                    onClick={addClaimType}
                  >
                    <Plus className="size-4" />
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
