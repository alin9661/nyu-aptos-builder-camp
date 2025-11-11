'use client';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Treasury Balance
        </CardTitle>
        <CardDescription>
          Current vault balance from blockchain
          {showCoinType && data.coinType && (
            <Badge variant="outline" className="ml-2">
              {data.coinType.split('::').pop()}
            </Badge>
          )}
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
