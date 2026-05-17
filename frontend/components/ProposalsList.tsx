'use client';

import { useState, useMemo } from 'react';
import { useProposals } from '@/hooks/useProposals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileCheck, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ProposalsListProps {
  pageSize?: number;
  showPagination?: boolean;
  filterStatus?: number;
  filterCreator?: string;
}

export function ProposalsList({
  pageSize = 10,
  showPagination = true,
  filterStatus,
  filterCreator,
}: ProposalsListProps) {
  const [page, setPage] = useState(1);

  // Stabilize filters object to prevent infinite re-renders
  const proposalFilters = useMemo(() => ({
    page,
    limit: pageSize,
    sort: 'desc' as const,
    status: filterStatus,
    creator: filterCreator,
  }), [page, pageSize, filterStatus, filterCreator]);

  const { data, loading, error, refetch } = useProposals(proposalFilters);

  const getStatusVariant = (statusName: string) => {
    switch (statusName.toLowerCase()) {
      case 'active':
        return 'default';
      case 'passed':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'executed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Proposals
          </CardTitle>
          <CardDescription>Recent proposals and voting status</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Proposals
          </CardTitle>
          <CardDescription>Recent proposals and voting status</CardDescription>
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

  if (!data || !data.proposals || data.proposals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Proposals
          </CardTitle>
          <CardDescription>Recent proposals and voting status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No proposals found.</div>
        </CardContent>
      </Card>
    );
  }

  const { proposals, pagination } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Proposals
        </CardTitle>
        <CardDescription>
          Showing {proposals.length} of {pagination.total} proposals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Voters</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.proposal_id}>
                  <TableCell className="font-medium">
                    #{proposal.proposal_id}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate font-medium">
                      {proposal.title}
                    </div>
                    <div className="max-w-xs truncate text-xs text-muted-foreground">
                      {proposal.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {proposal.creator_name || proposal.creator.slice(0, 8) + '...'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(proposal.statusName)}>
                      {proposal.statusName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-green-600">
                        <ThumbsUp className="h-3 w-3" />
                        <span className="text-sm">{proposal.voteStats.yayVoters}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <ThumbsDown className="h-3 w-3" />
                        <span className="text-sm">{proposal.voteStats.nayVoters}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {proposal.voteStats.totalVoters}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(proposal.start_ts).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(proposal.end_ts).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {showPagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
