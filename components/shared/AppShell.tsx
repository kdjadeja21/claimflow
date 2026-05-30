"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav, organizerNavItems, publicNavItems } from "@/components/shared/BottomNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserMenu } from "@/components/shared/UserMenu";
import { cn } from "@/lib/utils";

export type NavMode = "organizer" | "public";

interface AppShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  backHref?: string;
  navMode?: NavMode;
  /** Slug for public nav link resolution (required when navMode="public") */
  slug?: string;
}

export function AppShell({
  title,
  description,
  children,
  backHref = "/",
  navMode = "organizer",
  slug,
}: AppShellProps) {
  const pathname = usePathname();

  const navItems =
    navMode === "public"
      ? publicNavItems(slug ?? "")
      : organizerNavItems;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px]">

        {/* Sidebar — desktop */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
          <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="size-4" aria-hidden />
            </span>
            <span className="text-sm font-semibold tracking-tight">ClaimFlow</span>
          </div>

          <nav className="flex-1 space-y-0.5 p-3" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Sticky header */}
          <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6">
            <div className="flex flex-1 items-center gap-3">

              {/* Mobile logo or back button */}
              {pathname === "/" || (slug && pathname === `/e/${slug}`) ? (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground md:hidden">
                  <Zap className="size-4" aria-hidden />
                </span>
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  size="icon-sm"
                  className="-ml-1 shrink-0"
                  aria-label="Go back"
                >
                  <Link href={backHref}>
                    <ArrowLeft className="size-4" aria-hidden />
                  </Link>
                </Button>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base font-semibold tracking-tight">
                  {title}
                </h1>
                {description && (
                  <p className="hidden truncate text-xs text-muted-foreground sm:block">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="ml-2 flex shrink-0 items-center gap-1">
              {navMode === "organizer" && <UserMenu />}
              <div className={navMode === "organizer" ? "md:hidden" : undefined}>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Page content */}
          <main
            id="main-content"
            className="flex-1 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-8 lg:py-8 md:pb-8"
          >
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>

          <BottomNav navMode={navMode} slug={slug} />
        </div>
      </div>
    </div>
  );
}
