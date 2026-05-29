"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { AppShell } from "@/components/shared/AppShell";
import { PinGate } from "@/components/shared/PinGate";
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
import { generateId } from "@/lib/utils";

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
    if (!nextEvent) {
      return;
    }

    upsertEvent(nextEvent);
    saveSettings({ ...getSettings(), organizerPin: pin || "1234" });
    setEvent(nextEvent);
    toast.success("Setup saved");
  }

  function updateClaimType(id: string, updates: Partial<ClaimType>) {
    if (!event) {
      return;
    }

    setEvent({
      ...event,
      claimTypes: event.claimTypes.map((claimType) =>
        claimType.id === id ? { ...claimType, ...updates } : claimType
      ),
    });
  }

  function addClaimType() {
    if (!event || !newClaimLabel.trim()) {
      return;
    }

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
    if (!event) {
      return;
    }

    setEvent({ ...event, claimTypes: event.claimTypes.filter((claimType) => claimType.id !== id) });
  }

  function resetClaims() {
    if (!event) {
      return;
    }

    resetClaimsForEvent(event.eventId);
    setResetOpen(false);
    toast.success("Claims reset");
  }

  return (
    <AppShell title="Setup" description="Configure event details and inventory.">
      <PinGate>
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <Card>
            <CardHeader>
              <CardTitle>Event</CardTitle>
              <CardDescription>This is the active event volunteers will scan against.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Event name</Label>
                <Input
                  id="event-name"
                  className="h-12"
                  value={event?.eventName ?? ""}
                  onChange={(inputEvent) =>
                    setEvent((current) =>
                      current ? { ...current, eventName: inputEvent.target.value } : createDefaultEvent()
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizer-pin">Organizer PIN</Label>
                <Input
                  id="organizer-pin"
                  className="h-12"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(inputEvent) => setPin(inputEvent.target.value.replace(/\D/g, ""))}
                />
              </div>
            </CardContent>
          </Card>

            <div className="grid gap-3">
              <Button className="h-12" onClick={() => save()}>
                Save setup
              </Button>

              <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12" variant="destructive">
                    Reset all claims
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset all claims?</DialogTitle>
                    <DialogDescription>
                      This clears claim history and duplicate attempts for the active event. Attendees and setup stay saved.
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

          <Card>
            <CardHeader>
              <CardTitle>Claim types</CardTitle>
              <CardDescription>Enable, disable, or adjust inventory per category.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {event?.claimTypes.map((claimType) => (
                <div key={claimType.id} className="space-y-3 rounded-3xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-12 flex-1"
                      value={claimType.label}
                      onChange={(inputEvent) => updateClaimType(claimType.id, { label: inputEvent.target.value })}
                    />
                    <Button variant="ghost" size="icon-lg" onClick={() => removeClaimType(claimType.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                    <div className="space-y-2">
                      <Label>Inventory</Label>
                      <Input
                        className="h-12"
                        inputMode="numeric"
                        type="number"
                        min={0}
                        value={claimType.inventory}
                        onChange={(inputEvent) =>
                          updateClaimType(claimType.id, { inventory: Number(inputEvent.target.value) || 0 })
                        }
                      />
                    </div>
                    <Button
                      className="h-12 min-w-28"
                      variant={claimType.enabled ? "default" : "outline"}
                      onClick={() => updateClaimType(claimType.id, { enabled: !claimType.enabled })}
                    >
                      {claimType.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-3">
                <Label>Add claim type</Label>
                <div className="grid grid-cols-[1fr_92px] gap-2">
                  <Input
                    className="h-12"
                    placeholder="Dinner"
                    value={newClaimLabel}
                    onChange={(inputEvent) => setNewClaimLabel(inputEvent.target.value)}
                  />
                  <Input
                    className="h-12"
                    inputMode="numeric"
                    type="number"
                    min={0}
                    value={newClaimInventory}
                    onChange={(inputEvent) => setNewClaimInventory(Number(inputEvent.target.value) || 0)}
                  />
                </div>
                <Button className="h-12 w-full" variant="outline" onClick={addClaimType}>
                  <Plus className="size-4" />
                  Add type
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PinGate>
    </AppShell>
  );
}
