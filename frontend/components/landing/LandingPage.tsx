'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Users, Wallet } from 'lucide-react';
import NavBar from './NavBar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-screen p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8 text-center">
          <Badge variant="outline" className="gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Live on Aptos Mainnet</span>
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Decentralized Governance <br />
            <span className="text-primary">
              Reimagined
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Nexus empowers communities with transparent, efficient, and secure governance tools built on the Aptos blockchain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg">
                Launch App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://aptos.dev" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg">
                Documentation
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-7xl mx-auto w-full">
          <FeatureCard
            icon={<Shield className="h-5 w-5 text-primary" />}
            title="Secure Voting"
            description="On-chain voting mechanisms ensuring transparency and immutability for all governance decisions."
          />
          <FeatureCard
            icon={<Wallet className="h-5 w-5 text-primary" />}
            title="Treasury Management"
            description="Efficiently manage community funds with multi-sig support and transparent allocation tracking."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5 text-primary" />}
            title="Community Driven"
            description="Empower your community to propose, discuss, and enact changes with streamlined workflows."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 p-3 rounded-lg bg-primary/10 w-fit">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
