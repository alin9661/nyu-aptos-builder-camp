'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, Check, Clock, User, DollarSign } from 'lucide-react';
import { getReimbursementDetails } from '@/lib/api/treasury';
import { ReimbursementDetails } from '@/lib/types/api';
import { useFormattedDateTime } from '@/lib/utils/dateFormat';
import { getCoinSymbol } from '@/lib/api/aptos';

export default function ReimbursementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [reimbursement, setReimbursement] = useState<ReimbursementDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        setError(null);
        const response = await getReimbursementDetails(parseInt(id));

        if (response.success && response.data) {
          setReimbursement(response.data);
        } else {
          setError(response.error || 'Failed to fetch reimbursement details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !reimbursement) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error || 'Reimbursement not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const approvalCount = reimbursement.approvals?.length || 0;
  const requiredApprovals = 3; // Advisor, President, VP

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Reimbursement #{reimbursement.id}</h1>
            <p className="text-sm text-muted-foreground">
              Submitted {new Date(reimbursement.created_ts).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant={reimbursement.paid_out ? 'default' : 'secondary'} className="text-sm">
          {reimbursement.paid_out ? 'Paid' : 'Pending'}
        </Badge>
      </div>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>Reimbursement information and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Payee</span>
              </div>
              <p className="text-sm font-medium">
                {reimbursement.payee_name || reimbursement.payee}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Amount</span>
              </div>
              <p className="text-lg font-bold">{reimbursement.amountFormatted}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Description</div>
            <p className="text-sm">{reimbursement.description}</p>
          </div>

          {reimbursement.payout_ts && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Paid On</div>
              <p className="text-sm font-medium">
                {new Date(reimbursement.payout_ts).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Progress</CardTitle>
          <CardDescription>
            {approvalCount} of {requiredApprovals} required approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {Math.round((approvalCount / requiredApprovals) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(approvalCount / requiredApprovals) * 100}%` }}
              />
            </div>
          </div>

          {/* Approval List */}
          <div className="space-y-3">
            {reimbursement.approvals && reimbursement.approvals.length > 0 ? (
              reimbursement.approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="mt-0.5 rounded-full bg-green-100 p-1 dark:bg-green-900">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {approval.approver_name || approval.approver.slice(0, 12) + '...'}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Approved
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(approval.timestamp).toLocaleString()}
                    </p>
                    {approval.transaction_hash && (
                      <p className="text-xs text-muted-foreground">
                        TX: {approval.transaction_hash.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Awaiting approval from leadership
                </p>
              </div>
            )}
          </div>

          {/* Pending Approvals */}
          {approvalCount < requiredApprovals && (
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Status:</strong> Pending{' '}
                {requiredApprovals - approvalCount} more approval(s) from:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Club Advisor</li>
                <li>• President</li>
                <li>• VP of Finance</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Attachment */}
      {reimbursement.ipfs_hash && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Attachment</CardTitle>
            <CardDescription>Supporting documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {reimbursement.file_name || 'invoice.pdf'}
                </p>
                {reimbursement.file_size && (
                  <p className="text-xs text-muted-foreground">
                    {(reimbursement.file_size / 1024).toFixed(2)} KB
                    {reimbursement.mime_type && ` • ${reimbursement.mime_type}`}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  IPFS: {reimbursement.ipfs_hash.slice(0, 16)}...
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://ipfs.io/ipfs/${reimbursement.ipfs_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
