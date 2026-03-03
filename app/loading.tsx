export default function Loading(): React.JSX.Element {
  return (
    <div className="flex min-h-dvh animate-pulse flex-col gap-6 px-4 pt-20 sm:px-8">
      {/* Hero skeleton */}
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-52 rounded-2xl bg-black/[0.07] sm:h-64" />

        {/* Cards skeleton */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-64 rounded-2xl bg-black/[0.06]" />
          <div className="h-64 rounded-2xl bg-black/[0.06]" />
        </div>

        {/* Content skeleton */}
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-black/[0.05]" />
          ))}
        </div>
      </div>
    </div>
  );
}
