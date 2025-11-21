'use client';

import { useMemo } from 'react';
import { Network } from 'lucide-react';
import { useCrossChainProposals } from '@/hooks/useGovernance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CHAINS, ChainId } from '@/lib/chains';
import { ChainAction } from '@/lib/types/api';

interface CrossChainGovernanceOverviewProps {
  limit?: number;
}

/**
 * Cross-chain ready governance overview. Displays which chains each proposal
 * touches so future Ethereum/Polygon integrations can plug in without changing
 * the UI structure. Plan A keeps Aptos as the single source of truth.
 */
export function CrossChainGovernanceOverview({ limit = 5 }: CrossChainGovernanceOverviewProps) {
  const { data, loading, error, refetch } = useCrossChainProposals(
    { limit, page: 1 },
    { autoRefresh: true, refreshInterval: 60_000 }
  );

  const proposals = data?.proposals ?? [];

  const content = useMemo(() => {
    if (loading && !data) {
      return <Skeleton className="h-36 w-full" />;
    }

    if (error) {
      return (
        <div>
          <p className="text-sm text-destructive">{error}</p>
          <button className="text-sm text-primary mt-2 hover:underline" onClick={refetch}>
            Try again
          </button>
        </div>
      );
    }

    if (proposals.length === 0) {
      return <p className="text-sm text-muted-foreground">No proposals available.</p>;
    }

    return (
      <div className="space-y-4">
        {proposals.map((proposal) => {
          const chains = proposal.chainIds?.length
            ? proposal.chainIds
            : [proposal.chainId ?? 'aptos'];

          return (
            <div
              key={proposal.proposal_id}
              className="rounded-lg border p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Proposal #{proposal.proposal_id}</p>
                  <p className="text-sm font-semibold">{proposal.title}</p>
                </div>
                <Badge variant="outline">{proposal.statusName}</Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {chains.map(chainId => (
                  <Badge key={chainId} variant="secondary">
                    {CHAINS[chainId].displayName}
                  </Badge>
                ))}
              </div>

              {proposal.actions.length > 0 && (
                <div className="space-y-1">
                  {groupActionsByChain(proposal.actions).map(({ chainId, actions }) => (
                    <div key={`${proposal.proposal_id}-${chainId}`} className="text-xs">
                      <p className="font-medium">{CHAINS[chainId].displayName}</p>
                      <ul className="list-disc ml-4 text-muted-foreground">
                        {actions.map((action, index) => (
                          <li key={index}>
                            <span className="font-semibold">{action.type}</span> — {action.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [data, error, loading, proposals, refetch]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Cross-Chain Governance
          </CardTitle>
          <Badge variant="outline">Plan A · Aptos</Badge>
        </div>
        <CardDescription>
          Preview which chains each proposal would touch. Additional networks can
          slot in without touching this component.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

function groupActionsByChain(actions: ChainAction[]) {
  const groups: Record<ChainId, ChainAction[]> = {} as Record<ChainId, ChainAction[]>;
  actions.forEach(action => {
    groups[action.chainId] = groups[action.chainId] || [];
    groups[action.chainId].push(action);
  });

  return Object.entries(groups).map(([chainId, actionList]) => ({
    chainId: chainId as ChainId,
    actions: actionList,
  }));
}

