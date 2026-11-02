import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://ewanbot.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/api/properties'],
        disallow: ['/api/leads', '/api/admin', '/api/paypal', '/api/webhooks', '/admin'],
      },
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'Google-Extended',
          'GoogleOther',
          'ClaudeBot',
          'Claude-Web',
          'anthropic-ai',
          'PerplexityBot',
          'Perplexity-User',
          'Applebot-Extended',
          'Meta-ExternalAgent',
          'Amazonbot',
          'DuckAssistBot',
          'YouBot',
          'CCBot',
        ],
        allow: ['/', '/llms.txt', '/llms-full.txt', '/api/properties'],
        disallow: ['/api/leads', '/api/admin', '/admin'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
