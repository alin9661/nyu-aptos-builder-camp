'use client';

import Link from 'next/link';
import { WalletButton } from '@/components/WalletButton';
import { motion } from 'framer-motion';

export default function NavBar() {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-black/10 border-b border-white/10"
    >
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 overflow-hidden rounded-full bg-gradient-to-tr from-purple-600 to-blue-500">
            <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Nexus</span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          Features
        </Link>
        <Link href="#governance" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          Governance
        </Link>
        <Link href="#treasury" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
          Treasury
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <WalletButton />
      </div>
    </motion.nav>
  );
}