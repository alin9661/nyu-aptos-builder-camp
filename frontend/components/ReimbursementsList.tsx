'use client';

import { useState } from 'react';
import { useReimbursements } from '@/hooks/useTreasury';
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
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReimbursementsListProps {
  pageSize?: number;
  showPagination?: boolean;
}

export function ReimbursementsList({
  pageSize = 10,
  showPagination = true,
}: ReimbursementsListProps) {
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useReimbursements({
    page,
    limit: pageSize,
    sort: 'desc',
  });

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reimbursement Requests
          </CardTitle>
          <CardDescription>Recent reimbursement requests</CardDescription>
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
            <FileText className="h-5 w-5" />
            Reimbursement Requests
          </CardTitle>
          <CardDescription>Recent reimbursement requests</CardDescription>
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

  if (!data || !data.requests || data.requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reimbursement Requests
          </CardTitle>
          <CardDescription>Recent reimbursement requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No reimbursement requests found.</div>
        </CardContent>
      </Card>
    );
  }

  const { requests, pagination } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Reimbursement Requests
        </CardTitle>
        <CardDescription>
          Showing {requests.length} of {pagination.total} requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">#{request.id}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request.payer_name || request.payer.slice(0, 8) + '...'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request.payee_name || request.payee.slice(0, 8) + '...'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{request.amountFormatted}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm">
                      {request.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={request.paid_out ? 'default' : 'secondary'}>
                      {request.paid_out ? 'Paid' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(request.created_ts).toLocaleDateString()}
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
