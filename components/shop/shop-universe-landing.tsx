import Image from "next/image";
import Link from "next/link";

import { BottomNav } from "@/components/nav/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShopUniverseNav } from "@/components/shop/shop-universe-nav";
import { formatMoney } from "@/components/shop/shop-utils";
import { getShopUniverseLandingContent } from "@/lib/shop/shop-universe-landing-content";
import type { ShopProduct, ShopProductVariant, UniverseFilter } from "@/lib/shopify/types";

function pickPreferredVariant(product: ShopProduct): ShopProductVariant | null {
  return product.variants.find((variant) => variant.availableForSale) ?? product.variants[0] ?? null;
}

function buildItemListJsonLd(universe: UniverseFilter, products: ShopProduct[]): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://doflins.dofer.mx";
  const content = getShopUniverseLandingContent(universe);

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: content.heroTitle,
    description: content.heroDescription,
    url: `${siteUrl}${content.href}`,
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListUnordered",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => {
        const variant = pickPreferredVariant(product);
        return {
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: product.title,
            description: product.shortDescription || product.description,
            url: `${siteUrl}/shop/${product.handle}`,
            image: product.imageUrl ?? undefined,
            brand: {
              "@type": "Brand",
              name: "DOFLINS",
            },
            offers: variant
              ? {
                  "@type": "Offer",
                  priceCurrency: variant.price.currencyCode,
                  price: variant.price.amount,
                  availability: variant.availableForSale
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                  url: `${siteUrl}/shop/${product.handle}`,
                }
              : undefined,
          },
        };
      }),
    },
  });
}

interface ShopUniverseLandingProps {
  universe: UniverseFilter;
  products: ShopProduct[];
}

