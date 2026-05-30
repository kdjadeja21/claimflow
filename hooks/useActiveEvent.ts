"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getUserActiveEventId } from "@/lib/db";

export function useActiveEvent() {
  const { user } = useAuth();
  const router = useRouter();
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserActiveEventId(user.uid)
      .then((id) => {
        if (!id) {
          router.replace("/dashboard");
          return;
        }
        setEventId(id);
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  return { eventId, loading };
}
