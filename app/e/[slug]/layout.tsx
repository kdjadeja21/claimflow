"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/db";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { PageLoader } from "@/components/shared/PageLoader";
import type { ClaimEvent } from "@/lib/types";

interface PublicEventContextType {
  event: ClaimEvent;
  slug: string;
}

const PublicEventContext = createContext<PublicEventContextType | null>(null);

export function usePublicEvent() {
  const ctx = useContext(PublicEventContext);
  if (!ctx) throw new Error("usePublicEvent must be used inside the public event layout");
  return ctx;
}

export default function PublicEventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const [event, setEvent] = useState<ClaimEvent | null | undefined>(undefined);
  const [slug, setSlug] = useState<string>("");

  useEffect(() => {
    params.then(({ slug: s }) => {
      setSlug(s);
      getEventBySlug(s).then((ev) => {
        setEvent(ev ?? null);
      });
    });
  }, [params]);

  // undefined = still loading, null = not found
  if (event === undefined) return <PageLoader />;
  if (event === null) {
    notFound();
    return null;
  }

  return (
    <PublicEventContext.Provider value={{ event, slug }}>
      <DocumentTitle title={`ClaimFlow | ${event.eventName}`} />
      {children}
    </PublicEventContext.Provider>
  );
}
