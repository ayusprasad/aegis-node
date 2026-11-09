'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-white/[0.05] py-14 px-6 bg-[#0a0f1e]/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 mb-12">
          {/* Brand */}
          <div className="text-center md:text-left">
            <Link 
              href="/"
              className="inline-flex items-center gap-2.5 mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg px-2 -ml-2 py-1"
              aria-label="AegisNode Home"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-black text-white text-lg tracking-tight">
                Aegis<span className="text-blue-400">Node</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Windows npm security middleware for AI-assisted development.
              Open-source, no telemetry, no accounts.
            </p>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-12 sm:gap-x-20 gap-y-8 text-sm text-gray-400 text-center sm:text-left">
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-4">Product</p>
              <Link href="#how-it-works" className="block hover:text-white transition-colors focus:outline-none focus-visible:text-blue-400">How It Works</Link>
              <Link href="#demo" className="block hover:text-white transition-colors focus:outline-none focus-visible:text-blue-400">Live Scanner</Link>
              <Link href="#install" className="block hover:text-white transition-colors focus:outline-none focus-visible:text-blue-400">Install</Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-4">Docs</p>
              <Link href="/docs" className="block hover:text-white transition-colors focus:outline-none focus-visible:text-blue-400">Documentation</Link>
              <Link href="/docs#cli-reference" className="block hover:text-white transition-colors focus:outline-none focus-visible:text-blue-400">CLI Reference</Link>
              <Link href="/docs#api-reference" className="block hover:text-white transition-colors focus:outline-none focus-visible:text-blue-400">API Reference</Link>
            </div>
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-4">Links</p>
              <a href="https://github.com/priyansupattanaik/aegis-node" target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors focus:outline-none focus-visible:text-blue-400">GitHub</a>
              <a href="https://www.npmjs.com/package/aegisnode-cli" target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors focus:outline-none focus-visible:text-blue-400">npm Package</a>
              <a href="https://github.com/priyansupattanaik/aegis-node/issues" target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors focus:outline-none focus-visible:text-blue-400">Report Issue</a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.04] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} AegisNode. Released under the MIT License.
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
            Free forever
          </p>
        </div>
      </div>
    </footer>
  );
}