export function ShopUniverseLanding({
  universe,
  products,
}: ShopUniverseLandingProps): React.JSX.Element {
  const content = getShopUniverseLandingContent(universe);
  const availableProducts = products.filter((product) => product.availableForSale);
  const startingPrice = products
    .map((product) => pickPreferredVariant(product))
    .filter((variant): variant is ShopProductVariant => Boolean(variant))
    .reduce<number | null>((lowest, variant) => {
      const amount = Number(variant.price.amount);
      if (!Number.isFinite(amount)) return lowest;
      return lowest === null ? amount : Math.min(lowest, amount);
    }, null);
  const currencyCode = products[0]?.price.currencyCode ?? "MXN";
  const jsonLd = buildItemListJsonLd(universe, products);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 pb-28 sm:px-8 sm:py-8 sm:pb-10">
        <section className={`overflow-hidden rounded-[2rem] border p-6 sm:p-8 ${content.theme.heroClassName}`}>
          <div className="space-y-6">
            <ShopUniverseNav currentUniverse={universe} />

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div className="space-y-4">
                <Badge className={content.theme.badgeClassName}>
                  Landing comercial de {content.shortLabel}
                </Badge>
                <div className="space-y-3">
                  <h1 className="font-title text-4xl leading-tight text-[var(--ink-900)] sm:text-5xl">
                    {content.heroTitle}
                  </h1>
                  <p className="max-w-3xl text-base leading-relaxed text-[var(--ink-700)] sm:text-lg">
                    {content.heroDescription}
                  </p>
                  <p className="max-w-3xl text-sm leading-relaxed text-[var(--ink-600)]">
                    {content.seoIntro}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild className={content.theme.ctaClassName}>
                    <Link href="#packs">Explorar packs {content.shortLabel}</Link>
                  </Button>
                  <Button asChild variant="secondary" className={content.theme.subtleCtaClassName}>
                    <Link href="/shop">Ver tienda completa</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <Card className={content.theme.statClassName}>
                  <CardContent className="p-4">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-500)]">Packs visibles</p>
                    <p className="mt-1 font-title text-3xl text-[var(--ink-900)]">{products.length}</p>
                  </CardContent>
                </Card>
                <Card className={content.theme.statClassName}>
                  <CardContent className="p-4">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-500)]">Disponibles</p>
                    <p className="mt-1 font-title text-3xl text-[var(--ink-900)]">{availableProducts.length}</p>
                  </CardContent>
                </Card>
                <Card className={content.theme.statClassName}>
                  <CardContent className="p-4">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-500)]">Desde</p>
                    <p className="mt-1 font-title text-3xl text-[var(--ink-900)]">
                      {startingPrice === null
                        ? "-"
                        : new Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: currencyCode,
                            maximumFractionDigits: 2,
                          }).format(startingPrice)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {content.purchaseHighlights.map((highlight) => (
            <Card key={highlight} className={content.theme.statClassName}>
              <CardContent className="p-5">
                <p className={`text-sm font-semibold leading-relaxed ${content.theme.accentClassName}`}>{highlight}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section id="packs" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${content.theme.accentClassName}`}>
                Catálogo indexable
              </p>
              <h2 className="font-title text-3xl text-[var(--ink-900)]">Packs disponibles de {content.label}</h2>
              <p className="max-w-3xl text-sm text-[var(--ink-600)]">
                Cada pack tiene URL propia para captar búsquedas con intención de compra y enviar al usuario directo al producto.
              </p>
            </div>
            <Button asChild variant="secondary" className={content.theme.subtleCtaClassName}>
              <Link href="/envios">Ver info de envíos</Link>
            </Button>
          </div>

          {products.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => {
                const variant = pickPreferredVariant(product);
                const isAvailable = variant?.availableForSale ?? product.availableForSale;

                return (
                  <article
                    key={product.id}
                    className={`overflow-hidden rounded-[1.75rem] border shadow-sm ${content.theme.productCardClassName}`}
                  >
                    <Link href={`/shop/${product.handle}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-100)]">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.imageAlt ?? product.title}
                            fill
                            sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                            priority={index < 3}
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-sm text-[var(--ink-500)]">
                            Imagen no disponible
                          </div>
                        )}
                        <span
                          className={`absolute right-4 top-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isAvailable
                              ? content.theme.stockAvailableClassName
                              : content.theme.stockSoldOutClassName
                          }`}
                        >
                          {isAvailable ? "Disponible" : "Agotado"}
                        </span>
                      </div>
                    </Link>

                    <div className="space-y-4 p-5">
                      <div className="space-y-2">
                        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${content.theme.accentClassName}`}>
                          Pack oficial {content.shortLabel}
                        </p>
                        <Link href={`/shop/${product.handle}`} className="block">
                          <h3 className="font-title text-2xl leading-tight text-[var(--ink-900)]">{product.title}</h3>
                        </Link>
                        <p className="line-clamp-3 text-sm leading-relaxed text-[var(--ink-600)]">
                          {product.shortDescription || product.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-500)]">Precio</p>
                          <p className="font-title text-3xl text-[var(--ink-900)]">
                            {formatMoney(variant?.price ?? product.price)}
                          </p>
                        </div>
                        <div className="text-right text-xs text-[var(--ink-500)]">
                          {product.variants.length} variante{product.variants.length === 1 ? "" : "s"}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button asChild className={content.theme.ctaClassName}>
                          <Link href={`/shop/${product.handle}`}>Ver pack</Link>
                        </Button>
                        <Button asChild variant="secondary" className={content.theme.subtleCtaClassName}>
                          <Link href="/devoluciones">Devoluciones</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <Card className={content.theme.statClassName}>
              <CardContent className="p-6">
                <p className="text-sm text-[var(--ink-700)]">
                  Todavía no hay packs visibles en este universo. En cuanto se publiquen, esta landing empezará a captar tráfico y a enlazar a cada producto.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className={content.theme.statClassName}>
            <CardContent className="space-y-4 p-6">
              <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${content.theme.accentClassName}`}>
                Por qué esta página ayuda a comprar
              </p>
              <h2 className="font-title text-3xl text-[var(--ink-900)]">Tráfico orgánico con intención</h2>
              <ul className="space-y-3 text-sm leading-relaxed text-[var(--ink-700)]">
                <li>Está enfocada en un solo universo para captar búsquedas más específicas y comerciales.</li>
                <li>Enlaza a páginas de producto reales, no a filtros o estados efímeros del cliente.</li>
                <li>Refuerza señales de confianza con envío, devoluciones y compra segura.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className={content.theme.statClassName}>
            <CardContent className="space-y-4 p-6">
              <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${content.theme.accentClassName}`}>
                Preguntas frecuentes
              </p>
              <div className="space-y-4">
                {content.faqs.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-black/5 bg-white/75 p-4">
                    <h3 className="text-sm font-semibold text-[var(--ink-900)]">{faq.question}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ink-600)]">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
