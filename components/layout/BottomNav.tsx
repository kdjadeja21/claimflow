"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Calendar, Home, QrCode, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavMode } from "@/components/layout/AppShell";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export const organizerNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/scan", label: "Scan", icon: QrCode },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/setup", label: "Setup", icon: Settings },
  { href: "/attendees", label: "People", icon: Users },
];

export function publicNavItems(slug: string): NavItem[] {
  return [
    { href: `/e/${slug}`, label: "Home", icon: Home },
    { href: `/e/${slug}/scan`, label: "Scan", icon: QrCode },
    { href: `/e/${slug}/stats`, label: "Stats", icon: BarChart3 },
  ];
}

const SCAN_LABEL = "Scan";

function partitionNavItems(items: NavItem[]) {
  const scanIndex = items.findIndex((item) => item.label === SCAN_LABEL);
  if (scanIndex === -1) {
    return { left: items, scan: null as NavItem | null, right: [] as NavItem[] };
  }

  return {
    left: items.slice(0, scanIndex),
    scan: items[scanIndex],
    right: items.slice(scanIndex + 1),
  };
}

function NavItemLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0 py-2 text-[9px] font-medium transition-colors min-[380px]:gap-1 min-[380px]:py-2.5 min-[380px]:text-[10.5px]",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div
        className={cn(
          "flex size-6 items-center justify-center rounded",
          isActive && "bg-primary/10"
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
      </div>
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}

export function BottomNav({
  navMode = "organizer",
  slug,
}: {
  navMode?: NavMode;
  slug?: string;
}) {
  const pathname = usePathname();
  const items =
    navMode === "public"
      ? publicNavItems(slug ?? "")
      : organizerNavItems;

  const { left, scan, right } = partitionNavItems(items);
  const scanActive = scan ? pathname === scan.href : false;

  if (!scan) {
    return null;
  }

  const ScanIcon = scan.icon;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 overflow-visible bg-background md:hidden"
      aria-label="Main navigation"
    >
      <div className="relative mx-auto flex max-w-lg items-end px-0.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* Left section — border stops before center FAB */}
        <div className="flex min-w-0 flex-1 border-t border-border pt-1">
          <div className="flex w-full justify-evenly">
            {left.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        </div>

        {/* Center scan — no top border; FAB bridges the gap */}
        <div className="relative flex w-[4.25rem] shrink-0 flex-col items-center justify-end pb-2 pt-8 min-[380px]:w-[4.75rem] min-[380px]:pb-2.5 min-[380px]:pt-9">
          <Link
            href={scan.href}
            aria-current={scanActive ? "page" : undefined}
            aria-label={scan.label}
            className={cn(
              "absolute left-1/2 top-0 z-20 flex size-[3.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_14px_-2px_rgba(0,0,0,0.3)] ring-[5px] ring-background transition-transform active:scale-95 min-[380px]:size-14",
              scanActive && "shadow-primary/35"
            )}
          >
            <ScanIcon className="size-5 min-[380px]:size-6" aria-hidden />
          </Link>
          <span
            className={cn(
              "text-[9px] font-medium min-[380px]:text-[10.5px]",
              scanActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {scan.label}
          </span>
        </div>

        {/* Right section — border stops before center FAB */}
        <div className="flex min-w-0 flex-1 border-t border-border pt-1">
          <div className="flex w-full justify-evenly">
            {right.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
