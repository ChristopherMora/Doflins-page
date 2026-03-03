"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps content in a div that fades + slides in when it enters the viewport.
 * Requires the `.section-reveal` CSS class + `[data-revealed]` selector in globals.css.
 */
export function LazySection({ children, className }: LazySectionProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip animation for users who prefer reduced motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.revealed = "";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.revealed = "";
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -24px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`section-reveal${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
