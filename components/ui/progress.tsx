"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  /** Muestra un efecto shimmer animado cuando el valor > 0 */
  animated?: boolean;
}

export function Progress({ value, className, barClassName, animated = true }: ProgressProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value));
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  return (
    <div
      ref={ref}
      className={`relative h-2.5 w-full overflow-hidden rounded-full bg-black/10 ${className ?? ""}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={`relative h-full rounded-full ${barClassName ?? "bg-[var(--brand-primary)]"}`}
        initial={{ width: "0%" }}
        animate={{ width: inView ? `${clamped}%` : "0%" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      >
        {animated && clamped > 0 ? (
          <span
            className="absolute inset-0 -skew-x-12 overflow-hidden rounded-full"
            style={{
              background:
                "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.35) 50%,transparent 100%)",
              animation: "progress-shimmer 2s ease-in-out infinite",
            }}
          />
        ) : null}
      </motion.div>
    </div>
  );
}
