import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { WalletProvider } from '@/lib/wallet/WalletProvider'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { Toaster } from '@/components/ui/toast'
import { NotificationCenterProvider } from '@/components/NotificationCenter'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Nexus - NYU Aptos Governance Platform',
  description: 'Decentralized governance and treasury management platform built on Aptos',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          <NotificationCenterProvider>
            <WalletProvider autoConnect={true}>
              {children}
            </WalletProvider>
          </NotificationCenterProvider>
        </ErrorBoundary>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
