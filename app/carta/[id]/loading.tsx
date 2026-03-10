export default function CartaLoading(): React.JSX.Element {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 pb-28 pt-10">
      <div className="w-full max-w-sm space-y-5 animate-pulse">
        {/* Card skeleton */}
        <div className="rounded-3xl bg-[#e8e8de] overflow-hidden shadow-lg">
          {/* Top accent */}
          <div className="h-1.5 w-full bg-[#d0d0c8]" />
          <div className="p-5 pb-0 flex flex-col items-center gap-2">
            <div className="h-3 w-40 rounded-full bg-[#d8d8d0]" />
            <div className="h-7 w-52 rounded-full bg-[#d0d0c8]" />
          </div>
          {/* Image area */}
          <div className="mt-4 h-72 w-full bg-[#d8d8d0]" />
          {/* Rarity badge */}
          <div className="flex justify-center py-5">
            <div className="h-7 w-28 rounded-full bg-[#d0d0c8]" />
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <div className="h-12 rounded-full bg-[#e0e0d8]" />
          <div className="h-12 rounded-full bg-[#e0e0d8]" />
          <div className="h-12 rounded-full bg-[#e0e0d8]" />
          <div className="h-12 rounded-full bg-[#e0e0d8]" />
        </div>

        {/* Related section */}
        <div className="pt-2 space-y-3">
          <div className="h-3 w-36 rounded-full bg-[#d8d8d0] mx-auto" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-[#e0e0d8] h-28" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
