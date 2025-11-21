'use client';

import { useState, useEffect } from 'react';
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
import { Building2, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface OrganizationsListProps {
  pageSize?: number;
  showPagination?: boolean;
}

interface Transaction {
  id: string;
  organization: string;
  type: 'reimbursement' | 'election' | 'proposal' | 'transfer';
  amount: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  members: number;
  direction: 'in' | 'out';
}

// Mock data - replace with actual API call
const mockTransactions: Transaction[] = [
  {
    id: '1',
    organization: 'NYU Blockchain Club',
    type: 'reimbursement',
    amount: '1,250 APT',
    date: '2024-01-15',
    status: 'completed',
    members: 12,
    direction: 'out',
  },
  {
    id: '2',
    organization: 'Computer Science Department',
    type: 'transfer',
    amount: '5,000 APT',
    date: '2024-01-14',
    status: 'completed',
    members: 8,
    direction: 'in',
  },
  {
    id: '3',
    organization: 'Student Government',
    type: 'election',
    amount: '500 APT',
    date: '2024-01-13',
    status: 'pending',
    members: 15,
    direction: 'out',
  },
  {
    id: '4',
    organization: 'Innovation Lab',
    type: 'proposal',
    amount: '2,300 APT',
    date: '2024-01-12',
    status: 'completed',
    members: 6,
    direction: 'out',
  },
  {
    id: '5',
    organization: 'Research Fund',
    type: 'transfer',
    amount: '10,000 APT',
    date: '2024-01-11',
    status: 'completed',
    members: 4,
    direction: 'in',
  },
  {
    id: '6',
    organization: 'Tech Conference',
    type: 'reimbursement',
    amount: '3,450 APT',
    date: '2024-01-10',
    status: 'completed',
    members: 20,
    direction: 'out',
  },
  {
    id: '7',
    organization: 'Hackathon Committee',
    type: 'transfer',
    amount: '7,500 APT',
    date: '2024-01-09',
    status: 'pending',
    members: 10,
    direction: 'out',
  },
  {
    id: '8',
    organization: 'Alumni Network',
    type: 'transfer',
    amount: '15,000 APT',
    date: '2024-01-08',
    status: 'completed',
    members: 25,
    direction: 'in',
  },
];

export function OrganizationsList({
  pageSize = 10,
  showPagination = true,
}: OrganizationsListProps) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Simulate pagination
  const totalItems = mockTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTransactions = mockTransactions.slice(startIndex, endIndex);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reimbursement':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case 'election':
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case 'proposal':
        return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
      case 'transfer':
        return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Transactions
          </CardTitle>
          <CardDescription>Track transactions across all organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (currentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Transactions
          </CardTitle>
          <CardDescription>Track transactions across all organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No transactions found.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organization Transactions
        </CardTitle>
        <CardDescription>
          Showing {currentTransactions.length} of {totalItems} transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{transaction.organization}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(transaction.type)}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {transaction.direction === 'in' ? (
                        <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="font-medium">{transaction.amount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {transaction.members} members
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
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
                disabled={page === totalPages}
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
