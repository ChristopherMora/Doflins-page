"use client";

import { useEffect, useRef } from "react";

const SESSION_KEY = "doflins_shop_session";
const VISITOR_KEY = "doflins_visitor_id";

function getIds() {
  return {
    sessionId: sessionStorage.getItem(SESSION_KEY) ?? "",
    visitorId: localStorage.getItem(VISITOR_KEY) ?? "",
  };
}

function beacon(payload: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  navigator.sendBeacon("/api/events/shop", blob);
}

/**
 * Tracks how far users scroll down the shop page.
 * Reports at 25%, 50%, 75%, 100% thresholds (fires each once).
 */
export function ScrollDepthTracker(): null {
  const reportedRef = useRef(new Set<number>());

  useEffect(() => {
    const thresholds = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const percent = Math.round((scrollTop / docHeight) * 100);

      for (const t of thresholds) {
        if (percent >= t && !reportedRef.current.has(t)) {
          reportedRef.current.add(t);
          const { sessionId, visitorId } = getIds();
          if (sessionId) {
            beacon({
              sessionId,
              visitorId,
              eventType: "scroll_depth",
              scrollPercent: t,
              deviceType: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
              viewportWidth: window.innerWidth,
            });
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}

/**
 * Tracks Web Vitals: LCP, FID/INP, CLS, FCP, TTFB.
 * Uses the web-vitals API if available, otherwise falls back to PerformanceObserver.
 */
export function WebVitalsTracker(): null {
  const reportedRef = useRef(new Set<string>());

  useEffect(() => {
    const report = (name: string, value: number) => {
      if (reportedRef.current.has(name)) return;
      reportedRef.current.add(name);
      const { sessionId, visitorId } = getIds();
      if (!sessionId) return;
      beacon({
        sessionId,
        visitorId,
        eventType: "web_vital",
        metricName: name,
        metricValue: String(Math.round(value * 100) / 100),
        deviceType: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
        viewportWidth: window.innerWidth,
      });
    };

    // Try web-vitals library first (if bundled), otherwise use PerformanceObserver
    import("web-vitals")
      .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS((m) => report("CLS", m.value));
        onFCP((m) => report("FCP", m.value));
        onLCP((m) => report("LCP", m.value));
        onTTFB((m) => report("TTFB", m.value));
        onINP((m) => report("INP", m.value));
      })
      .catch(() => {
        // Fallback: use PerformanceObserver for basic metrics
        try {
          // LCP
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const last = entries[entries.length - 1];
            if (last) report("LCP", last.startTime);
          });
          lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

          // FCP from performance timing
          const paintEntries = performance.getEntriesByType("paint");
          const fcp = paintEntries.find((e) => e.name === "first-contentful-paint");
          if (fcp) report("FCP", fcp.startTime);

          // CLS
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (!(entry as any).hadRecentInput) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                clsValue += (entry as any).value ?? 0;
              }
            }
          });
          clsObserver.observe({ type: "layout-shift", buffered: true });

          // Report CLS on page hide
          const reportCls = () => report("CLS", clsValue);
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") reportCls();
          });
        } catch {
          // PerformanceObserver not supported — skip silently
        }
      });
  }, []);

  return null;
}

/**
 * Tracks page exit with time-on-page duration.
 * Fires on visibilitychange=hidden or beforeunload.
 */
export function PageExitTracker(): null {
  const entryTimeRef = useRef(Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    entryTimeRef.current = Date.now();

    const fire = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      const durationMs = Date.now() - entryTimeRef.current;
      const { sessionId, visitorId } = getIds();
      if (!sessionId) return;
      beacon({
        sessionId,
        visitorId,
        eventType: "page_exit",
        durationMs,
        deviceType: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
        viewportWidth: window.innerWidth,
      });
    };

    // visibilitychange is the most reliable for mobile
    const onVisChange = () => {
      if (document.visibilityState === "hidden") fire();
    };
    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("beforeunload", fire);

    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("beforeunload", fire);
    };
  }, []);

  return null;
}
