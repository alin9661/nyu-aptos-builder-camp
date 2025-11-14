'use client';

import { useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DashboardStats } from '@/components/DashboardStats'
import { TreasuryBalance } from '@/components/TreasuryBalance'
import { ReimbursementsList } from '@/components/ReimbursementsList'
import { ElectionsList } from '@/components/ElectionsList'
import { ProposalsList } from '@/components/ProposalsList'
import { SiteHeader } from '@/components/site-header'
import { AuthGuard } from '@/components/AuthGuard'
import { WalletSetupBanner, CreateWalletCard } from '@/components/wallet'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
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
    <AuthGuard requireAuth={true}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Wallet Setup Banner - Shows if user has no wallet */}
                {shouldShowWalletSetup && (
                  <div className="px-4 lg:px-6">
                    <WalletSetupBanner
                      onCreateWallet={handleCreateWalletClick}
                      onDismiss={() => {}}
                    />
                  </div>
                )}

                {/* Create Wallet Card - Shows when user clicks "Create Wallet" */}
                {shouldShowWalletSetup && showCreateWalletCard && (
                  <div className="px-4 lg:px-6">
                    <CreateWalletCard onSuccess={handleWalletCreated} />
                  </div>
                )}

                {/* Dashboard Stats */}
                <DashboardStats />

                {/* Charts Section */}
                <div className="px-4 lg:px-6">
                  <ChartAreaInteractive />
                </div>

                {/* Treasury Balance Card */}
                <div className="px-4 lg:px-6">
                  <TreasuryBalance autoRefresh={true} refreshInterval={30000} />
                </div>

                {/* Data Tables with Tabs */}
                <div className="px-4 lg:px-6">
                  <Tabs defaultValue="reimbursements" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="reimbursements">Reimbursements</TabsTrigger>
                      <TabsTrigger value="elections">Elections</TabsTrigger>
                      <TabsTrigger value="proposals">Proposals</TabsTrigger>
                    </TabsList>
                    <TabsContent value="reimbursements" className="mt-4">
                      <ReimbursementsList pageSize={10} showPagination={true} />
                    </TabsContent>
                    <TabsContent value="elections" className="mt-4">
                      <ElectionsList pageSize={10} showPagination={true} />
                    </TabsContent>
                    <TabsContent value="proposals" className="mt-4">
                      <ProposalsList pageSize={10} showPagination={true} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
