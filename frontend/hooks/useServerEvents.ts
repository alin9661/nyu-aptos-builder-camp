/**
 * React Hook for Server-Sent Events (SSE)
 * Replaces the previous WebSocket hook
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type EventChannel =
  | 'treasury:deposit'
  | 'treasury:balance'
  | 'reimbursements:new'
  | 'reimbursements:approved'
  | 'reimbursements:paid'
  | 'elections:vote'
  | 'elections:finalized'
  | 'proposals:new'
  | 'proposals:vote'
  | 'proposals:finalized';

export interface ServerEvent<T = any> {
  channel: EventChannel;
  data: T;
  emittedAt: number;
}

export interface UseServerEventsOptions {
  channels: EventChannel[];
  token?: string;
  enabled?: boolean;
  onEvent?: (event: ServerEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface UseServerEventsReturn {
  connected: boolean;
  error: Error | null;
  lastEvent: ServerEvent | null;
  reconnect: () => void;
}

/**
 * Hook to connect to Server-Sent Events
 *
 * @example
 * ```tsx
 * const { connected, lastEvent } = useServerEvents({
 *   channels: ['treasury:deposit', 'proposals:new'],
 *   token: authToken,
 *   onEvent: (event) => {
 *     console.log('Received event:', event);
 *   },
 * });
 * ```
 */
export function useServerEvents(
  options: UseServerEventsOptions
): UseServerEventsReturn {
  const {
    channels,
    token,
    enabled = true,
    onEvent,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastEvent, setLastEvent] = useState<ServerEvent | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || channels.length === 0) return;

    try {
      // Build URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const channelsParam = channels.join(',');
      const url = new URL(`${apiUrl}/api/events/stream`);
      url.searchParams.set('channels', channelsParam);
      if (token) {
        url.searchParams.set('token', token);
      }

      // Create EventSource
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      // Handle connection
      eventSource.onopen = () => {
        console.log('[SSE] Connected to event stream');
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      // Handle errors
      eventSource.onerror = (err) => {
        console.error('[SSE] Connection error:', err);
        const errorObj = new Error('SSE connection failed');
        setError(errorObj);
        setConnected(false);
        onError?.(errorObj);

        // Auto-reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;

        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          eventSource.close();
          connect();
        }, delay);
      };

      // Handle connection established
      eventSource.addEventListener('connected', (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        console.log('[SSE] Connection confirmed:', data);
      });

      // Handle ping (keepalive)
      eventSource.addEventListener('ping', () => {
        // Keepalive ping, no action needed
      });

      // Handle system messages
      eventSource.addEventListener('system:message', (e) => {
        const data = JSON.parse((e as MessageEvent).data);
        console.log('[SSE] System message:', data.message);
      });

      // Subscribe to all requested channels
      channels.forEach((channel) => {
        eventSource.addEventListener(channel, (e) => {
          try {
            const data = JSON.parse((e as MessageEvent).data);
            const event: ServerEvent = {
              channel,
              data,
              emittedAt: data.emittedAt || Date.now(),
            };

            setLastEvent(event);
            onEvent?.(event);
          } catch (err) {
            console.error(`[SSE] Failed to parse event for channel ${channel}:`, err);
          }
        });
      });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to connect to SSE');
      setError(errorObj);
      onError?.(errorObj);
    }
  }, [enabled, channels, token, onEvent, onError, onConnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
      onDisconnect?.();
    }
  }, [onDisconnect]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connected,
    error,
    lastEvent,
    reconnect,
  };
}

/**
 * Hook for polling events as a fallback
 * Use this if SSE is not supported or fails
 */
export function usePollingEvents(
  options: Omit<UseServerEventsOptions, 'enabled'> & { pollInterval?: number }
): UseServerEventsReturn {
  const { channels, token, pollInterval = 5000, onEvent, onError } = options;

  const [error, setError] = useState<Error | null>(null);
  const [lastEvent, setLastEvent] = useState<ServerEvent | null>(null);
  const lastTimestampRef = useRef<number>(Date.now());

  useEffect(() => {
    const poll = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const channelsParam = channels.join(',');
        const url = `${apiUrl}/api/events/poll?channels=${channelsParam}&since=${lastTimestampRef.current}`;

        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`Polling failed: ${response.statusText}`);
        }

        const { events, timestamp } = await response.json();
        lastTimestampRef.current = timestamp;

        events.forEach((event: any) => {
          const serverEvent: ServerEvent = {
            channel: event.channel,
            data: event.data,
            emittedAt: event.timestamp,
          };

          setLastEvent(serverEvent);
          onEvent?.(serverEvent);
        });

        setError(null);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Polling failed');
        setError(errorObj);
        onError?.(errorObj);
      }
    };

    poll(); // Initial poll
    const interval = setInterval(poll, pollInterval);

    return () => clearInterval(interval);
  }, [channels, token, pollInterval, onEvent, onError]);

  return {
    connected: true, // Always "connected" for polling
    error,
    lastEvent,
    reconnect: () => {
      lastTimestampRef.current = Date.now();
    },
  };
}
