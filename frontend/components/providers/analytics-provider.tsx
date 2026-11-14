"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  hasAnalyticsConsent,
  initAnalytics,
  stopAnalytics,
  subscribeAnalyticsConsent,
  trackNavigation,
} from "@/lib/analytics";
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    previous = useRef(pathname);
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const permitted = hasAnalyticsConsent();
    if (!permitted) stopAnalytics();
    setAllowed(permitted);
    return subscribeAnalyticsConsent((choice) =>
      setAllowed(choice?.analytics === true),
    );
  }, []);
  useEffect(() => (allowed ? initAnalytics() : undefined), [allowed]);
  useEffect(() => {
    if (allowed && pathname && previous.current !== pathname)
      trackNavigation(pathname);
    previous.current = pathname;
  }, [pathname, allowed]);
  return <>{children}</>;
}
export default AnalyticsProvider;
