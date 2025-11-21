'use client';

import { Coins } from 'lucide-react';
import { useTreasuryOverview } from '@/hooks/useTreasury';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CHAINS } from '@/lib/chains';

interface CrossChainTreasuryOverviewProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Plan A cross-chain-ready treasury overview. Today it only renders Aptos
 * balances, but the layout will automatically grow as we add more chains.
 */
export function CrossChainTreasuryOverview({
  autoRefresh = true,
  refreshInterval = 45_000,
}: CrossChainTreasuryOverviewProps) {
  const { data, loading, error, refetch } = useTreasuryOverview(autoRefresh, refreshInterval);

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Cross-Chain Treasury
          </CardTitle>
          <CardDescription>Plan A: Aptos-only implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Cross-Chain Treasury
          </CardTitle>
          <CardDescription>Plan A: Aptos-only implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={refetch}
            className="text-sm text-primary mt-2 hover:underline"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  const chains = data?.chains ?? [];
  const gridColsClass =
    chains.length >= 3 ? 'lg:grid-cols-3' : chains.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1';

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Cross-Chain Treasury
          </CardTitle>
          <Badge variant="outline">Plan A · Aptos source of truth</Badge>
        </div>
        <CardDescription>
          Each card represents a blockchain. More chains (Ethereum, Polygon, …) can
          join this grid without changing the component structure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 md:grid-cols-2 ${gridColsClass}`}>
          {chains.map(chain => {
            const metadata = CHAINS[chain.chainId];
            return (
              <div
                key={chain.chainId}
                className="rounded-lg border p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Chain</p>
                    <p className="text-lg font-semibold">
                      {metadata.displayName}
                    </p>
                  </div>
                  <Badge>{metadata.nativeTokenSymbol}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-2xl font-bold">{chain.balanceFormatted || '0 APT'}</p>
                  <p className="text-xs text-muted-foreground">
                    Raw: {chain.balance}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated {chain.timestamp ? new Date(chain.timestamp).toLocaleString() : 'just now'}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

