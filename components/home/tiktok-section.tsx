"use client";

import { useEffect, useRef, useState } from "react";

const TIKTOK_VIDEOS = [
  { id: "7597286299510394130", title: "Doflins unboxing" },
  { id: "7602463024145829127", title: "Doflins colección" },
  { id: "7613707708537113864", title: "Doflins reveal" },
  { id: "7613708018177346834", title: "Doflins figuras" },
] as const;

function TikTokEmbed({ videoId, title }: { videoId: string; title: string }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-[var(--surface-100)]">
      {visible ? (
        <iframe
          src={`https://www.tiktok.com/player/v1/${videoId}?music_info=0&description=0&rel=0`}
          title={title}
          className="h-full w-full border-0"
          allow="encrypted-media"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--surface-200)]" />
        </div>
      )}
    </div>
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
          <TikTokEmbed key={video.id} videoId={video.id} title={video.title} />
        ))}
      </div>

      <div className="flex justify-center">
        <a
          href="https://www.tiktok.com/@dofershop"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-300)] bg-[var(--surface-50)] px-5 py-2.5 text-sm font-semibold text-[var(--ink-700)] transition hover:bg-[var(--surface-100)] active:scale-95"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.27 8.27 0 0 0 4.76 1.5V6.77a4.83 4.83 0 0 1-1-.08Z" />
          </svg>
          @dofershop
        </a>
      </div>
    </section>
  );
}
