import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ label, value, icon: Icon, iconClassName, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "card-surface flex min-w-0 flex-col gap-2 p-3 sm:gap-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground sm:text-xs sm:tracking-widest">
          {label}
        </p>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground sm:size-8",
            iconClassName
          )}
        >
          <Icon className="size-3.5 sm:size-4" />
        </span>
      </div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
