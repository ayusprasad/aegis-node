'use client';

import { useState, useEffect } from 'react';

const TERMINAL_LINES = [
  { delay: 0, text: '$ npm install express-router-util', type: 'input' },
  { delay: 600, text: '', type: 'blank' },
  { delay: 700, text: '[AegisNode] Intercepting npm install - evaluating 1 package(s)...', type: 'info' },
  { delay: 1200, text: '  ✗ express-router-util → HALLUCINATED - package does not exist on npm registry', type: 'error' },
  { delay: 1800, text: '', type: 'blank' },
  { delay: 1900, text: "[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package 'express-router-util'", type: 'block' },
  { delay: 2100, text: "flagged as HALLUCINATED. Do not attempt to install this package.", type: 'block' },
  { delay: 2700, text: '', type: 'blank' },
  { delay: 2800, text: '$ npm install express lodash', type: 'input' },
  { delay: 3400, text: '', type: 'blank' },
  { delay: 3500, text: '[AegisNode] Intercepting npm install - evaluating 2 package(s)...', type: 'info' },
  { delay: 3900, text: '  ✓ express → safe', type: 'safe' },
  { delay: 4200, text: '  ✓ lodash → safe', type: 'safe' },
  { delay: 4500, text: '', type: 'blank' },
  { delay: 4600, text: '[AegisNode] All 2 package(s) verified safe. Proceeding...', type: 'success' },
  { delay: 4800, text: '', type: 'blank' },
  { delay: 4900, text: 'added 57 packages in 2.4s', type: 'npm' },
];

const LINE_COLORS: Record<string, string> = {
  input: 'text-white',
  blank: 'text-transparent',
  info: 'text-sky-400',
  error: 'text-red-400',
  block: 'text-red-300',
  safe: 'text-green-400',
  success: 'text-green-300',
  npm: 'text-gray-400',
};

const LINE_PREFIXES: Record<string, string> = {
  input: '',
  blank: '',
  info: '',
  error: '',
  block: '',
  safe: '',
  success: '',
  npm: '',
};

export default function HeroTerminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    TERMINAL_LINES.forEach((line, index) => {
      const timer = setTimeout(() => {
        setVisibleLines(index + 1);
      }, line.delay);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Restart animation after completion
  useEffect(() => {
    if (visibleLines >= TERMINAL_LINES.length) {
      const restart = setTimeout(() => {
        setVisibleLines(0);
        setTimeout(() => setVisibleLines(0), 100);
        // Trigger re-render to restart
        setTimeout(() => {
          const timers: ReturnType<typeof setTimeout>[] = [];
          TERMINAL_LINES.forEach((line, index) => {
            const timer = setTimeout(() => {
              setVisibleLines(index + 1);
            }, line.delay);
            timers.push(timer);
          });
        }, 2000);
      }, 4000);
      return () => clearTimeout(restart);
    }
  }, [visibleLines]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-800/80" style={{ boxShadow: '0 0 60px rgba(14,165,233,0.1), 0 25px 50px rgba(0,0,0,0.5)' }}>
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/90 border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="ml-2 text-xs text-gray-500 font-mono">Windows PowerShell — AegisNode Protected</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-mono">PROTECTED</span>
        </div>
      </div>

      {/* Terminal body */}
      <div
        className="terminal bg-gray-950/95 p-6 min-h-[320px] text-sm leading-6"
        role="log"
        aria-label="AegisNode terminal demonstration"
        aria-live="polite"
      >
        <div className="text-gray-600 mb-4 text-xs">Microsoft Windows PowerShell (v7.4.0)</div>

        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`${LINE_COLORS[line.type] || 'text-gray-300'} font-mono`}
          >
            {line.type === 'input' ? (
              <span>
                <span className="text-aegis-400">PS C:\projects\myapp</span>
                <span className="text-gray-500">&gt;</span>{' '}
                {line.text.replace('$ ', '')}
              </span>
            ) : (
              line.text || '\u00A0'
            )}
          </div>
        ))}

        {/* Cursor */}
        {visibleLines > 0 && (
          <span
            className="inline-block w-2 h-4 bg-aegis-400 ml-0.5"
            style={{ opacity: showCursor ? 1 : 0 }}
          />
        )}
      </div>
    </div>
  );
}
