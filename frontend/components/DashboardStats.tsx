'use client';

import { useTreasuryBalance, useTreasuryStats } from '@/hooks/useTreasury';
import { useProposalStats } from '@/hooks/useProposals';
import { useGovernanceStats } from '@/hooks/useGovernance';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, FileText, Vote, Users } from 'lucide-react';

export function DashboardStats() {
  const { data: balance, loading: balanceLoading } = useTreasuryBalance(true);
  const { data: treasuryStats, loading: treasuryLoading } = useTreasuryStats(true);
  const { data: proposalStats, loading: proposalLoading } = useProposalStats(true);
  const { data: governanceStats, loading: governanceLoading } = useGovernanceStats(true);

  const loading = balanceLoading || treasuryLoading || proposalLoading || governanceLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Treasury Balance Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Treasury Balance
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {balance?.balanceFormatted || '0 APT'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {treasuryStats?.deposits.depositCount || 0} deposits
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total Deposits: {treasuryStats?.deposits.totalDepositsFormatted || '0 APT'}
          </div>
          <div className="text-muted-foreground">
            From sponsors and merchandise sales
          </div>
        </CardFooter>
      </Card>

      {/* Reimbursements Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reimbursements
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {treasuryStats?.reimbursements.totalRequests || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {treasuryStats?.reimbursements.pendingRequests || 0} pending
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Paid: {treasuryStats?.reimbursements.totalPaidFormatted || '0 APT'}
          </div>
          <div className="text-muted-foreground">
            Pending: {treasuryStats?.reimbursements.totalPendingFormatted || '0 APT'}
          </div>
        </CardFooter>
      </Card>

      {/* Proposals Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            Proposals
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {proposalStats?.proposals.total || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {proposalStats?.proposals.active || 0} active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Passed: {proposalStats?.proposals.passed || 0} |
            Rejected: {proposalStats?.proposals.rejected || 0}
          </div>
          <div className="text-muted-foreground">
            Total votes: {proposalStats?.votes.totalVotes || 0}
          </div>
        </CardFooter>
      </Card>

      {/* Elections Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Elections
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {governanceStats?.elections.total || 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {governanceStats?.elections.active || 0} active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Finalized: {governanceStats?.elections.finalized || 0}
          </div>
          <div className="text-muted-foreground">
            Unique voters: {governanceStats?.votes.uniqueVoters || 0}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
