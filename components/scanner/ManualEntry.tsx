"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ManualEntry({ onSubmit }: { onSubmit: (ticketId: string) => void }) {
  const [ticketId, setTicketId] = useState("");

  function submit() {
    if (!ticketId.trim()) {
      return;
    }

    onSubmit(ticketId);
    setTicketId("");
  }

  return (
    <div className="rounded-3xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur">
      <div className="space-y-2">
      <Label htmlFor="manual-ticket">Manual ticket ID</Label>
      <div className="flex gap-2">
        <Input
          id="manual-ticket"
          className="h-12"
          placeholder="LUMA-12345"
          value={ticketId}
          onChange={(event) => setTicketId(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              submit();
            }
          }}
        />
        <Button className="h-12" onClick={submit}>
          Check
        </Button>
      </div>
      </div>
    </div>
  );
}
