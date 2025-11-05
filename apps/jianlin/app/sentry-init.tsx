'use client';

import { useEffect } from 'react';

export function SentryInit() {
  useEffect(() => {
    // 動態導入 Sentry 客戶端配置
    import('../sentry.client.config').then(() => {
      console.log('[Sentry] Client configuration loaded');
    });
  }, []);

  return null;
}
