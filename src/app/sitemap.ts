import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://skanybot.vercel.app';
  const now = new Date();

  // Supported languages
  const languages = ['ar', 'en', 'tr', 'ru', 'de', 'fr', 'es'];

  // Geographic regional landing targets
  const regions = [
    'new-cairo',
    'sheikh-zayed',
    'new-capital',
    'madinaty',
    'october',
    'dubai',
    'istanbul',
    'spain-malaga',
  ];

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(
          languages.map(lang => [lang, `${baseUrl}?lang=${lang}`])
        ),
      },
    },
  ];

  // Add regional landing URLs
  regions.forEach(region => {
    routes.push({
      url: `${baseUrl}?region=${region}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return routes;
}
