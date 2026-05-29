import type { ClaimType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function InventoryBar({
  claimTypes,
  claimCounts,
}: {
  claimTypes: ClaimType[];
  claimCounts: Record<string, number>;
}) {
  return (
    <div className="space-y-5">
      {claimTypes.map((claimType) => {
        const claimed = claimCounts[claimType.id] ?? 0;
        const percent = claimType.inventory > 0 ? Math.min(100, (claimed / claimType.inventory) * 100) : 0;
        const isFull = percent >= 100;
        const isNearFull = percent >= 80;

        return (
          <div key={claimType.id} className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{claimType.label}</span>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={cn(
                    "font-semibold",
                    isFull
                      ? "text-rose-600 dark:text-rose-400"
                      : isNearFull
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-primary"
                  )}
                >
                  {Math.round(percent)}%
                </span>
                <span className="text-muted-foreground">
                  {claimed} / {claimType.inventory}
                </span>
              </div>
            </div>
            {/* Custom progress bar for per-bar color control */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/80 ring-1 ring-border/50">
              <div
                className={cn(
                  "h-full rounded-full shadow-[0_0_20px_currentColor] transition-all duration-500",
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
