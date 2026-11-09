'use client';

import { useState } from 'react';

const STEPS = [
  {
    id: 'step-install',
    number: '01',
    title: 'Install globally',
    description: 'Install AegisNode as a global npm package.',
    code: 'npm install -g aegisnode',
    lang: 'powershell',
  },
  {
    id: 'step-init',
    number: '02',
    title: 'Initialize hooks',
    description: 'Inject the security hooks into your PowerShell profile and CMD AutoRun.',
    code: 'aegisnode init',
    lang: 'powershell',
  },
  {
    id: 'step-restart',
    number: '03',
    title: 'Restart your shell',
    description: 'Close and reopen PowerShell for the npm alias to take effect.',
    code: '# Close PowerShell, then reopen it\n# The npm command is now protected',
    lang: 'powershell',
  },
  {
    id: 'step-verify',
    number: '04',
    title: 'Verify protection',
    description: 'Check that AegisNode is active and protecting your environment.',
    code: 'aegisnode status',
    lang: 'powershell',
  },
  {
    id: 'step-test',
    number: '05',
    title: 'Test interception',
    description: 'Try installing a known-bad package to see AegisNode in action.',
    code: '# This will be BLOCKED:\nnpm install crossenv\n\n# This will PASS:\nnpm install express',
    lang: 'powershell',
  },
];

export default function InstallSteps() {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedStep(id);
      setTimeout(() => setCopiedStep(null), 2000);
    });
  };

  return (
    <div className="space-y-4">
      {STEPS.map((step) => (
        <div
          key={step.id}
          id={step.id}
          className="glass rounded-2xl p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-start gap-4">
            {/* Step number */}
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-aegis-900/60 border border-aegis-700/40 flex items-center justify-center">
              <span className="text-aegis-400 font-bold font-mono text-xs">{step.number}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1">{step.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{step.description}</p>

              {/* Code block */}
              <div className="relative group">
                <div className="flex items-center justify-between bg-gray-900/80 border border-gray-800 rounded-xl px-4 py-2.5 mb-0">
                  <span className="text-xs text-gray-600 font-mono">{step.lang}</span>
                  <button
                    id={`copy-${step.id}`}
                    onClick={() => handleCopy(step.id, step.code)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5"
                    aria-label={`Copy ${step.title} command`}
                  >
                    {copiedStep === step.id ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre
                  className="terminal bg-gray-950/80 border border-gray-800 border-t-0 rounded-b-xl px-4 py-3 text-sm text-green-300 overflow-x-auto"
                  role="code"
                  aria-label={`Command: ${step.code}`}
                >
                  <code>{step.code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Uninstall note */}
      <div className="glass rounded-xl px-6 py-4 border-yellow-800/30 bg-yellow-950/10">
        <p className="text-xs text-gray-500">
          <span className="text-yellow-400 font-medium">To uninstall: </span>
          Remove the AegisNode block from your PowerShell profile (
          <code className="text-gray-400">~\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1</code>
          ) and delete the registry key with <code className="text-gray-400">aegisnode status</code> for the path, then{' '}
          <code className="text-gray-400">npm uninstall -g aegisnode</code>.
        </p>
      </div>
    </div>
  );
}
