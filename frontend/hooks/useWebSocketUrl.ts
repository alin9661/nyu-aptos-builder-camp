'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to safely construct WebSocket URL on the client-side only
 * This prevents hydration mismatches by returning null during SSR
 */
export function useWebSocketUrl(path: string = '/ws'): string | null {
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  useEffect(() => {
    // Only construct URL on client-side
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}${path}`;
      setWsUrl(url);
    }
  }, [path]);

  return wsUrl;
}
