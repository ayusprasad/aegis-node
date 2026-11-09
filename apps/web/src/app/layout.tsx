import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AegisNode — Stop AI Agents from Installing Malicious npm Packages',
  description:
    'AegisNode intercepts every npm install command and blocks hallucinated, malicious, and typosquat packages before they touch your system. Windows-native security for AI-assisted development.',
  keywords: [
    'npm security', 'AI coding safety', 'package security', 'Windows security',
    'npm proxy', 'hallucinated packages', 'typosquatting protection',
    'supply chain attack', 'AI agent security', 'cursor security', 'copilot security',
  ],
  authors: [{ name: 'AegisNode' }],
  openGraph: {
    title: 'AegisNode — Stop AI Agents from Installing Malicious npm Packages',
    description: 'The Windows npm security guard for AI-assisted development. Blocks hallucinated packages, typosquats, and supply-chain attacks before they hit your disk.',
    type: 'website',
    siteName: 'AegisNode',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AegisNode — npm Security for AI Coding Agents',
    description: 'Intercepts every npm install. Blocks hallucinated packages, typosquats, and malware. Windows-native.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>" />
      </head>
      <body className="bg-[#050810] text-gray-100 antialiased font-sans">{children}</body>
    </html>
  );
}
