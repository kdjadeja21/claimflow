"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { DocumentTitle } from "@/components/providers/DocumentTitle";
import { getUserActiveEventId, subscribeToEventData } from "@/lib/db";

const PUBLIC_EVENT_ROUTE = /^\/e\/[^/]+/;

export function ActiveEventDocumentTitle() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [eventName, setEventName] = useState<string | null>(null);

  const isPublicEventRoute = PUBLIC_EVENT_ROUTE.test(pathname);

  useEffect(() => {
    if (isPublicEventRoute || loading || !user) return;

    let unsub: (() => void) | undefined;
    let cancelled = false;

    getUserActiveEventId(user.uid).then((eventId) => {
      if (cancelled) return;
      if (!eventId) {
        setEventName(null);
        return;
      }

      unsub = subscribeToEventData(eventId, ({ event }) => {
        if (!cancelled) setEventName(event?.eventName ?? null);
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [user, loading, isPublicEventRoute, pathname]);

  if (isPublicEventRoute) return null;

  const title =
    loading || !user || !eventName ? "ClaimFlow" : `ClaimFlow | ${eventName}`;

  return <DocumentTitle title={title} />;
}
