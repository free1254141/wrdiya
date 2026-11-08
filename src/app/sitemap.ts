import { MetadataRoute } from 'next';
import { getAllCompounds } from '@/lib/compounds-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ewanbot.com';
  const now = new Date();

  // Supported languages
  const languages = ['ar', 'en', 'tr', 'ru', 'de', 'fr', 'es'];

  // Geographic Egyptian regional landing targets
  const regions = [
    'new-cairo',
    'sheikh-zayed',
    'new-capital',
    'october',
    'north-coast',
    'ain-sokhna',
    'mostakbal-city',
    'madinaty',
    'el-gouna',
    'alexandria',
  ];

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(
          languages.map((lang) => [lang, `${baseUrl}?lang=${lang}`])
        ),
      },
    },
    {
      url: `${baseUrl}/calculator`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/compounds`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/llms-full.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Add Egyptian regional landing URLs
  regions.forEach((region) => {
    routes.push({
      url: `${baseUrl}?region=${region}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    });
  });

  // Add language entry URLs
  languages.forEach((lang) => {
    if (lang !== 'ar') {
      routes.push({
        url: `${baseUrl}?lang=${lang}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  });

  // Add all 600+ Programmatic SEO Compound Landing Pages for Google Indexing
  try {
    const compounds = getAllCompounds();
    compounds.forEach((c) => {
      routes.push({
        url: `${baseUrl}/compounds/${encodeURIComponent(c.slug)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  } catch (err) {
    console.error('Failed to append compounds to sitemap:', err);
  }

  return routes;
}
