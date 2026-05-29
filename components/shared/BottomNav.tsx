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
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full border-t border-border/60 bg-background/80 px-2 pb-3 pt-2 shadow-[0_-20px_60px_-40px_rgb(15_23_42/0.75)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-[10.5px] font-semibold transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-1.5 h-1 w-1 rounded-full bg-primary" />
              )}
              <Icon className={cn("size-[18px]", isActive && "mt-1")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
