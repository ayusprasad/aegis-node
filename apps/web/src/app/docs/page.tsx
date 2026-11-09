import type { Metadata } from 'next';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Documentation — AegisNode',
  description: 'Complete documentation for AegisNode: installation, configuration, CLI reference, and API documentation.',
};

interface DocSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

const codeBlock = (code: string, lang = 'powershell') => (
  <pre
    className="terminal bg-gray-900/80 border border-gray-800 rounded-xl p-4 text-sm text-green-300 overflow-x-auto my-4"
    role="code"
  >
    <code>{code}</code>
  </pre>
);

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-950">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% -5%, rgba(14,165,233,0.08), transparent)',
        }}
      />

      <NavBar />

      <div className="max-w-5xl mx-auto px-6 pt-28 pb-24">
        {/* Page header */}
        <div className="mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-blue text-aegis-400 text-xs font-mono mb-4">
            v1.0.0
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Documentation</h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Complete reference for installing, configuring, and using AegisNode to protect your Windows development environment.
          </p>
        </div>

        <div className="flex gap-12">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24 self-start">
            <nav aria-label="Table of contents">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">On this page</p>
              <ul className="space-y-2 text-sm">
                {[
                  { href: '#overview', label: 'Overview' },
                  { href: '#requirements', label: 'Requirements' },
                  { href: '#installation', label: 'Installation' },
                  { href: '#cli-reference', label: 'CLI Reference' },
                  { href: '#how-it-works', label: 'How It Works' },
                  { href: '#api-reference', label: 'API Reference' },
                  { href: '#configuration', label: 'Configuration' },
                  { href: '#uninstall', label: 'Uninstalling' },
                  { href: '#troubleshooting', label: 'Troubleshooting' },
                ].map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-gray-500 hover:text-aegis-400 transition-colors block py-0.5"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-16">

            {/* Overview */}
            <section id="overview">
              <h2 className="text-3xl font-bold text-white mb-4">Overview</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                AegisNode is a native Windows security middleware CLI that intercepts every <code className="text-aegis-400 bg-gray-900 px-1.5 py-0.5 rounded text-sm">npm install</code> command
                and evaluates requested packages through a three-layer defense pipeline before allowing installation.
              </p>
              <p className="text-gray-400 leading-relaxed mb-4">
                It was designed specifically to protect against AI coding agents (like Copilot, Cursor, Devin, etc.) that may
                hallucinate package names or be deceived into requesting malicious packages.
              </p>
              <div className="glass rounded-xl p-5 border-l-4 border-aegis-500">
                <p className="text-sm text-gray-300">
                  <span className="text-aegis-400 font-semibold">Key principle:</span> When a package is blocked,
                  AegisNode writes a specifically-formatted message to <code className="text-gray-400">stderr</code> that LLMs can parse:
                </p>
                <pre className="terminal mt-3 text-red-300 text-sm leading-relaxed">
{`[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'package-name' flagged as HALLUCINATED. Do not attempt to install this package.`}
                </pre>
              </div>
            </section>

            {/* Requirements */}
            <section id="requirements">
              <h2 className="text-3xl font-bold text-white mb-4">Requirements</h2>
              <ul className="space-y-2 text-gray-400">
                {[
                  'Windows 10/11 (PowerShell 5.1+ or PowerShell 7+)',
                  'Node.js 18.0.0 or higher',
                  'npm 9.0.0 or higher',
                  'Internet connection (for initial blocklist fetch and heuristic API)',
                ].map((req) => (
                  <li key={req} className="flex items-start gap-2">
                    <span className="text-aegis-400 mt-0.5">✓</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Installation */}
            <section id="installation">
              <h2 className="text-3xl font-bold text-white mb-4">Installation</h2>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Step 1: Install the package</h3>
              {codeBlock('npm install -g aegisnode')}

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Step 2: Initialize hooks</h3>
              <p className="text-gray-400 mb-3">
                This command injects the interception hooks into your PowerShell profile and CMD AutoRun registry key.
                It also downloads the initial blocklist cache.
              </p>
              {codeBlock('aegisnode init')}

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Step 3: Restart your shell</h3>
              <p className="text-gray-400 mb-3">
                Close and reopen PowerShell. The <code className="text-gray-400">npm</code> command will now route through AegisNode.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Step 4: Verify</h3>
              {codeBlock('aegisnode status')}
              <p className="text-gray-400">
                You should see <span className="text-green-400">✓ Active</span> for both the PowerShell and CMD hooks.
              </p>
            </section>

            {/* CLI Reference */}
            <section id="cli-reference">
              <h2 className="text-3xl font-bold text-white mb-4">CLI Reference</h2>

              {[
                {
                  cmd: 'aegisnode init',
                  flags: ['--force', '--no-powershell', '--no-cmd'],
                  desc: 'Install interception hooks into PowerShell $PROFILE and CMD AutoRun registry. The --force flag reinstalls even if already present.',
                },
                {
                  cmd: 'aegisnode status',
                  flags: [],
                  desc: 'Display current protection status: hook presence, blocklist cache freshness, Node.js environment info.',
                },
                {
                  cmd: 'aegisnode update',
                  flags: [],
                  desc: 'Force-refresh the local blocklist cache from AEGISNODE_BLOCKLIST_URL, regardless of the 24-hour TTL.',
                },
                {
                  cmd: 'aegisnode verify <package>',
                  flags: [],
                  desc: 'Manually verify a specific package name against all three evaluation layers.',
                },
              ].map((item) => (
                <div key={item.cmd} className="glass rounded-xl p-5 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-aegis-400 font-mono font-semibold">{item.cmd}</code>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{item.desc}</p>
                  {item.flags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {item.flags.map((f) => (
                        <code key={f} className="text-xs text-gray-500 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                          {f}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* How It Works */}
            <section id="how-it-works">
              <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>

              <div className="space-y-4">
                <div className="glass rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-2">Shell Hook (Windows PowerShell)</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    <code className="text-gray-300">aegisnode init</code> appends the following function to your <code className="text-gray-400">$PROFILE</code>:
                  </p>
                  <pre className="terminal text-xs text-green-300 leading-6">
{`function npm {
    $intercepted = @('install', 'i', 'add', 'isntall', 'instal')
    if ($args.Count -gt 0 -and $intercepted -contains $args[0]) {
        aegisnode-proxy @args
    } else {
        & (Get-Command npm -CommandType Application | Select-Object -First 1).Source @args
    }
}`}
                  </pre>
                </div>

                <div className="glass rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-2">Infinite Loop Prevention</h3>
                  <p className="text-gray-400 text-sm">
                    When packages are verified safe, <code className="text-gray-400">aegisnode-proxy</code> spawns the real npm
                    using its <strong>absolute path</strong> (<code className="text-gray-400">node.exe "C:\...\npm-cli.js"</code>),
                    bypassing the PowerShell alias entirely. This prevents infinite interception loops.
                  </p>
                </div>

                <div className="glass rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-2">Evaluation Pipeline</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
                    <li>Check local <code className="text-gray-400">%LOCALAPPDATA%\AegisNode\cache.json</code> (refreshed every 24h from GitHub)</li>
                    <li>If not in cache → POST to <code className="text-gray-400">AEGISNODE_API_URL</code> (localhost by default)</li>
                    <li>API checks: npm registry existence → typosquat → age/downloads</li>
                    <li>If blocked: write LLM-formatted error to stderr, exit 1</li>
                    <li>If safe: spawn real npm with absolute path, stream all I/O</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api-reference">
              <h2 className="text-3xl font-bold text-white mb-4">API Reference</h2>

              <div className="glass rounded-xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-1 bg-aegis-900 text-aegis-400 rounded text-xs font-mono font-bold">POST</span>
                  <code className="text-white font-mono">/api/verify</code>
                </div>

                <h4 className="text-sm font-semibold text-gray-300 mb-2">Request Body</h4>
                <pre className="terminal text-sm text-gray-300 mb-4">
{`{
  "package": "express-router-util"
}`}
                </pre>

                <h4 className="text-sm font-semibold text-gray-300 mb-2">Response (blocked)</h4>
                <pre className="terminal text-sm text-red-300 mb-4">
{`{
  "status": "blocked",
  "reason": "HALLUCINATED",
  "details": "Package does not exist on the npm registry."
}`}
                </pre>

                <h4 className="text-sm font-semibold text-gray-300 mb-2">Response (safe)</h4>
                <pre className="terminal text-sm text-green-300">
{`{
  "status": "safe",
  "reason": "passed_all_checks",
  "details": "Package exists and shows no suspicious patterns."
}`}
                </pre>
              </div>

              <p className="text-sm text-gray-500">
                The <code className="text-gray-400">reason</code> field for blocked packages will be one of:{' '}
                <code className="text-red-400">HALLUCINATED</code>,{' '}
                <code className="text-red-400">TYPOSQUAT</code>, or{' '}
                <code className="text-red-400">SUSPICIOUS</code>.
              </p>
            </section>

            {/* Configuration */}
            <section id="configuration">
              <h2 className="text-3xl font-bold text-white mb-4">Configuration</h2>

              <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
                <div className="glass rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-2">Environment Variables</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-left">
                        <th className="pb-2 text-gray-400 font-medium">Variable</th>
                        <th className="pb-2 text-gray-400 font-medium">Description</th>
                        <th className="pb-2 text-gray-400 font-medium">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900">
                      {[
                        {
                          var: 'AEGISNODE_API_URL',
                          desc: 'Override the heuristic API URL',
                          default: 'http://localhost:3000/api/verify',
                        },
                        {
                          var: 'AEGISNODE_BLOCKLIST_URL',
                          desc: 'Override the blocklist feed URL',
                          default: 'http://localhost:3000/blocklist.json',
                        },
                        {
                          var: 'AEGISNODE_CACHE_PATH',
                          desc: 'Override the local cache file path for testing',
                          default: '%LOCALAPPDATA%\\AegisNode\\cache.json',
                        },
                        {
                          var: 'LOCALAPPDATA',
                          desc: 'Windows local app data directory',
                          default: '%USERPROFILE%\\AppData\\Local',
                        },
                      ].map((row) => (
                        <tr key={row.var}>
                          <td className="py-2.5 pr-4">
                            <code className="text-aegis-400 text-xs">{row.var}</code>
                          </td>
                          <td className="py-2.5 pr-4 text-gray-500 text-xs">{row.desc}</td>
                          <td className="py-2.5 text-gray-600 text-xs font-mono">{row.default}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Uninstall */}
            <section id="uninstall">
              <h2 className="text-3xl font-bold text-white mb-4">Uninstalling</h2>
              <p className="text-gray-400 mb-4">To remove AegisNode completely:</p>
              {codeBlock(`# 1. Remove PowerShell hook from your profile:
#    Open $PROFILE in an editor and delete the AegisNode block.
#    Or use this one-liner:
(Get-Content $PROFILE) -notmatch 'AegisNode' | Set-Content $PROFILE

# 2. Remove CMD AutoRun registry key:
reg delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f

# 3. Delete cache directory:
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\\AegisNode"

# 4. Uninstall the global package:
npm uninstall -g aegisnode`)}
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting">
              <h2 className="text-3xl font-bold text-white mb-6">Troubleshooting</h2>

              <div className="space-y-4">
                {[
                  {
                    q: 'npm still works without interception after init',
                    a: 'Restart your PowerShell terminal. The profile is only loaded once per session. Run `aegisnode status` to confirm hooks are installed.',
                  },
                  {
                    q: 'Getting "execution policy" errors in PowerShell',
                    a: 'Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser then re-run aegisnode init.',
                  },
                  {
                    q: 'The proxy can\'t find npm-cli.js',
                    a: 'Set the AEGISNODE_NPM_PATH environment variable to the absolute path of your npm-cli.js file. Run: node -e "console.log(require(\'which\').sync(\'npm\'))" to find it.',
                  },
                  {
                    q: 'API verify returns errors for all packages',
                    a: 'Check your internet connection. The local API may be temporarily down. Locally cached packages will still be checked. Use AEGISNODE_API_URL to point to another self-hosted API.',
                  },
                  {
                    q: 'False positives on legitimate packages',
                    a: 'Use aegisnode verify <package> to see detailed reasoning. If a package is incorrectly flagged as a typosquat, open a GitHub issue with the package name.',
                  },
                ].map((item, i) => (
                  <details
                    key={i}
                    className="glass rounded-xl group"
                    id={`faq-${i}`}
                  >
                    <summary className="px-5 py-4 cursor-pointer text-white font-medium hover:text-aegis-300 transition-colors list-none flex justify-between items-center">
                      {item.q}
                      <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-4 text-gray-400 text-sm border-t border-gray-800 pt-3">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
