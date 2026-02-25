interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
}

export function Progress({ value, className, barClassName }: ProgressProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`h-2.5 w-full rounded-full bg-black/10 ${className ?? ""}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${barClassName ?? "bg-[var(--brand-primary)]"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
