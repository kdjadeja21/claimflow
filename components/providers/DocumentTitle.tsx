"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DocumentTitle({ title }: { title: string }) {
  const pathname = usePathname();

  useEffect(() => {
    document.title = title;
  }, [title, pathname]);

  return null;
}
