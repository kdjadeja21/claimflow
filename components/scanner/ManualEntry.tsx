"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ManualEntry({ onSubmit }: { onSubmit: (ticketId: string) => void }) {
  const [ticketId, setTicketId] = useState("");

  function submit() {
    if (!ticketId.trim()) return;
    onSubmit(ticketId);
    setTicketId("");
  }

  return (
    <div className="card-surface p-4">
      <div className="space-y-3">
        <Label htmlFor="manual-ticket" className="text-sm font-medium">
          Manual ticket ID
        </Label>
        <div className="flex gap-2">
          <Input
            id="manual-ticket"
            className="h-10 flex-1"
            placeholder="LUMA-12345"
            value={ticketId}
            autoComplete="off"
            onChange={(e) => setTicketId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
          <Button className="h-10 px-5" onClick={submit}>
            Check
          </Button>
        </div>
      </div>
    </div>
  );
}
