'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Shield, Users, Wallet } from 'lucide-react';
import NavBar from './NavBar';
import { Button } from '@/components/ui/button';

// Dynamic import for Three.js component to prevent SSR issues
const ParticleField = dynamic(() => import('./ParticleField'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 -z-10 bg-black" />
  ),
});

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white selection:bg-purple-500/30">
      {/* 3D Background */}
      <ParticleField />
      
      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">Live on Aptos Mainnet</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50">
            Decentralized Governance <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              Reimagined
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Nexus empowers communities with transparent, efficient, and secure governance tools built on the Aptos blockchain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-gray-200 transition-all duration-300">
                Launch App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://aptos.dev" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base border-white/20 bg-transparent hover:bg-white/10 text-white transition-all duration-300">
                Documentation
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-6xl mx-auto w-full px-4"
        >
          <FeatureCard 
            icon={<Shield className="h-8 w-8 text-purple-400" />}
            title="Secure Voting"
            description="On-chain voting mechanisms ensuring transparency and immutability for all governance decisions."
          />
          <FeatureCard 
            icon={<Wallet className="h-8 w-8 text-blue-400" />}
            title="Treasury Management"
            description="Efficiently manage community funds with multi-sig support and transparent allocation tracking."
          />
          <FeatureCard 
            icon={<Users className="h-8 w-8 text-pink-400" />}
            title="Community Driven"
            description="Empower your community to propose, discuss, and enact changes with streamlined workflows."
          />
        </motion.div>
      </main>

      {/* Footer Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
      <div className="mb-4 p-3 rounded-xl bg-white/5 w-fit">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}