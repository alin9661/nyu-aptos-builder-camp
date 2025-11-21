'use client';

import { SiteHeader } from '@/components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Vote, 
  FileText, 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Lock,
  RefreshCw,
  Globe,
  Bell,
  Settings
} from 'lucide-react';

export default function FeaturesPage() {
  const features = [
    {
      icon: Wallet,
      title: 'Aptos Wallet Integration',
      description: 'Seamlessly connect and manage your Aptos wallet with full AIP-62 wallet adapter support.',
      status: 'active',
      category: 'Blockchain',
    },
    {
      icon: Vote,
      title: 'Democratic Elections',
      description: 'Create and participate in transparent, on-chain elections with secure voting mechanisms.',
      status: 'active',
      category: 'Governance',
    },
    {
      icon: FileText,
      title: 'Reimbursement System',
      description: 'Submit, approve, and track reimbursement requests with automated payment processing.',
      status: 'active',
      category: 'Treasury',
    },
    {
      icon: Shield,
      title: 'NYU SSO Authentication',
      description: 'Secure authentication using NYU Single Sign-On for verified member access.',
      status: 'active',
      category: 'Security',
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'Live WebSocket connections for instant updates on transactions and activities.',
      status: 'active',
      category: 'Performance',
    },
    {
      icon: Users,
      title: 'Organization Management',
      description: 'Create and manage multiple organizations with role-based access control.',
      status: 'active',
      category: 'Management',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics and reporting for treasury, voting, and member activity.',
      status: 'active',
      category: 'Analytics',
    },
    {
      icon: Lock,
      title: 'Smart Contract Security',
      description: 'Battle-tested Move smart contracts with comprehensive security audits.',
      status: 'active',
      category: 'Security',
    },
    {
      icon: RefreshCw,
      title: 'Auto-Reconnect',
      description: 'Automatic wallet reconnection on page reload for seamless user experience.',
      status: 'active',
      category: 'UX',
    },
    {
      icon: Globe,
      title: 'Multi-Chain Support',
      description: 'Built on Aptos with architecture ready for multi-chain expansion.',
      status: 'planned',
      category: 'Blockchain',
    },
    {
      icon: Bell,
      title: 'Notification Center',
      description: 'Stay updated with real-time notifications for important events and transactions.',
      status: 'active',
      category: 'Communication',
    },
    {
      icon: Settings,
      title: 'Customizable Settings',
      description: 'Personalize your experience with flexible user preferences and configurations.',
      status: 'active',
      category: 'UX',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'beta':
        return 'secondary';
      case 'planned':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Features</h1>
              <p className="text-muted-foreground mt-1">
                Explore the powerful capabilities of our platform
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-primary/10 p-2 w-fit">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant={getStatusColor(feature.status)}>
                        {feature.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Category: {feature.category}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Feature Stats */}
          <div className="grid gap-6 md:grid-cols-3 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {features.filter(f => f.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fully operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(features.map(f => f.category)).size}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Diverse capabilities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {features.filter(f => f.status === 'planned').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  In development
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
