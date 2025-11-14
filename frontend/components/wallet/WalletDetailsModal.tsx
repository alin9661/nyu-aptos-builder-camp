'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ExternalLink,
  Download,
  Shield,
  Clock,
  Network,
  Key,
  BookOpen,
  History,
  Lock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AddressDisplay } from './AddressDisplay';
import {
  formatBalance,
  getExplorerUrl,
  getWalletTransactions,
  exportWalletInfo,
  getTransactionExplorerUrl,
  WalletTransaction,
} from '@/lib/api/wallet';
import { AptosWallet } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WalletDetailsModalProps {
  wallet: AptosWallet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletDetailsModal({
  wallet,
  open,
  onOpenChange,
}: WalletDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const handleExportWallet = async () => {
    try {
      const exportData = await exportWalletInfo();
      if (exportData) {
        // Create a downloadable JSON file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `wallet-backup-${wallet.address.substring(0, 8)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Wallet Info Exported',
          description: 'Your wallet information has been downloaded.',
        });
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export wallet information.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>Wallet Details</DialogTitle>
              <DialogDescription>
                Complete information about your Aptos wallet
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <Wallet className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <History className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="education">
              <BookOpen className="h-4 w-4" />
              Learn
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2">
            <TabsContent value="overview" className="mt-4 space-y-4">
              <OverviewTab wallet={wallet} onExport={handleExportWallet} />
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <TransactionsTab wallet={wallet} />
            </TabsContent>

            <TabsContent value="security" className="mt-4 space-y-4">
              <SecurityTab wallet={wallet} />
            </TabsContent>

            <TabsContent value="education" className="mt-4 space-y-4">
              <EducationTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Overview Tab Component
function OverviewTab({
  wallet,
  onExport,
}: {
  wallet: AptosWallet;
  onExport: () => void;
}) {
  const explorerUrl = getExplorerUrl(wallet.address, wallet.network);

  return (
    <div className="space-y-4">
      {/* Wallet Address */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Wallet Address
        </Label>
        <AddressDisplay
          address={wallet.address}
          format="full"
          copyable
          showQR
          linkToExplorer
          network={wallet.network}
          className="flex-wrap"
        />
      </div>

      <Separator />

      {/* Public Key */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Key className="h-4 w-4" />
          Public Key
        </Label>
        <AddressDisplay
          address={wallet.publicKey}
          format="full"
          copyable
          className="flex-wrap"
        />
      </div>

      <Separator />

      {/* Network & Balance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network
          </Label>
          <Badge variant="outline" className="capitalize">
            {wallet.network}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Balance</Label>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {formatBalance(wallet.balance || '0')}
            </span>
            <span className="text-sm text-muted-foreground">APT</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Creation Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Created
        </Label>
        <p className="text-sm">
          {new Date(wallet.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.open(explorerUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
          View in Explorer
        </Button>
        <Button variant="outline" className="flex-1" onClick={onExport}>
          <Download className="h-4 w-4" />
          Download Info
        </Button>
      </div>
    </div>
  );
}

// Transactions Tab Component
function TransactionsTab({ wallet }: { wallet: AptosWallet }) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  useEffect(() => {
    fetchTransactions();
  }, [wallet.address]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const txs = await getWalletTransactions(wallet.address);
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'sent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('sent')}
        >
          Sent
        </Button>
        <Button
          variant={filter === 'received' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('received')}
        >
          Received
        </Button>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No transactions yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => (
            <TransactionItem
              key={tx.hash}
              transaction={tx}
              network={wallet.network}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionItem({
  transaction,
  network,
}: {
  transaction: WalletTransaction;
  network: string;
}) {
  const explorerUrl = getTransactionExplorerUrl(transaction.hash, network);

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge
            variant={transaction.type === 'sent' ? 'destructive' : 'default'}
            className="text-xs"
          >
            {transaction.type}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {transaction.status}
          </Badge>
        </div>
        <code className="text-xs text-muted-foreground">
          {transaction.hash.substring(0, 16)}...
        </code>
        <p className="text-xs text-muted-foreground">
          {new Date(transaction.timestamp).toLocaleString()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium">
          {transaction.type === 'sent' ? '-' : '+'}
          {formatBalance(transaction.amount)} APT
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => window.open(explorerUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Security Tab Component
function SecurityTab({ wallet }: { wallet: AptosWallet }) {
  return (
    <div className="space-y-4">
      {/* Encryption Method */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">Encryption Method</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Your private keys are encrypted using AES-256-GCM, a military-grade encryption standard.
        </p>
      </div>

      {/* Storage Location */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Secure Storage</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Keys are stored in a secure, encrypted database with access controls and audit logging.
        </p>
      </div>

      {/* Custodial Wallet Notice */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-4">
        <div className="flex gap-3">
          <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-yellow-900 dark:text-yellow-100">
              Custodial Wallet
            </p>
            <p className="text-yellow-800 dark:text-yellow-200">
              This is a custodial wallet, meaning we manage your private keys securely on your behalf.
              You cannot export your private keys, but you can always access your wallet through this platform.
            </p>
          </div>
        </div>
      </div>

      {/* Security Best Practices */}
      <div className="space-y-3">
        <h3 className="font-semibold">Security Best Practices</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span>•</span>
            <span>Always verify transaction details before approving</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Keep your account password secure and unique</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Enable two-factor authentication on your account</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Never share your account credentials with anyone</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Regularly review your transaction history</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Education Tab Component
function EducationTab() {
  return (
    <div className="space-y-4">
      {/* What is Aptos */}
      <section className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          What is Aptos?
        </h3>
        <p className="text-sm text-muted-foreground">
          Aptos is a layer 1 blockchain built for safety and scalability. It uses the Move programming
          language, designed for secure smart contract development.
        </p>
      </section>

      <Separator />

      {/* How to Use Your Wallet */}
      <section className="space-y-2">
        <h3 className="font-semibold">How to Use Your Wallet</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-semibold">1.</span>
            <span><strong>Receive Funds:</strong> Share your wallet address with others</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">2.</span>
            <span><strong>Vote on Proposals:</strong> Participate in governance decisions</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">3.</span>
            <span><strong>Request Reimbursements:</strong> Submit expense claims to the DAO</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">4.</span>
            <span><strong>View Transactions:</strong> Monitor your wallet activity in the Transactions tab</span>
          </li>
        </ul>
      </section>

      <Separator />

      {/* Resources */}
      <section className="space-y-3">
        <h3 className="font-semibold">Learn More</h3>
        <div className="grid gap-2">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => window.open('https://aptos.dev/', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Aptos Documentation
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => window.open('https://explorer.aptoslabs.com/', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Aptos Explorer
          </Button>
        </div>
      </section>
    </div>
  );
}
