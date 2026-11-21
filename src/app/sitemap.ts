import { MetadataRoute } from 'next';
import { getAllCompounds, getAllAreas } from '@/lib/compounds-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.ewanbot.com';
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/compounds`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/calculator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/market-index`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
  ];

  // Add real Programmatic Egyptian Area Landing Pages (/areas/[slug])
  try {
    const areas = getAllAreas();
    areas.forEach((area) => {
      routes.push({
        url: `${baseUrl}/areas/${area.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });
  } catch (err) {
    console.error('Failed to append areas to sitemap:', err);
  }

  // Add all 663 Programmatic SEO Compound Landing Pages (/compounds/[slug])
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
