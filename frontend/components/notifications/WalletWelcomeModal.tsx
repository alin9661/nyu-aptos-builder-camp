'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Copy, ExternalLink, Shield, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

interface WalletWelcomeModalProps {
  open: boolean
  onClose: () => void
  walletAddress: string
  network: 'testnet' | 'mainnet'
}

export function WalletWelcomeModal({
  open,
  onClose,
  walletAddress,
  network,
}: WalletWelcomeModalProps) {
  const [activeTab, setActiveTab] = React.useState('overview')
  const explorerUrl = `https://explorer.aptoslabs.com/account/${walletAddress}?network=${network}`

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    toast.success('Wallet address copied to clipboard')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Welcome to NYU Nexus!</DialogTitle>
              <DialogDescription>Your Aptos Wallet is Ready</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet Address Display */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">Your Wallet Address</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background p-3 text-xs font-mono break-all">
                {walletAddress}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={copyAddress}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {network.toUpperCase()}
              </span>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Educational Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">What is this?</h3>
                <p className="text-sm text-muted-foreground">
                  You've been automatically assigned an Aptos blockchain wallet as part of NYU's
                  decentralized governance initiative. This wallet allows you to participate in
                  on-chain governance, submit reimbursement requests, and vote on proposals.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-2">What is Aptos?</h3>
                <p className="text-sm text-muted-foreground">
                  Aptos is a next-generation blockchain platform designed for safety, speed, and
                  reliability. It provides a secure and transparent way to manage digital assets
                  and execute smart contracts.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Key Benefits</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Vote on governance proposals democratically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Submit and approve reimbursement requests transparently</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>View all transactions on the public blockchain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Participate in treasury management decisions</span>
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Your Wallet is Secure</h3>
                    <p className="text-sm text-muted-foreground">
                      Your private key is encrypted using AES-256-GCM encryption and stored
                      securely on our servers. We manage your wallet for you, so you don't need to
                      worry about losing your keys.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Security Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Military-grade AES-256 encryption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>NYU SSO authentication required for all transactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Automatic encrypted backups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Comprehensive audit logging</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
                <h3 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-500">
                  Best Practices
                </h3>
                <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-600">
                  <li>• Never share your NYU SSO credentials with anyone</li>
                  <li>• Always verify transaction details before confirming</li>
                  <li>• Only access NYU Nexus through official NYU domains</li>
                  <li>• Report any suspicious activity immediately</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">What You Can Do</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <span className="text-sm font-semibold text-primary">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">View Your Wallet</h4>
                      <p className="text-xs text-muted-foreground">
                        Check your balance and transaction history anytime
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <span className="text-sm font-semibold text-primary">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Participate in Governance</h4>
                      <p className="text-xs text-muted-foreground">
                        Vote on proposals and shape the future of NYU Nexus
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <span className="text-sm font-semibold text-primary">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Submit Reimbursements</h4>
                      <p className="text-xs text-muted-foreground">
                        Request reimbursements for approved expenses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <span className="text-sm font-semibold text-primary">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Track Everything</h4>
                      <p className="text-xs text-muted-foreground">
                        All transactions are recorded transparently on the blockchain
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-semibold mb-3">Getting Started</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Here's what to do next:
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Explore the dashboard to see current proposals and treasury status</li>
                  <li>Check out the wallet page to view your balance</li>
                  <li>Review any pending governance votes</li>
                  <li>Read the documentation to learn more about the platform</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => window.open('/docs', '_blank')}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Learn More
          </Button>
          <Button onClick={onClose}>Got It!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
