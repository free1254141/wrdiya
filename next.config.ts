import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Vercel & Edge Image Caching: Cache remote images for 30 days to save Supabase egress & quota
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days in seconds
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'csuifvyghfsibkrnxrby.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'launches.aqarmap.com' },
      { protocol: 'https', hostname: '**.aqarmap.com' },
      { protocol: 'https', hostname: '**.aqarmap.com.eg' },
      { protocol: 'https', hostname: '**.tekce.com' },
      { protocol: 'https', hostname: 'images.bayut.eg' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cooingestate.com' },
      { protocol: 'https', hostname: '**.nawy.com' },
    ],
  },
  // Edge CDN caching headers for static assets and public APIs
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/api/seller/properties',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=180',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
