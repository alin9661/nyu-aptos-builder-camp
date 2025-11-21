'use client';

import { useState, useMemo } from 'react';
import { useElections } from '@/hooks/useGovernance';
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
import { Vote, ChevronLeft, ChevronRight, Users } from 'lucide-react';

interface ElectionsListProps {
  pageSize?: number;
  showPagination?: boolean;
  filterRole?: string;
  filterStatus?: 'finalized' | 'active';
}

export function ElectionsList({
  pageSize = 10,
  showPagination = true,
  filterRole,
  filterStatus,
}: ElectionsListProps) {
  const [page, setPage] = useState(1);

  // Stabilize filters object to prevent infinite re-renders
  const electionFilters = useMemo(() => ({
    page,
    limit: pageSize,
    sort: 'desc' as const,
    role: filterRole,
    status: filterStatus,
  }), [page, pageSize, filterRole, filterStatus]);

  const { data, loading, error, refetch } = useElections(electionFilters);

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Elections
          </CardTitle>
          <CardDescription>Recent elections and voting results</CardDescription>
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
            <Vote className="h-5 w-5" />
            Elections
          </CardTitle>
          <CardDescription>Recent elections and voting results</CardDescription>
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

  if (!data || !data.elections || data.elections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Elections
          </CardTitle>
          <CardDescription>Recent elections and voting results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No elections found.</div>
        </CardContent>
      </Card>
    );
  }

  const { elections, pagination } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Vote className="h-5 w-5" />
          Elections
        </CardTitle>
        <CardDescription>
          Showing {elections.length} of {pagination.total} elections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Candidates</TableHead>
                <TableHead>Winner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elections.map((election) => (
                <TableRow key={`${election.election_id}-${election.role_name}`}>
                  <TableCell className="font-medium">
                    #{election.election_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{election.role_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{election.candidates.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {election.winner_name ? (
                      <div className="text-sm">{election.winner_name}</div>
                    ) : (
                      <span className="text-muted-foreground text-sm">TBD</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={election.finalized ? 'default' : 'secondary'}>
                      {election.finalized ? 'Finalized' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(election.start_ts).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(election.end_ts).toLocaleDateString()}
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
