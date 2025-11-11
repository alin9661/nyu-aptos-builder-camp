'use client';

import { AppSidebar } from '@/components/app-sidebar'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DashboardStats } from '@/components/DashboardStats'
import { TreasuryBalance } from '@/components/TreasuryBalance'
import { ReimbursementsList } from '@/components/ReimbursementsList'
import { ElectionsList } from '@/components/ElectionsList'
import { ProposalsList } from '@/components/ProposalsList'
import { SiteHeader } from '@/components/site-header'
import { AuthGuard } from '@/components/AuthGuard'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Page() {
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
