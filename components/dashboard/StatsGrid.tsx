import { AlertTriangle, CheckCircle2, Ticket, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statConfig = [
  {
    label: "Attendees",
    icon: Users,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    label: "Claimed",
    icon: CheckCircle2,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    label: "Remaining",
    icon: Ticket,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    label: "Duplicates",
    icon: AlertTriangle,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statConfig.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <Card key={stat.label} className="hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {stat.label}
                </p>
                <div className={cn("flex size-9 items-center justify-center rounded-2xl", stat.iconBg)}>
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
