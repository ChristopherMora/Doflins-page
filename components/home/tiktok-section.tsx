"use client";

const TIKTOK_VIDEOS = [
  { id: "7597286299510394130", label: "Unboxing Doflins" },
  { id: "7602463024145829127", label: "Colección Doflins" },
  { id: "7613707708537113864", label: "Reveal Doflins" },
  { id: "7613708018177346834", label: "Figuras Doflins" },
] as const;

const TIKTOK_USER = "dofershop";

function TikTokCard({ videoId, label }: { videoId: string; label: string }): React.JSX.Element {
  const url = `https://www.tiktok.com/@${TIKTOK_USER}/video/${videoId}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex aspect-[9/16] items-center justify-center overflow-hidden rounded-2xl border border-[var(--surface-200)] bg-[var(--surface-100)] transition hover:border-[var(--brand-primary)]/40 hover:shadow-lg active:scale-[0.98]"
      aria-label={`Ver video: ${label}`}
    >
      {/* Play icon */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ink-900)]/80 text-white shadow-lg transition group-hover:scale-110 group-hover:bg-[var(--ink-900)]">
          <svg className="ml-1 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-[var(--ink-600)] transition group-hover:text-[var(--ink-900)]">
          {label}
        </span>
      </div>

      {/* TikTok badge */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.27 8.27 0 0 0 4.76 1.5V6.77a4.83 4.83 0 0 1-1-.08Z" />
        </svg>
        TikTok
      </div>
    </a>
  );
}

export function TikTokSection(): React.JSX.Element {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className="font-title text-2xl font-bold tracking-tight text-[var(--ink-900)] sm:text-3xl">
          Síguenos en TikTok
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-500)]">
          Mira nuestros videos y descubre más sobre los Doflins
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {TIKTOK_VIDEOS.map((video) => (
          <TikTokCard key={video.id} videoId={video.id} label={video.label} />
        ))}
      </div>

      <div className="flex justify-center">
        <a
          href={`https://www.tiktok.com/@${TIKTOK_USER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-300)] bg-[var(--surface-50)] px-5 py-2.5 text-sm font-semibold text-[var(--ink-700)] transition hover:bg-[var(--surface-100)] active:scale-95"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.27 8.27 0 0 0 4.76 1.5V6.77a4.83 4.83 0 0 1-1-.08Z" />
          </svg>
          @{TIKTOK_USER}
        </a>
      </div>
    </section>
  );
}
