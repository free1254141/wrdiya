'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getOrCreateVisitorSessionId(): string {
  try {
    let sid = sessionStorage.getItem('ewan_visitor_sid');
    if (!sid) {
      sid = 'v_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
      sessionStorage.setItem('ewan_visitor_sid', sid);
    }
    return sid;
  } catch {
    return 'v_anon';
  }
}

export function trackVisitorEvent(
  pagePath: string,
  eventType: string,
  metadata?: Record<string, any>
) {
  try {
    if (typeof window === 'undefined' || pagePath.startsWith('/admin')) return;
    const payload = JSON.stringify({
      session_id: getOrCreateVisitorSessionId(),
      page_path: pagePath,
      event_type: eventType,
      referrer: document.referrer || null,
      metadata: metadata || {},
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', payload);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // non-blocking
  }
}

export default function PageAnalyticsTracker() {
  const pathname = usePathname() || '/';

  useEffect(() => {
    trackVisitorEvent(pathname, 'pageview');
  }, [pathname]);

  return null;
}
