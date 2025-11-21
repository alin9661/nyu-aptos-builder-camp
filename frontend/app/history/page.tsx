'use client';

import { useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  History as HistoryIcon,
  Search, 
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Vote,
  Users,
  Wallet
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'reimbursement' | 'election' | 'proposal' | 'transfer' | 'wallet';
  action: string;
  description: string;
  amount?: string;
  user: string;
  organization: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

const mockHistory: ActivityItem[] = [
  {
    id: '1',
    type: 'transfer',
    action: 'Funds Received',
    description: 'Received treasury funding from Alumni Network',
    amount: '15,000 APT',
    user: 'Alice Johnson',
    organization: 'NYU Blockchain Club',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'success',
  },
  {
    id: '2',
    type: 'reimbursement',
    action: 'Reimbursement Approved',
    description: 'Conference travel expenses approved and paid',
    amount: '1,250 APT',
    user: 'Bob Smith',
    organization: 'Tech Conference',
    timestamp: '2024-01-14T15:45:00Z',
    status: 'success',
  },
  {
    id: '3',
    type: 'election',
    action: 'Vote Cast',
    description: 'Voted in Q1 2024 leadership election',
    user: 'Carol Williams',
    organization: 'Student Government',
    timestamp: '2024-01-13T09:15:00Z',
    status: 'success',
  },
  {
    id: '4',
    type: 'proposal',
    action: 'Proposal Created',
    description: 'New hackathon funding proposal submitted',
    amount: '5,000 APT',
    user: 'David Brown',
    organization: 'Innovation Lab',
    timestamp: '2024-01-12T14:20:00Z',
    status: 'pending',
  },
];

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredHistory = mockHistory.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.organization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredHistory.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + pageSize);

  const getTypeIcon = (type: string) => {
    const icons = {
      reimbursement: <FileText className="h-4 w-4" />,
      election: <Vote className="h-4 w-4" />,
      proposal: <FileText className="h-4 w-4" />,
      transfer: <ArrowUpRight className="h-4 w-4" />,
      wallet: <Wallet className="h-4 w-4" />,
    };
    return icons[type as keyof typeof icons] || <HistoryIcon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      reimbursement: 'bg-blue-500/10 text-blue-500',
      election: 'bg-purple-500/10 text-purple-500',
      proposal: 'bg-amber-500/10 text-amber-500',
      transfer: 'bg-emerald-500/10 text-emerald-500',
      wallet: 'bg-violet-500/10 text-violet-500',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/10 text-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      success: 'default' as const,
      pending: 'secondary' as const,
      failed: 'destructive' as const,
    };
    return colors[status as keyof typeof colors] || 'outline' as const;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
              <p className="text-muted-foreground mt-1">
                Complete history of all transactions and activities
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockHistory.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  {mockHistory.filter(h => h.status === 'success').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {mockHistory.filter(h => h.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">20,250 APT</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="reimbursement">Reimbursements</SelectItem>
                    <SelectItem value="election">Elections</SelectItem>
                    <SelectItem value="proposal">Proposals</SelectItem>
                    <SelectItem value="transfer">Transfers</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HistoryIcon className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
              <CardDescription>
                Showing {paginatedHistory.length} of {filteredHistory.length} activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className={'flex items-center gap-2 rounded-md px-2 py-1 w-fit ' + getTypeColor(item.type)}>
                            {getTypeIcon(item.type)}
                            <span className="text-xs font-medium capitalize">{item.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.action}</div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.amount && (
                            <div className="font-medium">{item.amount}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{item.user}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
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
        </div>
      </main>
    </div>
  );
}
