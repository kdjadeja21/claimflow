"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Command, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/shared/BottomNav";
import { navItems } from "@/components/shared/BottomNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

export function AppShell({
  title,
  description,
  children,
  backHref = "/",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  backHref?: string;
}) {
  const pathname = usePathname();

  return (
    <main className="min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-70" />
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px]">
        <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-sidebar/80 p-5 backdrop-blur-xl md:flex md:flex-col">
          <Link href="/" className="flex items-center gap-3 rounded-2xl px-2 py-1">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Zap className="size-5" />
            </span>
            <div>
              <p className="text-base font-bold tracking-[-0.03em]">ClaimFlow</p>
              <p className="text-xs font-medium text-muted-foreground">Live claim operations</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/75 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {pathname !== "/" ? (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-lg"
                    className="-ml-2 shrink-0"
                    aria-label="Go back"
                  >
                    <Link href={backHref}>
                      <ArrowLeft className="size-5" />
                    </Link>
                  </Button>
                ) : (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground md:hidden">
                    <Zap className="size-5" />
                  </span>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Command className="hidden size-3.5 text-primary md:block" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      ClaimFlow
                    </p>
                  </div>
                  <h1 className="truncate text-xl font-bold leading-tight tracking-[-0.03em] sm:text-2xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                      {description}
                    </p>
                  ) : null}
                </div>
              </div>

              <ThemeToggle />
            </div>
          </header>

          <div className="flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </div>

          <BottomNav />
        </div>
      </div>
    </main>
  );
}
