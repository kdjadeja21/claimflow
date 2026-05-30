"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export function RouteLoader() {
  const pathname = usePathname();
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const isLoading = loadingPath !== null && loadingPath !== pathname;

  useEffect(() => {
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;

    function startLoading(nextPath: string) {
      window.clearTimeout(timeoutId);
      setLoadingPath(nextPath);
      timeoutId = window.setTimeout(() => setLoadingPath(null), 5000);
    }

    function handleClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const currentUrl = new URL(window.location.href);
      const isSamePage =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search;

      if (!isSamePage) {
        startLoading(nextUrl.pathname);
      }
    }

    function handlePopState() {
      startLoading(window.location.pathname);
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[80]"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="h-1 overflow-hidden bg-primary/10">
        <div className="h-full w-1/3 animate-[claimflow-loader_1.1s_ease-in-out_infinite] rounded-r-full bg-primary shadow-md" />
      </div>
      <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-medium text-foreground shadow-sm backdrop-blur-md">
        <LoaderCircle className="size-3.5 animate-spin text-primary" aria-hidden />
        Loading page...
      </div>
    </div>
  );
}
