interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  /** Muestra un efecto shimmer animado cuando el valor > 0 */
  animated?: boolean;
}

export function Progress({ value, className, barClassName, animated = true }: ProgressProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`relative h-2.5 w-full overflow-hidden rounded-full bg-black/10 ${className ?? ""}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${barClassName ?? "bg-[var(--brand-primary)]"}`}
        style={{ width: `${clamped}%` }}
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
      </div>
    </div>
  );
}
