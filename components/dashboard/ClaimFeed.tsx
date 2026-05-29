import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Attendee, Claim, ClaimType, ScanAttempt } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function getAttemptCounts(attempts: ScanAttempt[], claim: Claim) {
  const related = attempts.filter(
    (attempt) =>
      attempt.eventId === claim.eventId &&
      attempt.claimType === claim.claimType &&
      attempt.ticketId.toLowerCase() === claim.ticketId.toLowerCase()
  );

  const passed = related.filter((attempt) => attempt.status === "approved").length;
  const failed = related.filter(
    (attempt) => attempt.status === "already_claimed" || attempt.status === "invalid_qr"
  ).length;

  return { passed, failed, total: related.length };
}

const AVATAR_PALETTES = [
  "bg-blue-500/10 text-blue-500",
  "bg-emerald-500/10 text-emerald-500",
  "bg-violet-500/10 text-violet-500",
  "bg-amber-500/10 text-amber-500",
  "bg-rose-500/10 text-rose-500",
  "bg-teal-500/10 text-teal-500",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function getAvatarPalette(seed: string): string {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length]!;
}

export function ClaimFeed({
  claims,
  attendees,
  claimTypes,
  attempts,
}: {
  claims: Claim[];
  attendees: Attendee[];
  claimTypes: ClaimType[];
  attempts: ScanAttempt[];
}) {
  const recentClaims = [...claims]
    .sort((a, b) => Date.parse(b.claimedAt) - Date.parse(a.claimedAt))
    .slice(0, 30);

  if (recentClaims.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-14 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            0
          </div>
          <p className="text-sm font-semibold">No claims yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Approved scans will appear here in real time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-sm backdrop-blur">
      {recentClaims.map((claim) => {
        const attendee = attendees.find(
          (item) =>
            item.eventId === claim.eventId &&
            item.ticketId.toLowerCase() === claim.ticketId.toLowerCase()
        );
        const claimType = claimTypes.find((item) => item.id === claim.claimType);
        const displayName = attendee?.name || claim.ticketId;
        const initials = getInitials(displayName);
        const avatarPalette = getAvatarPalette(claim.ticketId);
        const ticketUrl = claim.lumaTicketUrl ?? attendee?.lumaTicketUrl;
        const { passed, failed, total } = getAttemptCounts(attempts, claim);
        const showAttemptCounts = total > 1;

        return (
          <div
            key={claim.id}
            className="flex flex-col gap-3 border-b border-border/60 p-4 last:border-b-0 hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-[11px] font-bold ${avatarPalette}`}
              >
                {initials || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{claim.ticketId}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/90">
                  {formatDateTime(claim.claimedAt)}
                </p>
                {showAttemptCounts ? (
                  <div
                    className="mt-2 flex flex-wrap items-center gap-1.5"
                    aria-label={`${passed} passed scans, ${failed} failed scans out of ${total} total`}
                  >
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3 shrink-0" aria-hidden />
                      Passed {passed}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      <XCircle className="size-3 shrink-0" aria-hidden />
                      Failed {failed}
                    </span>
                    <span className="text-[11px] text-muted-foreground">· {total} scans</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-[3.25rem] sm:shrink-0 sm:pl-0">
              <Badge variant="secondary" className="max-w-full truncate text-xs">
                {claimType?.label ?? claim.claimType}
              </Badge>
              {ticketUrl ? (
                <Button variant="outline" size="sm" asChild className="h-8 shrink-0 text-xs">
                  <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
                    Show Ticket
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
