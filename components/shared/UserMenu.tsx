"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function userInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function UserMenu({ className }: { className?: string }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user) return null;

  const displayName = user.displayName ?? "Account";
  const initials = userInitials(user.displayName, user.email);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.replace("/login");
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2 pl-1.5 pr-2"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          aria-hidden
        >
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
          {displayName}
        </span>
        <ChevronDown
          className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium">{displayName}</p>
            {user.email && (
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>

          <Link
            href="/events"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <Calendar className="size-4 text-muted-foreground" aria-hidden />
            My events
          </Link>

          <Link
            href="/dashboard"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <User className="size-4 text-muted-foreground" aria-hidden />
            Event picker
          </Link>

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
