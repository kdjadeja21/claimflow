import type { ClaimType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function InventoryBar({
  claimTypes,
  claimCounts,
}: {
  claimTypes: ClaimType[];
  claimCounts: Record<string, number>;
}) {
  if (claimTypes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No enabled claim types.</p>
    );
  }

  return (
    <div className="space-y-4">
      {claimTypes.map((claimType) => {
        const claimed = claimCounts[claimType.id] ?? 0;
        const percent = claimType.inventory > 0
          ? Math.min(100, (claimed / claimType.inventory) * 100)
          : 0;
        const isFull = percent >= 100;
        const isNearFull = percent >= 80;

        return (
          <div key={claimType.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{claimType.label}</span>
              <div className="flex items-center gap-3 text-xs">
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    isFull
                      ? "text-rose-600 dark:text-rose-400"
                      : isNearFull
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-primary"
                  )}
                  aria-label={`${Math.round(percent)}% used`}
                >
                  {Math.round(percent)}%
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {claimed} / {claimType.inventory}
                </span>
              </div>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${claimType.label} usage`}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isFull
                    ? "bg-rose-500"
                    : isNearFull
                      ? "bg-amber-500"
                      : "bg-primary"
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
