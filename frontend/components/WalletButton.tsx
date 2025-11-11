'use client';

import { useWallet } from '@/lib/wallet/WalletProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, Copy, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { WalletName, WalletReadyState } from '@/lib/types/wallet';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function WalletButton() {
  const {
    connected,
    connecting,
    account,
    network,
    wallet,
    wallets,
    select,
    connect,
    disconnect,
  } = useWallet();
  const [copied, setCopied] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleWalletSelect = async (walletName: WalletName) => {
    try {
      setError(null);
      select(walletName);
      await connect();
      setWalletModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
    }
  };

  const getWalletIcon = (walletName: WalletName) => {
    const icons: Record<WalletName, string> = {
      [WalletName.Petra]: '🪨',
      [WalletName.Martian]: '👽',
      [WalletName.Pontem]: '🌉',
      [WalletName.Nightly]: '🌙',
      [WalletName.WalletConnect]: '🔗',
    };
    return icons[walletName] || '💼';
  };

  const getNetworkColor = (networkName?: string) => {
    switch (networkName?.toLowerCase()) {
      case 'mainnet':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'testnet':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300';
      case 'devnet':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Not connected state
  if (!connected) {
    return (
      <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
        <DialogTrigger asChild>
          <Button
            disabled={connecting}
            variant="default"
            className="gap-2"
          >
            <Wallet className="h-4 w-4" />
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to Nexus
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3 py-4">
            {wallets
              .filter((w) => w.readyState !== WalletReadyState.Unsupported)
              .map((walletAdapter) => (
                <Button
                  key={walletAdapter.name}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => handleWalletSelect(walletAdapter.name)}
                  disabled={connecting}
                >
                  <span className="text-2xl">{getWalletIcon(walletAdapter.name)}</span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{walletAdapter.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {walletAdapter.readyState === WalletReadyState.Installed
                        ? 'Ready to connect'
                        : 'Not installed'}
                    </div>
                  </div>
                  {walletAdapter.readyState === WalletReadyState.NotDetected && (
                    <a
                      href={walletAdapter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </Button>
              ))}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Don't have a wallet? Click the link icon to install one.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Connected state
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span className="text-lg">{wallet ? getWalletIcon(wallet.name) : '💼'}</span>
          <div className="flex flex-col items-start">
            <span className="text-xs leading-none">
              {account?.address ? formatAddress(account.address) : 'Connected'}
            </span>
            {network && (
              <span
                className={`text-[10px] leading-none mt-0.5 px-1 rounded ${getNetworkColor(
                  network.name
                )}`}
              >
                {network.name}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <span className="text-lg">{wallet ? getWalletIcon(wallet.name) : '💼'}</span>
            <span>{wallet?.name || 'My Wallet'}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-2 space-y-3">
          {/* Address */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Address</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                {account?.address || 'N/A'}
              </code>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleCopyAddress();
                }}
                className="p-1.5 hover:bg-accent rounded transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Network */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Network</span>
            <div
              className={`text-xs px-2 py-1 rounded inline-block ${getNetworkColor(
                network?.name
              )}`}
            >
              {network?.name || 'Unknown'}
            </div>
          </div>

          {/* Chain ID */}
          {network?.chainId && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Chain ID</span>
              <div className="text-xs bg-muted px-2 py-1 rounded">
                {network.chainId}
              </div>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
