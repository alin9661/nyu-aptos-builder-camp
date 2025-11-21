'use client';

import { useState } from 'react'
import { DashboardStats } from '@/components/DashboardStats'
import { TreasuryBalance } from '@/components/TreasuryBalance'
import { ReimbursementsList } from '@/components/ReimbursementsList'
import { ElectionsList } from '@/components/ElectionsList'
import { ProposalsList } from '@/components/ProposalsList'
import { SiteHeader } from '@/components/site-header'
import { WalletSetupBanner, CreateWalletCard } from '@/components/wallet'
import { useAuth } from '@/lib/auth/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Page() {
  const { user } = useAuth()
  const [showCreateWalletCard, setShowCreateWalletCard] = useState(false)

  const hasWallet = user?.aptosWallet && user.aptosWallet.address
  const shouldShowWalletSetup = !hasWallet

  const handleCreateWalletClick = () => {
    setShowCreateWalletCard(true)
  }

  const handleWalletCreated = () => {
    setShowCreateWalletCard(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.username || 'User'}</h1>
              <p className="text-muted-foreground mt-1">Here's what's happening with your organizations today.</p>
            </div>
          </div>

          {/* Wallet Setup Banner - Shows if user has no wallet */}
          {shouldShowWalletSetup && (
            <WalletSetupBanner
              onCreateWallet={handleCreateWalletClick}
              onDismiss={() => {}}
            />
          )}

          {/* Create Wallet Card - Shows when user clicks "Create Wallet" */}
          {shouldShowWalletSetup && showCreateWalletCard && (
            <CreateWalletCard onSuccess={handleWalletCreated} />
          )}

          {/* Dashboard Grid Layout */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Stats Column */}
            <div className="space-y-6">
               <DashboardStats />
            </div>

            {/* Middle Column - Treasury/Charts */}
            <div className="space-y-6 lg:col-span-2">
               <TreasuryBalance autoRefresh={true} refreshInterval={30000} />
            </div>
          </div>

          {/* Bottom Section - Lists */}
          <div className="grid gap-6">
            <Tabs defaultValue="reimbursements" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Activity History</h2>
                <TabsList>
                  <TabsTrigger value="reimbursements">Reimbursements</TabsTrigger>
                  <TabsTrigger value="elections">Elections</TabsTrigger>
                  <TabsTrigger value="proposals">Proposals</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="reimbursements" className="mt-0">
                <ReimbursementsList pageSize={5} showPagination={true} />
              </TabsContent>
              <TabsContent value="elections" className="mt-0">
                <ElectionsList pageSize={5} showPagination={true} />
              </TabsContent>
              <TabsContent value="proposals" className="mt-0">
                <ProposalsList pageSize={5} showPagination={true} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
