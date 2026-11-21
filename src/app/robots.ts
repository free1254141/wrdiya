import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.ewanbot.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/compounds', '/areas', '/compare', '/calculator', '/market-index', '/partners', '/pricing', '/llms.txt', '/llms-full.txt', '/api/properties'],
        disallow: [
          '/api/leads',
          '/api/admin',
          '/api/paypal',
          '/api/payment',
          '/api/webhooks',
          '/api/chat',
          '/api/usage',
          '/api/analytics',
          '/admin',
          '/widget',
          '/auth',
        ],
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
        allow: ['/', '/compounds', '/areas', '/compare', '/calculator', '/market-index', '/llms.txt', '/llms-full.txt', '/api/properties'],
        disallow: ['/api/leads', '/api/admin', '/api/payment', '/admin', '/widget', '/auth'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
