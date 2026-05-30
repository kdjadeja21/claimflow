"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Calendar, Home, QrCode, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavMode } from "@/components/shared/AppShell";

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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom,8px)] pt-1 backdrop-blur-md md:hidden"
      aria-label="Main navigation"
    >
      <div className={cn("grid", navMode === "public" ? "grid-cols-3" : "grid-cols-6")}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-md px-1 text-[10.5px] font-medium transition-colors",
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
                <Icon className="size-4" aria-hidden />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
