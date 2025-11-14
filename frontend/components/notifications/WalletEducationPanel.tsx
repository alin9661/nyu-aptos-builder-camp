'use client'

import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ExternalLink, Shield, BookOpen, AlertTriangle, HelpCircle } from 'lucide-react'

interface WalletEducationPanelProps {
  walletAddress: string
  balance: string
  network: 'testnet' | 'mainnet'
}

export function WalletEducationPanel({
  walletAddress,
  balance,
  network,
}: WalletEducationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Education</CardTitle>
        <CardDescription>Learn about your Aptos wallet and blockchain basics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wallet">Your Wallet</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  What is Aptos Blockchain?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Aptos is a Layer 1 blockchain built with safety, scalability, and upgradeability as
                  core principles. It uses the Move programming language, which was originally
                  developed at Facebook (now Meta) for the Diem project. Aptos is designed to support
                  widespread adoption with sub-second finality and high throughput.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">APT Token</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  APT is the native cryptocurrency of the Aptos blockchain. It's used for:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li>Paying transaction fees (gas)</li>
                  <li>Staking for network security</li>
                  <li>Governance voting</li>
                  <li>Accessing on-chain services</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Octas Explained</h3>
                <p className="text-sm text-muted-foreground">
                  Similar to how Bitcoin uses satoshis and Ethereum uses wei, Aptos uses <strong>Octas</strong> as
                  its smallest unit. One APT = 100,000,000 (10^8) Octas. This allows for precise
                  calculations and microtransactions.
                </p>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="font-semibold mb-2 text-primary">How Transactions Work</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>You initiate a transaction through NYU Nexus</li>
                  <li>The transaction is signed with your encrypted private key</li>
                  <li>It's broadcast to the Aptos network</li>
                  <li>Validators verify and include it in a block</li>
                  <li>The transaction is finalized (usually within 1 second)</li>
                  <li>Results are visible on the blockchain explorer</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Gas Fees</h3>
                <p className="text-sm text-muted-foreground">
                  Every transaction on Aptos requires a small gas fee paid in APT. This fee
                  compensates validators for processing your transaction and prevents spam. Gas fees
                  on Aptos are typically very low (often less than $0.01).
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Block Explorers</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Block explorers let you view all transactions, accounts, and smart contracts on the
                  blockchain. Think of it as a search engine for blockchain data.
                </p>
                <a
                  href={`https://explorer.aptoslabs.com/account/${walletAddress}?network=${network}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View your wallet on Aptos Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </TabsContent>

          {/* Your Wallet Tab */}
          <TabsContent value="wallet" className="space-y-4 mt-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Wallet Address</p>
                <code className="block text-xs font-mono break-all bg-muted p-2 rounded">
                  {walletAddress}
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Current Balance</p>
                <p className="text-2xl font-bold">{balance} APT</p>
                <Badge variant="outline" className="mt-1">
                  {network.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Understanding Your Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Your wallet consists of two cryptographic keys:
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-400">
                  Public Key (Address)
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-500">
                  Like your bank account number. Safe to share. Used to receive funds and identify
                  your wallet publicly.
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
                <h4 className="font-medium text-sm mb-2 text-red-900 dark:text-red-400">
                  Private Key
                </h4>
                <p className="text-xs text-red-800 dark:text-red-500">
                  Like your PIN code. Must NEVER be shared. We securely encrypt and manage this for
                  you.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Transaction History</h3>
              <p className="text-sm text-muted-foreground mb-2">
                All your transactions are permanently recorded on the Aptos blockchain. You can view
                them anytime using a block explorer.
              </p>
              <a
                href={`https://explorer.aptoslabs.com/account/${walletAddress}?network=${network}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View transaction history
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2 text-green-900 dark:text-green-400">
                    How We Store Your Keys
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-500">
                    Your private key is encrypted using AES-256-GCM encryption (the same standard used
                    by banks and governments) before being stored. Only your transactions, authorized
                    through NYU SSO, can use this key.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">What You Can Do</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>View your wallet address and balance anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Sign transactions through the NYU Nexus platform</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Participate in governance and reimbursements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>View transaction history on the blockchain explorer</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">What You Cannot Do</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>Export or view your private key (for security reasons)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>Use this wallet in external applications or wallets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>Manually approve transactions outside our platform</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-500">
                    Best Practices
                  </h3>
                  <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-600">
                    <li>• Never share your NYU SSO credentials</li>
                    <li>• Always verify transaction details before confirming</li>
                    <li>• Only access NYU Nexus through official NYU domains</li>
                    <li>• Enable two-factor authentication on your NYU account</li>
                    <li>• Report suspicious activity immediately</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Recovery Options</h3>
              <p className="text-sm text-muted-foreground">
                Since we manage your wallet, you don't need to worry about losing your private keys!
                As long as you can access your NYU SSO account, you can access your wallet. If you
                lose access to your NYU account, contact NYU IT services for account recovery.
              </p>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-3">Official Documentation</h3>
              <div className="space-y-2">
                <a
                  href="https://aptos.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">Aptos Developer Documentation</p>
                    <p className="text-xs text-muted-foreground">
                      Official technical documentation and guides
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
                <a
                  href="https://explorer.aptoslabs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">Aptos Explorer</p>
                    <p className="text-xs text-muted-foreground">
                      View transactions and accounts on-chain
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
                <a
                  href="https://aptoslabs.com/learn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">Aptos Learn</p>
                    <p className="text-xs text-muted-foreground">
                      Educational resources and tutorials
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">NYU Nexus Resources</h3>
              <div className="space-y-2">
                <a
                  href="/docs/getting-started"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">Getting Started Guide</p>
                    <p className="text-xs text-muted-foreground">
                      Learn how to use NYU Nexus
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
                <a
                  href="/docs/wallet-security"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">Wallet Security Guide</p>
                    <p className="text-xs text-muted-foreground">
                      Understand how your wallet is secured
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
                <a
                  href="/support"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">Support Center</p>
                    <p className="text-xs text-muted-foreground">
                      Get help and contact support
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0" />
                </a>
              </div>
            </div>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="mt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span>What is my wallet address?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Your wallet address is: <code className="break-all">{walletAddress}</code>. This is
                  your public identifier on the Aptos blockchain, similar to a bank account number.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-2">
                <AccordionTrigger className="text-left">
                  Can I export my private key?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  No, for security reasons, private keys cannot be exported. We manage your wallet as
                  a custodial service, which means we keep your keys secure so you don't have to worry
                  about losing them.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-3">
                <AccordionTrigger className="text-left">
                  What happens if I lose access to my NYU account?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Since your wallet is tied to your NYU SSO account, you'll need to recover your NYU
                  account access first. Contact NYU IT services for account recovery assistance. Once
                  you regain access to your NYU account, you'll automatically regain access to your
                  wallet.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-4">
                <AccordionTrigger className="text-left">
                  Is my wallet secure?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Yes! Your private key is encrypted using AES-256-GCM encryption (military-grade
                  security) and stored in a secure database. Only authorized transactions through your
                  NYU SSO login can use your wallet. We also maintain encrypted backups and
                  comprehensive audit logs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-5">
                <AccordionTrigger className="text-left">
                  What network is this wallet on?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Your wallet is currently on the Aptos <strong>{network}</strong>. {network === 'testnet'
                    ? 'This is a test network for development and learning purposes. Tokens on testnet have no real-world value.'
                    : 'This is the main Aptos network where tokens have real-world value.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-6">
                <AccordionTrigger className="text-left">
                  How do I get more APT tokens?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {network === 'testnet'
                    ? 'On testnet, you can request tokens from the Aptos faucet. Visit the Aptos Explorer or contact an administrator for assistance.'
                    : 'On mainnet, you can obtain APT through cryptocurrency exchanges or by receiving them from another wallet. Contact your administrator for funding options.'}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-7">
                <AccordionTrigger className="text-left">
                  What are transaction fees?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Transaction fees (gas fees) are small amounts of APT paid to validators who process
                  your transactions. On Aptos, these fees are typically very low, often less than $0.01
                  per transaction.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="faq-8">
                <AccordionTrigger className="text-left">
                  Can I use this wallet in other apps?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Currently, no. This wallet is managed by NYU Nexus and is designed specifically for
                  use within our platform. This ensures maximum security and simplifies the user
                  experience.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
