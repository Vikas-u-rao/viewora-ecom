"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getApiBaseUrl } from "@/lib/constants";

export function PageTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    // Ignore admin pages from public visitor analytics
    if (pathname.startsWith("/admin")) return;

    const apiUrl = getApiBaseUrl();
    fetch(`${apiUrl}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {
      // Silently ignore tracking errors
    });
  }, [pathname]);

  return null;
}
