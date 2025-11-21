'use client';

import { useEffect } from 'react';
import { useTreasuryBalance } from '@/hooks/useTreasury';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Wallet } from 'lucide-react';

interface TreasuryBalanceProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showCoinType?: boolean;
}

export function TreasuryBalance({
  autoRefresh = true,
  refreshInterval = 30000,
  showCoinType = true,
}: TreasuryBalanceProps) {
  const { data, loading, error, refetch } = useTreasuryBalance(autoRefresh, refreshInterval);

  // Real-time updates via WebSocket
  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected for treasury balance');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Refresh on treasury balance events
          if (message.channel === 'treasury:balance' ||
              message.channel === 'treasury:deposit') {
            console.log('Treasury balance update received, refreshing...');
            refetch();
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [refetch]);

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Treasury Balance
          </CardTitle>
          <CardDescription>Current vault balance from blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Treasury Balance
          </CardTitle>
          <CardDescription>Current vault balance from blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error}</div>
          <button
            onClick={refetch}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const chainLabel = data.chainDisplayName || 'Aptos';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Treasury Balance
        </CardTitle>
        <CardDescription>
          {/* Plan A: Aptos-only but layout is chain-aware */}
          <span> Current vault balance on {chainLabel}</span>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline">{chainLabel}</Badge>
            {showCoinType && data.coinType && (
              <Badge variant="secondary">{data.coinType.split('::').pop()}</Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{data.balanceFormatted}</div>
        <div className="text-xs text-muted-foreground mt-2">
          Raw: {data.balance}
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
