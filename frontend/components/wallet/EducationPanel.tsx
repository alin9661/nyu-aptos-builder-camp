'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Shield,
  Wallet,
  Users,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Rocket,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface EducationPanelProps {
  className?: string;
}

export function EducationPanel({ className }: EducationPanelProps) {
  const [activeTab, setActiveTab] = useState('getting-started');

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Wallet Education Center
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="getting-started">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Start</span>
            </TabsTrigger>
            <TabsTrigger value="aptos">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Aptos</span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Security</span>
            </TabsTrigger>
            <TabsTrigger value="using-wallet">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Usage</span>
            </TabsTrigger>
            <TabsTrigger value="faqs">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">FAQs</span>
            </TabsTrigger>
            <TabsTrigger value="resources">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Resources</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="space-y-4 mt-4">
            <GettingStartedContent />
          </TabsContent>

          <TabsContent value="aptos" className="space-y-4 mt-4">
            <AptosContent />
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <SecurityContent />
          </TabsContent>

          <TabsContent value="using-wallet" className="space-y-4 mt-4">
            <UsingWalletContent />
          </TabsContent>

          <TabsContent value="faqs" className="space-y-4 mt-4">
            <FAQsContent />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4 mt-4">
            <ResourcesContent />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function GettingStartedContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold mb-3">Welcome to Your Aptos Wallet!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your wallet is your gateway to the Aptos blockchain. Here's everything you need to know to get started.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className="font-semibold">Quick Start Guide</h4>
        <div className="space-y-3">
          <StepItem
            number={1}
            title="Understand Your Wallet"
            description="Your wallet has a unique address (like an email) and is secured with encryption."
          />
          <StepItem
            number={2}
            title="Check Your Balance"
            description="View your APT (Aptos token) balance on the dashboard or in the wallet details."
          />
          <StepItem
            number={3}
            title="Explore the Platform"
            description="Use your wallet to vote on proposals, request reimbursements, and participate in governance."
          />
          <StepItem
            number={4}
            title="Stay Secure"
            description="Always verify transactions before approving and keep your account credentials safe."
          />
        </div>
      </section>
    </div>
  );
}

function AptosContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold mb-3">What is Aptos?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Aptos is a next-generation Layer 1 blockchain designed for safety, scalability, and upgradeability.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className="font-semibold">Key Features</h4>
        <div className="space-y-2">
          <FeatureItem
            title="Move Programming Language"
            description="Built with Move, a secure and flexible smart contract language originally developed for Diem."
          />
          <FeatureItem
            title="High Performance"
            description="Capable of processing over 160,000 transactions per second with sub-second finality."
          />
          <FeatureItem
            title="Security First"
            description="Designed with safety and security as primary concerns, protecting user assets."
          />
          <FeatureItem
            title="Parallel Execution"
            description="Uses Block-STM for parallel transaction execution, improving throughput."
          />
        </div>
      </section>

      <Separator />

      <section>
        <h4 className="font-semibold mb-2">APT Token</h4>
        <p className="text-sm text-muted-foreground">
          APT is the native token of the Aptos blockchain, used for transaction fees, staking, and governance.
          1 APT = 100,000,000 octas (smallest unit).
        </p>
      </section>
    </div>
  );
}

function SecurityContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Security Best Practices
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your wallet security is our top priority. Follow these guidelines to keep your assets safe.
        </p>
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className="font-semibold">How We Protect Your Wallet</h4>
        <div className="space-y-2">
          <SecurityItem
            title="AES-256-GCM Encryption"
            description="Your private keys are encrypted using military-grade AES-256-GCM encryption."
            level="High"
          />
          <SecurityItem
            title="Secure Storage"
            description="Keys are stored in encrypted databases with strict access controls."
            level="High"
          />
          <SecurityItem
            title="Audit Logging"
            description="All wallet operations are logged for security monitoring and compliance."
            level="Medium"
          />
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h4 className="font-semibold">What You Should Do</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-green-600">✓</span>
            <span>Use a strong, unique password for your account</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">✓</span>
            <span>Enable two-factor authentication (2FA)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">✓</span>
            <span>Verify all transaction details before approving</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">✓</span>
            <span>Keep your recovery information safe</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-600">✗</span>
            <span>Never share your account credentials with anyone</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-600">✗</span>
            <span>Don't approve transactions you don't understand</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

function UsingWalletContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold mb-3">Using Your Wallet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Learn how to use your wallet for various activities on the platform.
        </p>
      </section>

      <Separator />

      <CollapsibleSection
        title="Receiving Funds"
        icon={<Wallet className="h-4 w-4" />}
      >
        <p className="text-sm text-muted-foreground mb-2">
          To receive APT tokens or other assets:
        </p>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Copy your wallet address from the dashboard</li>
          <li>Share it with the sender</li>
          <li>Wait for the transaction to be confirmed</li>
          <li>Check your balance and transaction history</li>
        </ol>
      </CollapsibleSection>

      <CollapsibleSection
        title="Voting on Proposals"
        icon={<Users className="h-4 w-4" />}
      >
        <p className="text-sm text-muted-foreground mb-2">
          Participate in DAO governance:
        </p>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Navigate to the Governance section</li>
          <li>Browse active proposals</li>
          <li>Read the proposal details carefully</li>
          <li>Cast your vote (Yes/No/Abstain)</li>
          <li>Confirm the transaction with your wallet</li>
        </ol>
      </CollapsibleSection>

      <CollapsibleSection
        title="Requesting Reimbursements"
        icon={<FileText className="h-4 w-4" />}
      >
        <p className="text-sm text-muted-foreground mb-2">
          Submit expense claims to the DAO:
        </p>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Go to the Treasury section</li>
          <li>Click "Request Reimbursement"</li>
          <li>Fill in expense details and upload receipts</li>
          <li>Submit for approval</li>
          <li>Funds will be sent to your wallet once approved</li>
        </ol>
      </CollapsibleSection>

      <CollapsibleSection
        title="Viewing Transaction History"
        icon={<FileText className="h-4 w-4" />}
      >
        <p className="text-sm text-muted-foreground mb-2">
          Track your wallet activity:
        </p>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>Open Wallet Details</li>
          <li>Go to the Transactions tab</li>
          <li>Filter by sent/received/all</li>
          <li>Click on a transaction to view in the explorer</li>
        </ol>
      </CollapsibleSection>
    </div>
  );
}

function FAQsContent() {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-3">Frequently Asked Questions</h3>

      <CollapsibleSection title="What is a custodial wallet?">
        <p className="text-sm text-muted-foreground">
          A custodial wallet means we manage your private keys on your behalf. This makes it easier to use,
          but means you trust us to keep your keys secure. Your keys are encrypted and stored safely.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Can I export my private keys?">
        <p className="text-sm text-muted-foreground">
          No, for security reasons, private keys cannot be exported from custodial wallets. However,
          you can export your public wallet information (address, public key) anytime.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="How do I recover my wallet?">
        <p className="text-sm text-muted-foreground">
          Your wallet is tied to your account. As long as you can access your account, you can access your wallet.
          Make sure to keep your account credentials and 2FA backup codes safe.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="What are transaction fees?">
        <p className="text-sm text-muted-foreground">
          Transaction fees (gas fees) are small amounts paid to process transactions on the blockchain.
          Aptos fees are typically very low, usually a fraction of a cent.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Is my wallet secure?">
        <p className="text-sm text-muted-foreground">
          Yes! Your wallet uses AES-256 encryption, the same standard used by banks and governments.
          We also implement access controls, audit logging, and regular security audits.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Can I use an external wallet instead?">
        <p className="text-sm text-muted-foreground">
          Currently, the platform uses auto-generated custodial wallets. External wallet integration
          (Petra, Martian, etc.) may be available in future updates.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="What happens if I lose access to my account?">
        <p className="text-sm text-muted-foreground">
          Contact support immediately if you lose account access. Have your account recovery information ready.
          This is why it's crucial to keep your recovery codes and 2FA backups safe.
        </p>
      </CollapsibleSection>
    </div>
  );
}

function ResourcesContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold mb-3">Additional Resources</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Learn more about Aptos and blockchain technology.
        </p>
      </section>

      <Separator />

      <section className="space-y-2">
        <h4 className="font-semibold mb-3">Official Documentation</h4>
        <ResourceLink
          title="Aptos Developer Documentation"
          description="Comprehensive technical documentation for Aptos blockchain"
          url="https://aptos.dev/"
        />
        <ResourceLink
          title="Aptos Whitepaper"
          description="Learn about the technical architecture and design principles"
          url="https://aptos.dev/aptos-white-paper/"
        />
        <ResourceLink
          title="Move Programming Language"
          description="Documentation for the Move smart contract language"
          url="https://move-language.github.io/move/"
        />
      </section>

      <Separator />

      <section className="space-y-2">
        <h4 className="font-semibold mb-3">Blockchain Explorers</h4>
        <ResourceLink
          title="Aptos Explorer"
          description="View transactions, accounts, and blockchain data"
          url="https://explorer.aptoslabs.com/"
        />
      </section>

      <Separator />

      <section className="space-y-2">
        <h4 className="font-semibold mb-3">Community</h4>
        <ResourceLink
          title="Aptos Discord"
          description="Join the Aptos community for support and discussions"
          url="https://discord.gg/aptoslabs"
        />
        <ResourceLink
          title="Aptos Forum"
          description="Participate in governance and technical discussions"
          url="https://forum.aptoslabs.com/"
        />
      </section>
    </div>
  );
}

// Helper Components
function StepItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
        {number}
      </div>
      <div className="space-y-1 flex-1">
        <h5 className="font-medium text-sm">{title}</h5>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <h5 className="font-medium text-sm">{title}</h5>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function SecurityItem({
  title,
  description,
  level,
}: {
  title: string;
  description: string;
  level: 'High' | 'Medium' | 'Low';
}) {
  const colors = {
    High: 'text-green-600 bg-green-100 dark:bg-green-950',
    Medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950',
    Low: 'text-orange-600 bg-orange-100 dark:bg-orange-950',
  };

  return (
    <div className="rounded-lg border p-3 space-y-1">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-sm">{title}</h5>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            colors[level]
          )}
        >
          {level}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 pt-0 border-t">
          {children}
        </div>
      )}
    </div>
  );
}

function ResourceLink({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start h-auto p-3"
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
    >
      <div className="flex items-start gap-3 flex-1 text-left">
        <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </Button>
  );
}
