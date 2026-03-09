import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://doflins.dofer.mx';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/webhooks/'],
        disallow: ['/api/', '/admin/', '/auth/callback'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
