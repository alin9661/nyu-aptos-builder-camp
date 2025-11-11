'use client';

import React, { useState } from 'react';
import { Copy, ExternalLink, Check, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatAddress, getExplorerUrl, copyToClipboard } from '@/lib/api/wallet';

interface AddressDisplayProps {
  address: string;
  format?: 'short' | 'full';
  copyable?: boolean;
  linkToExplorer?: boolean;
  showQR?: boolean;
  network?: string;
  className?: string;
}

export function AddressDisplay({
  address,
  format = 'short',
  copyable = true,
  linkToExplorer = false,
  showQR = false,
  network = 'testnet',
  className,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayAddress = format === 'short' ? formatAddress(address) : address;
  const explorerUrl = getExplorerUrl(address, network);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExplorerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <code className="relative rounded bg-muted px-2 py-1 font-mono text-sm">
        {displayAddress}
      </code>

      {copyable && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              className="h-7 w-7"
              aria-label="Copy address"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? 'Copied!' : 'Copy address'}
          </TooltipContent>
        </Tooltip>
      )}

      {linkToExplorer && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleExplorerClick}
              className="h-7 w-7"
              aria-label="View in explorer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View in explorer</TooltipContent>
        </Tooltip>
      )}

      {showQR && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7"
              aria-label="Show QR code"
            >
              <QrCode className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet Address QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG address={address} />
              </div>
              <div className="w-full space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code to get the wallet address
                </p>
                <code className="block w-full break-all rounded bg-muted p-2 text-xs font-mono">
                  {address}
                </code>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Simple QR Code SVG component (basic implementation)
function QRCodeSVG({ address }: { address: string }) {
  // This is a placeholder. In production, use a library like qrcode.react
  // For now, display a simple grid pattern
  return (
    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
      <p className="text-xs text-center px-4">
        QR Code for:<br />
        <span className="font-mono text-[10px] break-all">{formatAddress(address, 6)}</span>
      </p>
    </div>
  );
}
