import type { MetadataRoute } from 'next';
import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db/client';
import { doflins } from '@/lib/db/schema';
import { fetchShopProducts } from '@/lib/server/shopify-storefront';
import { SHOP_UNIVERSE_ORDER } from '@/lib/shop/shop-universe-landing-content';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://doflins.dofer.mx';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/reveal`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/reveal?universe=animals`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reveal?universe=multiverse`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/animals`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/mega`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/multiverse`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/acerca`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/coleccion`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/envios`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/devoluciones`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Rutas dinámicas: una URL por figura activa
  try {
    const shopProductsByUniverse = await Promise.all(
      SHOP_UNIVERSE_ORDER.map((universe) => fetchShopProducts(universe).catch(() => [])),
    );
    const shopRoutesMap = new Map<string, MetadataRoute.Sitemap[number]>();
    for (const products of shopProductsByUniverse) {
      for (const product of products) {
        if (!product.handle || shopRoutesMap.has(product.handle)) continue;
        shopRoutesMap.set(product.handle, {
          url: `${baseUrl}/shop/${product.handle}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    const db = getDb();
    const allDoflins = await db
      .select({ id: doflins.id, updatedAt: doflins.updatedAt })
      .from(doflins)
      .where(eq(doflins.activo, true));

    const doflinRoutes: MetadataRoute.Sitemap = allDoflins.map((d) => ({
      url: `${baseUrl}/carta/${d.id}`,
      lastModified: d.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    return [...staticRoutes, ...Array.from(shopRoutesMap.values()), ...doflinRoutes];
  } catch {
    return staticRoutes;
  }
}
