'use client';

import { useState } from 'react';

interface VerifyResult {
  status: 'safe' | 'blocked';
  reason: string;
  details?: string;
}

const KNOWN_DANGEROUS = ['crossenv', 'mongose', 'expresss', 'axois', 'nodemailer-js', 'lodash.js', 'babelcli'];
const QUICKTEST_PACKAGES = [
  { name: 'express', expected: 'safe', label: '✓ express (safe)' },
  { name: 'lodash', expected: 'safe', label: '✓ lodash (safe)' },
  { name: 'crossenv', expected: 'blocked', label: '✗ crossenv (malicious)' },
  { name: 'express-router-util', expected: 'blocked', label: '✗ express-router-util (hallucinated)' },
  { name: 'reactt', expected: 'blocked', label: '✗ reactt (typosquat)' },
];

export default function ThreatDemo() {
  const [packageName, setPackageName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (pkg?: string) => {
    const target = pkg ?? packageName.trim();
    if (!target) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: target }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as VerifyResult;
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input area */}
      <div className="glass rounded-2xl p-6">
        <label htmlFor="package-input" className="block text-sm font-medium text-gray-300 mb-3">
          Package name to check
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm select-none">
              $
            </span>
            <input
              id="package-input"
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="e.g. express-router-util"
              className="w-full pl-8 pr-4 py-3 bg-gray-900/80 border border-gray-700 rounded-xl text-white placeholder-gray-600 font-mono text-sm focus:outline-none focus:border-aegis-500 focus:ring-1 focus:ring-aegis-500 transition-colors"
              aria-label="Enter npm package name to verify"
            />
          </div>
          <button
            id="verify-btn"
            onClick={() => handleVerify()}
            disabled={loading || !packageName.trim()}
            className="px-6 py-3 bg-aegis-600 hover:bg-aegis-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 whitespace-nowrap"
            aria-label="Verify package"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning...
              </span>
            ) : (
              'Verify →'
            )}
          </button>
        </div>

        {/* Quick test buttons */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2">Quick tests:</p>
          <div className="flex flex-wrap gap-2">
            {QUICKTEST_PACKAGES.map((pkg) => (
              <button
                key={pkg.name}
                id={`quick-test-${pkg.name}`}
                onClick={() => {
                  setPackageName(pkg.name);
                  handleVerify(pkg.name);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:scale-105 ${
                  pkg.expected === 'safe'
                    ? 'bg-green-950/50 border border-green-800 text-green-400 hover:bg-green-900/50'
                    : 'bg-red-950/50 border border-red-800 text-red-400 hover:bg-red-900/50'
                }`}
              >
                {pkg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result display */}
      {(result || error || loading) && (
        <div
          className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
            loading
              ? 'border-gray-700 bg-gray-900/50'
              : error
              ? 'border-yellow-800 bg-yellow-950/20'
              : result?.status === 'blocked'
              ? 'border-red-800 bg-red-950/20'
              : 'border-green-800 bg-green-950/20'
          }`}
          role="status"
          aria-live="polite"
        >
          {/* Result header */}
          <div className={`flex items-center gap-3 px-6 py-4 border-b ${
            loading ? 'border-gray-800' : error ? 'border-yellow-900' : result?.status === 'blocked' ? 'border-red-900' : 'border-green-900'
          }`}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-aegis-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-300 font-medium text-sm">Analyzing package...</span>
              </>
            ) : error ? (
              <>
                <span className="text-yellow-400 text-lg">⚠</span>
                <span className="text-yellow-400 font-semibold">API Error</span>
              </>
            ) : result?.status === 'blocked' ? (
              <>
                <span className="text-red-400 text-lg">🚫</span>
                <span className="text-red-400 font-bold">BLOCKED</span>
                <span className="ml-auto text-xs text-red-500 font-mono">[AEGISNODE SECURITY OVERRIDE]</span>
              </>
            ) : (
              <>
                <span className="text-green-400 text-lg">✅</span>
                <span className="text-green-400 font-bold">SAFE</span>
                <span className="ml-auto text-xs text-green-600 font-mono">verified</span>
              </>
            )}
          </div>

          {/* Result body - ALWAYS left aligned per spec */}
          <div className="log-output p-6 text-sm">
            {loading && (
              <div className="space-y-2">
                <div className="text-gray-400">
                  {'>'} Checking local blocklist cache...
                  <span className="animate-blink">_</span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-yellow-400">
                Error: {error}
                <br />
                <span className="text-gray-500 text-xs mt-2 block">The API may be unavailable. Try again in a moment.</span>
              </div>
            )}

            {result && !loading && (
              <div>
                <div className={result.status === 'blocked' ? 'text-red-300' : 'text-green-300'}>
                  {result.status === 'blocked' ? (
                    <>
                      <span className="text-gray-500">{'>'} </span>
                      {`[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package '${packageName || 'package'}' flagged as ${result.reason}. Do not attempt to install this package.`}
                    </>
                  ) : (
                    <>
                      <span className="text-gray-500">{'>'} </span>
                      {`Package '${packageName || 'package'}' passed all security checks. Safe to install.`}
                    </>
                  )}
                </div>
                {result.details && (
                  <div className="mt-3 text-gray-500 text-xs border-t border-gray-800 pt-3">
                    <span className="text-gray-600">Details: </span>
                    {result.details}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
