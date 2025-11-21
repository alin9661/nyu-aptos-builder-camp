'use client';

import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TreasuryBalance } from '@/components/TreasuryBalance';
import { CrossChainTreasuryOverview } from '@/components/treasury/CrossChainTreasuryOverview';
import { ReimbursementForm } from '@/components/treasury/ReimbursementForm';
import { ApprovalWorkflow } from '@/components/treasury/ApprovalWorkflow';
import { ReceiptViewer } from '@/components/treasury/ReceiptViewer';
import { useReimbursements, useTreasuryStats, useReimbursementDetails } from '@/hooks/useTreasury';
import { approveReimbursement } from '@/lib/api/treasury';
import { toast } from '@/components/ui/toast';
import {
  Wallet,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  FileText,
} from 'lucide-react';

export default function TreasuryPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  // Fetch data
  const { data: reimbursementsData, loading: reimbursementsLoading, refetch: refetchReimbursements } = useReimbursements({ page: 1, limit: 20 });
  const { data: statsData, loading: statsLoading } = useTreasuryStats(true, 60000);
  const { data: selectedRequest, loading: requestLoading } = useReimbursementDetails(selectedRequestId);

  // Mock user role for demo - in production, get from auth context
  const userRole = 'treasurer'; // 'member' | 'treasurer' | 'admin'
  const isApprover = userRole === 'treasurer' || userRole === 'admin';
  const canSubmit = true; // All authenticated users can submit

  const handleNewRequest = () => {
    setShowNewRequestForm(true);
    setActiveTab('submit');
  };

  const handleRequestSuccess = () => {
    setShowNewRequestForm(false);
    setActiveTab('overview');
    refetchReimbursements();
    toast.success('Reimbursement request submitted successfully!');
  };

  const handleApprove = async (id: number) => {
    try {
      // In production, this would call the blockchain
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      const response = await approveReimbursement(id, mockTxHash);

      if (response.success) {
        toast.success('Reimbursement approved successfully!');
        refetchReimbursements();
      } else {
        toast.error(response.error || 'Failed to approve reimbursement');
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleReject = async (id: number) => {
    // Rejection logic would go here
    toast.error('Rejection functionality not yet implemented');
  };

  const pendingRequests = reimbursementsData?.requests.filter((r) => !r.paid_out) || [];
  const approvedRequests = reimbursementsData?.requests.filter((r) => r.paid_out) || [];

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Page Header */}
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Treasury Management</h1>
                    <p className="text-muted-foreground mt-1">
                      Manage reimbursements and track treasury activity
                    </p>
                  </div>
                  {canSubmit && (
                    <Button onClick={handleNewRequest}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Request
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Main Content Tabs */}
              <div className="px-4 lg:px-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending
                      {pendingRequests.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {pendingRequests.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="submit">Submit Request</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <CrossChainTreasuryOverview />
                    {/* Treasury Balance */}
                    <TreasuryBalance autoRefresh={true} refreshInterval={30000} />

                    {/* Statistics Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {statsData?.reimbursements.totalRequests || 0}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pending</CardTitle>
                          <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {statsData?.reimbursements.pendingRequests || 0}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {statsData?.reimbursements.totalPendingFormatted || '0 APT'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Approved</CardTitle>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {statsData?.reimbursements.paidRequests || 0}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {statsData?.reimbursements.totalPaidFormatted || '0 APT'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {statsData?.reimbursements.totalPaidFormatted || '0 APT'}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Requests</CardTitle>
                        <CardDescription>Latest reimbursement requests</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Payee</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reimbursementsData?.requests.slice(0, 5).map((request) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">#{request.id}</TableCell>
                                <TableCell>
                                  {request.payee_name || request.payee.slice(0, 8) + '...'}
                                </TableCell>
                                <TableCell>{request.amountFormatted}</TableCell>
                                <TableCell>
                                  <Badge variant={request.paid_out ? 'default' : 'secondary'}>
                                    {request.paid_out ? 'Paid' : 'Pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(request.created_ts).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequestId(request.id);
                                      setActiveTab('pending');
                                    }}
                                  >
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Pending Approvals Tab */}
                  <TabsContent value="pending" className="space-y-4 mt-4">
                    {isApprover && pendingRequests.length > 0 && (
                      <Card className="border-primary">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Pending Your Approval
                          </CardTitle>
                          <CardDescription>
                            {pendingRequests.length} request(s) awaiting approval
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}

                    <div className="grid gap-4">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="grid gap-4 lg:grid-cols-2">
                          <ApprovalWorkflow
                            reimbursement={{
                              ...request,
                              approvals: [],
                            }}
                            requiredApprovals={3}
                            isApprover={isApprover}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                          <ReceiptViewer
                            ipfsHash={request.id.toString()}
                            fileName={`receipt-${request.id}.pdf`}
                            fileSize={125000}
                            mimeType="application/pdf"
                          />
                        </div>
                      ))}

                      {pendingRequests.length === 0 && (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center py-8 text-muted-foreground">
                              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No pending reimbursement requests</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* History Tab */}
                  <TabsContent value="history" className="space-y-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Approved Reimbursements</CardTitle>
                        <CardDescription>
                          All approved and paid out reimbursements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Payee</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Paid Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {approvedRequests.map((request) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">#{request.id}</TableCell>
                                <TableCell>
                                  {request.payee_name || request.payee.slice(0, 8) + '...'}
                                </TableCell>
                                <TableCell>{request.amountFormatted}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {request.description}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {request.payout_ts
                                    ? new Date(request.payout_ts).toLocaleDateString()
                                    : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {approvedRequests.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No approved reimbursements yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Submit Request Tab */}
                  <TabsContent value="submit" className="mt-4">
                    {canSubmit ? (
                      <ReimbursementForm
                        onSuccess={handleRequestSuccess}
                        onCancel={() => setActiveTab('overview')}
                      />
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center py-8">
                            <XCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">
                              You don't have permission to submit reimbursement requests
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
