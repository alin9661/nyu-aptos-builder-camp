'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { ReimbursementDetails, Approval } from '@/lib/types/api';
import { TransactionModal } from './TransactionModal';

interface ApprovalWorkflowProps {
  reimbursement: ReimbursementDetails;
  requiredApprovals?: number;
  isApprover?: boolean;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number) => Promise<void>;
}

export function ApprovalWorkflow({
  reimbursement,
  requiredApprovals = 3,
  isApprover = false,
  onApprove,
  onReject,
}: ApprovalWorkflowProps) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const currentApprovals = reimbursement.approvals?.length || 0;
  const approvalProgress = (currentApprovals / requiredApprovals) * 100;
  const isFullyApproved = currentApprovals >= requiredApprovals;
  const isPending = !reimbursement.paid_out && !isFullyApproved;

  const handleApprove = async () => {
    if (onApprove) {
      await onApprove(reimbursement.id);
      setShowApproveModal(false);
    }
  };

  const handleReject = async () => {
    if (onReject) {
      await onReject(reimbursement.id);
      setShowRejectModal(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Approval Workflow
                {isFullyApproved && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </CardTitle>
              <CardDescription>
                Multi-step approval process for reimbursement #{reimbursement.id}
              </CardDescription>
            </div>
            {isPending && isApprover && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(true)}
                >
                  Reject
                </Button>
                <Button size="sm" onClick={() => setShowApproveModal(true)}>
                  Approve
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Approval Progress</span>
              <span className="text-muted-foreground">
                {currentApprovals} of {requiredApprovals} approvals
              </span>
            </div>
            <Progress value={approvalProgress} />
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {reimbursement.paid_out ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Paid Out
              </Badge>
            ) : isFullyApproved ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Approved
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                Pending Approval
              </Badge>
            )}
          </div>

          {/* Reimbursement Details */}
          <div className="space-y-2 rounded-lg border p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="text-lg font-semibold">{reimbursement.amountFormatted}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payee</p>
                <p className="text-sm truncate">
                  {reimbursement.payee_name || reimbursement.payee}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{reimbursement.description}</p>
              </div>
            </div>
          </div>

          {/* Approval History */}
          {reimbursement.approvals && reimbursement.approvals.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Approval History</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Approver</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reimbursement.approvals.map((approval: Approval, index: number) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            {approval.approver_name || approval.approver.slice(0, 8) + '...'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(approval.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://explorer.aptoslabs.com/txn/${approval.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {approval.transaction_hash.slice(0, 8)}...
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Circle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No approvals yet</p>
            </div>
          )}

          {/* Pending Approvers */}
          {isPending && (
            <div className="rounded-lg border border-dashed p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  Waiting for {requiredApprovals - currentApprovals} more approval(s)
                </span>
              </div>
              {isApprover && (
                <p className="text-sm text-muted-foreground">
                  You are authorized to approve this request
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <TransactionModal
        open={showApproveModal}
        onOpenChange={setShowApproveModal}
        title="Approve Reimbursement"
        description="Confirm that you want to approve this reimbursement request"
        action="approve"
        amount={reimbursement.amountFormatted}
        onConfirm={handleApprove}
      />

      {/* Reject Modal */}
      <TransactionModal
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
        title="Reject Reimbursement"
        description="Are you sure you want to reject this reimbursement request? This action cannot be undone."
        action="reject"
        amount={reimbursement.amountFormatted}
        onConfirm={handleReject}
        variant="destructive"
      />
    </>
  );
}

export function ApprovalWorkflowSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Workflow</CardTitle>
        <CardDescription>Loading approval workflow...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}
