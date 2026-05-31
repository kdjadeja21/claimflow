import { AlertTriangle, CheckCircle2, Ticket, Users } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

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
  return (
    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Attendees"
        value={totalAttendees}
        icon={Users}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <StatCard
        label="Claimed"
        value={uniqueClaimed}
        icon={CheckCircle2}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        label="Remaining"
        value={remainingInventory}
        icon={Ticket}
        iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <StatCard
        label="Duplicates"
        value={duplicateAttempts}
        icon={AlertTriangle}
        iconClassName="bg-rose-500/10 text-rose-600 dark:text-rose-400"
      />
    </div>
  );
}
