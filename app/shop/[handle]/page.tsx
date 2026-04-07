import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  BoltIcon,
  CheckCircleIcon,
  EyeIcon,
  FireIcon,
  PhotoIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNav } from "@/components/nav/bottom-nav";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { ProductViewer3D } from "@/components/shop/product-viewer-3d";
import { resolveProductModelUrl } from "@/lib/shop/product-model";
import type { ShopProduct, ShopProductVariant, ShopifyMoney, UniverseFilter } from "@/lib/shopify/types";
import { fetchShopProductByHandle, fetchShopProducts, ShopifyStorefrontError } from "@/lib/server/shopify-storefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: ShopProductDetailPageProps): Promise<Metadata> {
  const { handle } = await params;
  try {
    const product = await fetchShopProductByHandle(handle);
    if (!product) {
      return { title: "Pack no encontrado | DOFLINS" };
    }
    const description =
      product.description.trim().length > 0
        ? product.description.slice(0, 160)
        : `Pack oficial DOFLINS ${product.title} — compra segura con checkout Shopify.`;
    return {
      title: `${product.title} | DOFLINS`,
      description,
      openGraph: {
        title: `${product.title} | DOFLINS`,
        description,
        ...(product.imageUrl
          ? { images: [{ url: product.imageUrl, width: 1200, height: 630, alt: product.imageAlt ?? product.title }] }
          : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.title} | DOFLINS`,
        description,
        ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
      },
    };
  } catch {
    return { title: "Pack DOFLINS" };
  }
}
const BEST_SELLER_HANDLES = new Set(["safari-15"]);

interface ShopProductDetailPageProps {
  params: Promise<{
    handle: string;
  }>;
}

function formatMoney(money: ShopifyMoney | null): string {
  if (!money) {
    return "-";
  }

  const value = Number(money.amount);
  if (!Number.isFinite(value)) {
    return `${money.amount} ${money.currencyCode}`;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: money.currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
}

function pickRecommendedVariant(product: ShopProduct): ShopProductVariant | null {
  return product.variants.find((variant) => variant.availableForSale) ?? product.variants[0] ?? null;
}

function universeLabel(product: ShopProduct): string {
  if (product.universe === "multiverse") return "Multiverse";
  if (product.universe === "mega") return "MEGA";
  if (product.universe === "animals") return "Animals";
  return "Doflins";
}

const UNIVERSE_PAGE_THEME = {
  animals: {
    card: "border-[#d9cfad] bg-[linear-gradient(145deg,#fffaf1,#f4f7e9)] shadow-[0_18px_36px_rgba(74,79,41,0.15)]",
    imageBg: "bg-[linear-gradient(155deg,#f7f8eb,#e8efde)]",
    badge: "bg-[#e8f2d6] text-[var(--ink-800)]",
    badgeIcon: "animals" as const,
    priceBorder: "border-[#d9d2b3]",
    trustBg: "border-[#cfdab2] bg-[#eef5df]",
    variantAvail: "border-[#cfdab2] bg-[#f4f8e8]",
    variantRing: "ring-[#b8d493]",
    variantRecBg: "bg-[#e2f1cc] text-[#2f5b1f]",
    btnPrimary: "bg-[linear-gradient(135deg,#4e6f2a,#6d8a3a)] hover:opacity-90",
    btnSecondary: "border-[#b8d493] bg-[#eef5df] text-[#2f5b1f] hover:bg-[#e4f2d0]",
    relatedBorder: "border-[#d9d0b0]",
    relatedBg: "hover:bg-[#f7f9ef]",
  },
  multiverse: {
    card: "border-[#c0caee] bg-[linear-gradient(145deg,#f0f4ff,#e6ebff)] shadow-[0_18px_36px_rgba(60,80,180,0.12)]",
    imageBg: "bg-[linear-gradient(155deg,#eef0ff,#dce4ff)]",
    badge: "bg-[#dbe4ff] text-[#24336c]",
    badgeIcon: "multiverse" as const,
    priceBorder: "border-[#c0caee]",
    trustBg: "border-[#b8c4f0] bg-[#eef0ff]",
    variantAvail: "border-[#b8c4f0] bg-[#eef0ff]",
    variantRing: "ring-[#8a9ee0]",
    variantRecBg: "bg-[#d4dcff] text-[#1c2960]",
    btnPrimary: "bg-[linear-gradient(135deg,#4b5fc0,#687ff1)] hover:opacity-90",
    btnSecondary: "border-[#8a9ee0] bg-[#eef0ff] text-[#1c2960] hover:bg-[#e0e6ff]",
    relatedBorder: "border-[#c0caee]",
    relatedBg: "hover:bg-[#eef0ff]",
  },
  mega: {
    card: "border-[#e0c870] bg-[linear-gradient(145deg,#fffbee,#fdf0c8)] shadow-[0_18px_36px_rgba(160,100,20,0.18)]",
    imageBg: "bg-[linear-gradient(155deg,#fff8e8,#faeac8)]",
    badge: "bg-[#fff0c8] text-[#7a4e14]",
    badgeIcon: "mega" as const,
    priceBorder: "border-[#e0c870]",
    trustBg: "border-[#d8b060] bg-[#fef6de]",
    variantAvail: "border-[#d8b060] bg-[#fef6de]",
    variantRing: "ring-[#d8a840]",
    variantRecBg: "bg-[#fde8a0] text-[#7a4e14]",
    btnPrimary: "bg-[linear-gradient(135deg,#c47c20,#e8a830)] hover:opacity-90",
    btnSecondary: "border-[#d8a840] bg-[#fef0c0] text-[#7a4e14] hover:bg-[#fee8a0]",
    relatedBorder: "border-[#e0c870]",
    relatedBg: "hover:bg-[#fef6de]",
  },
} as const;

function resolveUniverse(product: ShopProduct): UniverseFilter {
  return product.universe ?? "animals";
}

function isBestSellerProduct(product: ShopProduct): boolean {
  return BEST_SELLER_HANDLES.has(product.handle.toLowerCase());
}

function ErrorState({ message }: { message: string }): React.JSX.Element {
  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-5 py-12 pb-28 sm:px-8 sm:pb-12">
        <Card className="ink-light w-full border border-[#e9c7c7] bg-[#fff5f5]">
          <CardContent className="space-y-4 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#8a3f3f]">No disponible</p>
            <h1 className="font-title text-3xl text-[var(--ink-900)]">No se pudo cargar este pack</h1>
            <p className="text-sm text-[var(--ink-700)]">{message}</p>
            <Button asChild variant="secondary" className="w-fit">
              <Link href="/#compras">
                <ArrowLeftIcon className="h-4 w-4" /> Volver a catálogo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </>
  );
}

export default async function ShopProductDetailPage({ params }: ShopProductDetailPageProps): Promise<React.JSX.Element> {
  const { handle } = await params;

  let product: ShopProduct | null;
  try {
    product = await fetchShopProductByHandle(handle);
  } catch (error) {
    if (error instanceof ShopifyStorefrontError) {
      return <ErrorState message={error.message} />;
    }
    throw error;
  }

  if (!product) {
    notFound();
  }

  const recommendedVariant = pickRecommendedVariant(product);
  const isSoldOut = !recommendedVariant?.availableForSale;
  const availableVariants = product.variants.filter((variant) => variant.availableForSale).length;
  const isBestSeller = isBestSellerProduct(product);
  const productUniverse = resolveUniverse(product);
  const t = UNIVERSE_PAGE_THEME[productUniverse] ?? UNIVERSE_PAGE_THEME.animals;

  let relatedProducts: ShopProduct[] = [];
  try {
    const sameUniverseProducts = await fetchShopProducts(productUniverse);
    relatedProducts = sameUniverseProducts.filter((item) => item.handle !== product.handle).slice(0, 3);
  } catch (error) {
    console.error("shop/[handle] related products error", error);
  }

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-8 pb-28 sm:px-8 sm:pb-12">
      <div className="w-full space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" className="w-fit rounded-full border border-[#d9d2b1] bg-white/70">
            <Link href="/#compras">
              <ArrowLeftIcon className="h-4 w-4" /> Volver a compras
            </Link>
          </Button>
          <p className="hidden text-xs text-[var(--ink-600)] sm:block">
            <Link href="/" className="hover:underline">Inicio</Link>
            {" / "}
            <Link href="/#compras" className="hover:underline">Tienda</Link>
            {" / "}
            <span className="text-[var(--ink-900)] font-semibold">{product.title}</span>
          </p>
        </div>

        <Card className={`ink-light overflow-hidden border ${t.card}`}>
          <CardContent className="grid gap-0 p-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className={`relative flex min-h-[360px] items-center justify-center overflow-hidden ${t.imageBg} p-6`}>
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.imageAlt ?? product.title}
                  className="h-full max-h-[460px] w-full object-contain drop-shadow-[0_20px_35px_rgba(28,34,16,0.26)] transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm text-[var(--ink-600)]">
                  <PhotoIcon className="h-8 w-8" />
                  Sin imagen disponible
                </div>
              )}
              <span
                className={`absolute right-5 top-5 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  isSoldOut
                    ? "bg-[#e6d2d2] text-[#7f3e3e] ring-1 ring-[#d6b7b7]"
                    : "bg-[#ddf0c6] text-[#2f5b1f] ring-1 ring-[#b8d493]"
                }`}
              >
                {isSoldOut ? "Agotado" : "Disponible"}
              </span>
            </div>

            <div className="space-y-5 p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={t.badge}>
                  {productUniverse === "multiverse" ? <BoltIcon className="h-4 w-4" /> : productUniverse === "mega" ? <FireIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                  {universeLabel(product)}
                </Badge>
                {isBestSeller ? (
                  <Badge className="bg-[#ffe9b5] text-[#5e4300] ring-1 ring-[#e6c676]">
                    <SparklesIcon className="h-4 w-4" /> Más vendido
                  </Badge>
                ) : null}
                <Badge className="bg-white text-[var(--ink-700)] ring-1 ring-black/10">
                  <CheckCircleIcon className="h-4 w-4" /> {availableVariants}/{product.variants.length} variantes disponibles
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="font-title text-4xl leading-[1.05] text-[var(--ink-900)] sm:text-5xl">{product.title}</h1>
                <p className="text-sm leading-relaxed text-[var(--ink-700)]">
                  {product.description.trim().length > 0 ? product.description : "Pack oficial DOFLINS listo para agregar a tu colección."}
                </p>
              </div>

              <div className={`rounded-2xl border ${t.priceBorder} bg-white/88 p-4`}>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ink-600)]">Precio base</p>
                <p className="font-title text-4xl text-[var(--ink-900)]">{formatMoney(recommendedVariant?.price ?? product.price)}</p>
              </div>

              <div className={`rounded-2xl border ${t.trustBg} p-4 text-sm text-[var(--ink-700)]`}>
                <p className="font-semibold text-[var(--ink-900)]">Compra segura desde DOFLINS</p>
                <p className="mt-1">Agrega tus packs en el catálogo y paga en Shopify Checkout sin salir de tu flujo de compra.</p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Variantes</p>
                <ul className="space-y-2">
                  {product.variants.map((variant) => {
                    const isRecommended = recommendedVariant?.id === variant.id;

                    return (
                      <li
                        key={variant.id}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                          variant.availableForSale
                            ? `${t.variantAvail} text-[var(--ink-800)]`
                            : "border-[#dfcdcd] bg-[#f9f0f0] text-[var(--ink-600)]"
                        } ${isRecommended ? `ring-1 ${t.variantRing}` : ""}`}
                      >
                        <span className="flex items-center gap-2 font-medium">
                          {variant.title && variant.title !== "Default Title" ? variant.title : null}
                          {isRecommended ? (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${t.variantRecBg}`}>
                              Recomendada
                            </span>
                          ) : null}
                        </span>
                        <span className="text-right">
                          <strong className="text-[var(--ink-900)]">{formatMoney(variant.price)}</strong>
                          <span className="ml-2 text-xs">{variant.availableForSale ? "Disponible" : "Agotado"}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 3D Viewer — shows only when a model exists for this product */}
              {resolveProductModelUrl(product.handle, product.tags) ? (
                <ProductViewer3D
                  modelUrl={resolveProductModelUrl(product.handle, product.tags)!}
                  productTitle={product.title}
                  posterUrl={product.imageUrl ?? undefined}
                />
              ) : null}

              <div className="space-y-2">
                {recommendedVariant ? (
                  <AddToCartButton
                    variantId={recommendedVariant.id}
                    productTitle={product.title}
                    isSoldOut={isSoldOut}
                  />
                ) : null}
                <Button asChild className={`h-12 w-full ${t.btnPrimary} opacity-80`}>
                  <Link href="/#compras">
                    <ShoppingCartIcon className="h-5 w-5" /> Ver catálogo completo
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="h-12 w-full">
                  <Link href="/">
                    <ArrowLeftIcon className="h-5 w-5" /> Seguir explorando universos
                  </Link>
                </Button>
                <p className="text-center text-xs text-[var(--ink-600)]">Tu carrito se sincroniza cuando vuelves al catálogo.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`ink-light overflow-hidden border ${t.relatedBorder} bg-[linear-gradient(145deg,#fffaf1,#f3f7e8)] shadow-[0_14px_30px_rgba(74,79,41,0.12)]`}>
          <CardContent className="space-y-5 p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">Próximo en la colección</p>
                <h2 className="font-title text-2xl leading-tight text-[var(--ink-900)] sm:text-3xl">
                  Sigue completando {universeLabel(product)}
                </h2>
                <p className="text-sm text-[var(--ink-700)]">Estos packs del mismo universo amplían tu colección más rápido.</p>
              </div>
              <Button asChild variant="secondary" className="rounded-full">
                <Link href="/#compras">
                  <ShoppingCartIcon className="h-4 w-4" /> Ver catálogo completo
                </Link>
              </Button>
            </div>

            {relatedProducts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {relatedProducts.map((item) => {
                  const itemVariant = pickRecommendedVariant(item);
                  const itemSoldOut = !itemVariant?.availableForSale;
                  const itemIsBestSeller = isBestSellerProduct(item);

                  return (
                    <article
                      key={item.id}
                      className={`overflow-hidden rounded-2xl border ${t.relatedBorder} bg-[linear-gradient(160deg,#ffffff,#f5f7eb)] shadow-[0_10px_20px_rgba(68,75,35,0.12)]`}
                    >
                      <div className={`relative aspect-[4/3] w-full overflow-hidden ${t.imageBg}`}>
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.imageAlt ?? item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs text-[var(--ink-600)]">
                            <PhotoIcon className="h-6 w-6" />
                            Sin imagen
                          </div>
                        )}
                        <span
                          className={`absolute right-3 top-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            itemSoldOut
                              ? "bg-[#e5d3d3] text-[#7a3a3a] ring-1 ring-[#d6b8b8]"
                              : "bg-[#dff0c7] text-[#2f5c1f] ring-1 ring-[#b7d494]"
                          }`}
                        >
                          {itemSoldOut ? "Agotado" : "Disponible"}
                        </span>
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-600)]">{universeLabel(item)}</p>
                          {itemIsBestSeller ? (
                            <span className="inline-flex rounded-full bg-[#ffe9b5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#5e4300] ring-1 ring-[#e6c676]">
                              Más vendido
                            </span>
                          ) : null}
                        </div>
                        <h3 className="font-title text-2xl leading-tight text-[var(--ink-900)]">{item.title}</h3>
                        <p className="text-sm text-[var(--ink-700)]">{formatMoney(itemVariant?.price ?? item.price)}</p>
                        <Button asChild variant="ghost" className={`w-full rounded-full border ${t.relatedBorder} bg-white/80`}>
                          <Link href={`/shop/${item.handle}`}>
                            <EyeIcon className="h-4 w-4" /> Ver detalle
                          </Link>
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={`rounded-2xl border ${t.relatedBorder} bg-white/82 p-4`}>
                <p className="text-sm text-[var(--ink-700)]">Pronto agregaremos más packs en este universo.</p>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild className={`h-11 ${t.btnPrimary}`}>
                <Link href="/#compras">
                  <ShoppingCartIcon className="h-4 w-4" /> Ir al catálogo y ver todos los productos
                </Link>
              </Button>
              <Button asChild variant="secondary" className="h-11">
                <Link href="/">
                  <ArrowLeftIcon className="h-4 w-4" /> Volver al inicio de universos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </main>
      <BottomNav />
    </>
  );
}
