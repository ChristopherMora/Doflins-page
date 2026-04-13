"use client";

import dynamic from "next/dynamic";

const ShopifyBuyExperience = dynamic(
  () => import("@/components/shop/shopify-buy-experience").then((m) => m.ShopifyBuyExperience),
  {
    ssr: false,
    loading: () => (
      <section
        aria-hidden
        className="min-h-[880px] rounded-[2rem] border border-[var(--surface-200)] bg-[linear-gradient(180deg,#f8f7f2,#f2f5e8)] p-5 shadow-sm sm:min-h-[980px] sm:p-6"
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-6 w-40 animate-pulse rounded-full bg-[var(--surface-200)]" />
            <div className="h-12 w-full max-w-xl animate-pulse rounded-2xl bg-[var(--surface-100)]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[1.75rem] border border-[var(--surface-200)] bg-white/80 p-4"
              >
                <div className="aspect-[16/11] w-full animate-pulse rounded-[1.25rem] bg-[var(--surface-100)]" />
                <div className="mt-4 h-4 w-24 animate-pulse rounded bg-[var(--surface-100)]" />
                <div className="mt-3 h-7 w-3/4 animate-pulse rounded bg-[var(--surface-100)]" />
                <div className="mt-4 h-11 w-full animate-pulse rounded-full bg-[var(--surface-200)]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
  }
);

export function ShopifyBuyExperienceWrapper() {
  return <ShopifyBuyExperience />;
}
