"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, QrCode, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/scan", label: "Scan", icon: QrCode },
  { href: "/dashboard", label: "Stats", icon: BarChart3 },
  { href: "/setup", label: "Setup", icon: Settings },
  { href: "/attendees", label: "People", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom,8px)] pt-1 backdrop-blur-md md:hidden"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
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
