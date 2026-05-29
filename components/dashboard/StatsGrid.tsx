import { AlertTriangle, CheckCircle2, Ticket, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statConfig = [
  {
    label: "Attendees",
    icon: Users,
    iconBg: "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-500",
    glow: "shadow-[0_4px_16px_-4px_rgb(59_130_246/0.4)]",
  },
  {
    label: "Claimed",
    icon: CheckCircle2,
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-500",
    glow: "shadow-[0_4px_16px_-4px_rgb(16_185_129/0.4)]",
  },
  {
    label: "Remaining",
    icon: Ticket,
    iconBg: "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-500",
    glow: "shadow-[0_4px_16px_-4px_rgb(245_158_11/0.4)]",
  },
  {
    label: "Duplicates",
    icon: AlertTriangle,
    iconBg: "bg-gradient-to-br from-rose-500/20 to-rose-600/10",
    iconColor: "text-rose-500",
    glow: "shadow-[0_4px_16px_-4px_rgb(244_63_94/0.4)]",
  },
];

export function StatsGrid({
  totalAttendees,
  uniqueClaimed,
  remainingInventory,
  duplicateAttempts,
}: {
  totalAttendees: number;
  uniqueClaimed: number;
  remainingInventory: number;
  duplicateAttempts: number;
}) {
  const values = [totalAttendees, uniqueClaimed, remainingInventory, duplicateAttempts];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {statConfig.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Card key={stat.label} className="hover:-translate-y-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </p>
                <div className={cn("flex size-9 items-center justify-center rounded-2xl", stat.iconBg, stat.glow)}>
                  <Icon className={cn("size-3.5", stat.iconColor)} />
                </div>
              </div>
              <p className="mt-5 text-4xl font-bold tabular-nums tracking-[-0.05em]">
                {values[index]}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
