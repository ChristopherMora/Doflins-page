"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const REVIEWS = [
  { name: "B.", pack: "Explorador (5)", stars: 5, text: "Excelente calidad y variedad, valen mucho la pena si te gusta coleccionar figuritas.", likes: 2 },
  { name: "Anónimo", pack: "Explorador (5)", stars: 5, text: "Me encantó, están muy bonitos, los recomiendo 10/10.", likes: 8 },
  { name: "D.", pack: "Explorador (5)", stars: 5, text: "Muy buenos doflins, vienen con muchas variantes de animales, su calidad es muy buena, muy buenos para decorar tu set up. Son perfectos.", likes: 0 },
  { name: "R.", pack: "Salvaje (30)", stars: 5, text: "Excelente detalle y calidad de materiales. Figuras muy detalladas.", likes: 0 },
  { name: "S.", pack: "Explorador (5)", stars: 5, text: "Muy buen producto 100% confiable, te llegan animales súper bonitos y si compras dos te salen más padres.", likes: 1 },
  { name: "M.", pack: "Explorador (5)", stars: 5, text: "Están padrísimos, viene 5 de diferentes figuras, son de buen tamaño y el empaque llegó todo bien.", likes: 3 },
  { name: "K.", pack: "Explorador (5)", stars: 5, text: "Muy buena calidad y están hermosos.", likes: 2 },
  { name: "E.", pack: "Explorador (5)", stars: 5, text: "Muy lindos, buena calidad; tipo articulables y muy tiernos.", likes: 0 },
  { name: "A.", pack: "Safari (15)", stars: 5, text: "Buena calidad, coloridos y bonitos.", likes: 0 },
  { name: "E.Z.", pack: "Explorador (5)", stars: 5, text: "Están bien bonitos, súper buena calidad.", likes: 2 },
  { name: "C.", pack: "Explorador (5)", stars: 5, text: "Muy tiernos y bonitos, me encantaron.", likes: 0 },
  { name: "R.N.", pack: "Explorador (5)", stars: 5, text: "Muy lindos, buen calidad.", likes: 0 },
  { name: "J.H.", pack: "Salvaje (30)", stars: 5, text: "Muy bonitos y de buen material. Solo que se repiten los animales pero con diferentes colores.", likes: 0 },
  { name: "C.", pack: "Explorador (5)", stars: 5, text: "Muy lindos están bien tiernos.", likes: 0 },
  { name: "C.R.", pack: "Explorador (5)", stars: 5, text: "Me gustaron mucho.", likes: 0 },
  { name: "L.", pack: "Explorador (5)", stars: 5, text: "10/10 muy buena calidad y adorables.", likes: 0 },
  { name: "B.N.", pack: "Explorador (5)", stars: 5, text: "Me encantaron!! Super tiernos.", likes: 0 },
  { name: "D.B.", pack: "Explorador (5)", stars: 5, text: "Están súper bonitos.", likes: 0 },
  { name: "S.M.", pack: "Explorador (5)", stars: 5, text: "Estuvieron bonito.", likes: 1 },
  { name: "H.", pack: "Explorador (5)", stars: 5, text: "Resistentes.", likes: 1 },
  { name: "V.P.", pack: "Explorador (5)", stars: 5, text: "Muy lindos.", likes: 0 },
  { name: "B.7.", pack: "Explorador (5)", stars: 5, text: "Todo.", likes: 0 },
] as const;

/** Real stats from Shopify: 42 reviews total, 4.5 overall score */
const TOTAL_REVIEWS = 42;
const AVG_RATING = 4.5;

const STAR_PATH = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

function Stars({ rating, size = "h-3.5 w-3.5" }: { rating: number; size?: string }): React.JSX.Element {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <div className="flex">
      {Array.from({ length: full }, (_, i) => (
        <svg key={`f${i}`} className={`${size} text-amber-400`} fill="currentColor" viewBox="0 0 20 20"><path d={STAR_PATH} /></svg>
      ))}
      {hasHalf ? (
        <svg key="h" className={`${size} text-amber-400`} viewBox="0 0 20 20">
          <defs><linearGradient id={`half-${size}`}><stop offset="50%" stopColor="currentColor" /><stop offset="50%" stopColor="#d1d5db" /></linearGradient></defs>
          <path fill={`url(#half-${size})`} d={STAR_PATH} />
        </svg>
      ) : null}
      {Array.from({ length: empty }, (_, i) => (
        <svg key={`e${i}`} className={`${size} text-gray-300`} fill="currentColor" viewBox="0 0 20 20"><path d={STAR_PATH} /></svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: typeof REVIEWS[number] }): React.JSX.Element {
  return (
    <article className="rounded-2xl border p-4" style={{ borderColor: "var(--shop-card-border)", background: "var(--shop-card-bg)" }}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--shop-primary-from)] text-xs font-bold text-white">
            {review.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ink-900)]">{review.name}</p>
            <p className="text-[10px] text-[var(--ink-500)]">{review.pack}</p>
          </div>
        </div>
        <Stars rating={review.stars} />
      </div>
      <p className="text-sm leading-relaxed text-[var(--ink-700)]">&ldquo;{review.text}&rdquo;</p>
      {review.likes > 0 ? (
        <p className="mt-2 text-xs text-[var(--ink-500)]">👍 {review.likes}</p>
      ) : null}
    </article>
  );
}

/** Auto-scrolling speed: pixels per frame (~60fps). */
const SCROLL_SPEED = 0.6;

export function ReviewsSection({ universeThemeVars }: { universeThemeVars: React.CSSProperties }): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (showAll) return;
    const tick = () => {
      const el = scrollRef.current;
      if (el && !pausedRef.current) {
        el.scrollLeft += SCROLL_SPEED;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) {
          el.scrollLeft -= half;
        }
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [showAll]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  return (
    <Card className="overflow-hidden border-0 shadow-none" style={{ ...universeThemeVars, background: "var(--shop-control-bg)" }}>
      <CardContent className="space-y-6 p-5 sm:p-8">
        {/* Title */}
        <div className="text-center">
          <h3 className="text-xl font-bold tracking-tight text-[var(--ink-900)] sm:text-2xl">
            Lo que dicen nuestros clientes
          </h3>
        </div>

        {/* Rating summary */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-5xl font-black leading-none text-[var(--ink-900)]">{AVG_RATING.toFixed(1)}</span>
          <Stars rating={AVG_RATING} size="h-5 w-5" />
          <p className="text-xs font-medium text-[var(--ink-500)]">{TOTAL_REVIEWS} reseñas verificadas</p>
        </div>

        {/* Auto-scroll carousel */}
        {!showAll ? (
          <div
            ref={scrollRef}
            className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8"
            style={{ scrollbarWidth: "none" }}
            onMouseEnter={pause}
            onMouseLeave={resume}
            onTouchStart={pause}
            onTouchEnd={resume}
          >
            {/* Duplicate reviews for seamless loop */}
            {[...REVIEWS, ...REVIEWS].map((review, i) => (
              <div key={i} className="w-[280px] shrink-0 sm:w-[320px]">
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        ) : (
          /* Grid view — all reviews */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REVIEWS.map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </div>
        )}

        {/* Toggle button */}
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Ocultar reseñas" : `Ver las ${TOTAL_REVIEWS} reseñas`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
