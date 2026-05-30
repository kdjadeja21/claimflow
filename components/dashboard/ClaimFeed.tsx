"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Trash2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Attendee, Claim, ClaimType, ScanAttempt } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function getAttemptCounts(attempts: ScanAttempt[], claim: Claim) {
  const related = attempts.filter(
    (a) =>
      a.eventId === claim.eventId &&
      a.claimType === claim.claimType &&
      a.ticketId.toLowerCase() === claim.ticketId.toLowerCase()
  );
  const passed = related.filter((a) => a.status === "approved").length;
  const failed = related.filter((a) => a.status !== "approved").length;
  return { passed, failed, total: related.length };
}

const AVATAR_PALETTES = [
  "bg-blue-500/10 text-blue-600",
  "bg-emerald-500/10 text-emerald-600",
  "bg-violet-500/10 text-violet-600",
  "bg-amber-500/10 text-amber-600",
  "bg-rose-500/10 text-rose-600",
  "bg-teal-500/10 text-teal-600",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getAvatarPalette(seed: string): string {
  const hash = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]!;
}

export function ClaimFeed({
  claims,
  attendees,
  claimTypes,
  attempts,
  canDeleteClaims = false,
  onDeleteClaim,
}: {
  claims: Claim[];
  attendees: Attendee[];
  claimTypes: ClaimType[];
  attempts: ScanAttempt[];
  canDeleteClaims?: boolean;
  onDeleteClaim?: (claim: Claim) => Promise<void>;
}) {
  const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);
  const [deleting, setDeleting] = useState(false);

  const recentClaims = [...claims]
    .sort((a, b) => Date.parse(b.claimedAt) - Date.parse(a.claimedAt))
    .slice(0, 30);

  if (recentClaims.length === 0) {
    return (
      <EmptyState
        title="No claims yet"
        description="Approved scans will appear here in real time."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {recentClaims.map((claim, index) => {
        const attendee = attendees.find(
          (a) =>
            a.eventId === claim.eventId &&
            a.ticketId.toLowerCase() === claim.ticketId.toLowerCase()
        );
        const claimType = claimTypes.find((ct) => ct.id === claim.claimType);
        const displayName = attendee?.name || claim.ticketId;
        const initials = getInitials(displayName);
        const avatarPalette = getAvatarPalette(claim.ticketId);
        const ticketUrl = claim.lumaTicketUrl ?? attendee?.lumaTicketUrl;
        const { passed, failed, total } = getAttemptCounts(attempts, claim);
        const showAttemptCounts = total > 1;

        return (
          <div
            key={claim.id}
            className="flex items-start gap-3 border-b border-border p-4 last:border-b-0 hover:bg-muted/30 sm:items-center"
          >
            {/* Avatar */}
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${avatarPalette}`}
              aria-hidden
            >
              {initials || "?"}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-sm font-medium leading-tight truncate">{displayName}</p>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {claimType?.label ?? claim.claimType}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {claim.ticketId} · {formatDateTime(claim.claimedAt)}
              </p>
              {showAttemptCounts && (
                <div
                  className="mt-1.5 flex flex-wrap items-center gap-1.5"
                  aria-label={`${passed} passed scans, ${failed} failed scans out of ${total} total`}
                >
                  <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                    <CheckCircle2 className="size-3 shrink-0" aria-hidden />
                    {passed} passed
                  </span>
                  <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400">
                    <XCircle className="size-3 shrink-0" aria-hidden />
                    {failed} failed
                  </span>
                </div>
              )}
            </div>

            {/* Ticket link */}
            {ticketUrl && (
              <Button variant="ghost" size="icon-sm" asChild className="shrink-0">
                <a
                  href={ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ticket for ${displayName}`}
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </Button>
            )}

            {canDeleteClaims && onDeleteClaim && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Delete claim record for ${displayName}`}
                onClick={() => setClaimToDelete(claim)}
              >
                <Trash2 className="size-3.5" aria-hidden />
              </Button>
            )}
          </div>
        );
      })}

      <Dialog
        open={!!claimToDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setClaimToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete claim history record?</DialogTitle>
            <DialogDescription>
              This removes the selected claim from history and allows that ticket to claim this item again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClaimToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!claimToDelete || deleting}
              onClick={async () => {
                if (!claimToDelete || !onDeleteClaim) return;
                setDeleting(true);
                try {
                  await onDeleteClaim(claimToDelete);
                  setClaimToDelete(null);
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
