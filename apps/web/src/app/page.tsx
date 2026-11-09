'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, useAnimation } from 'framer-motion';
import { ShieldCheck, ChevronRight, ExternalLink, Search, Terminal, AlertTriangle, ShieldAlert } from 'lucide-react';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import ThreatDemo from '@/components/ThreatDemo';

/* ── animated stat counter ───────────────────────────────────────────── */
function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const duration = 1400;
      const steps = 40;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setCount(Math.round((end * step) / steps));
        if (step >= steps) clearInterval(timer);
      }, duration / steps);
    }
  }, [isInView, end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black gradient-blue tabular-nums mb-2">
        {count}{suffix}
      </div>
      <div className="text-sm font-medium text-gray-400">{label}</div>
    </div>
  );
}

/* ── animated terminal demo ──────────────────────────────────────────── */
const DEMO_LINES = [
  { ms: 0,    text: 'npm install express-router-util mongose reactt',  type: 'cmd' },
  { ms: 500,  text: '',                                                  type: 'blank' },
  { ms: 600,  text: '[AegisNode] Evaluating 3 packages...',             type: 'info' },
  { ms: 1100, text: '  ✗ express-router-util  →  HALLUCINATED',        type: 'err' },
  { ms: 1500, text: '  ✗ mongose              →  TYPOSQUAT of mongoose',type: 'err' },
  { ms: 1900, text: '  ✗ reactt               →  TYPOSQUAT of react',  type: 'err' },
  { ms: 2300, text: '',                                                  type: 'blank' },
  { ms: 2400, text: "[AEGISNODE SECURITY OVERRIDE]: Installation blocked.",      type: 'override' },
  { ms: 2500, text: "Package 'express-router-util' flagged as HALLUCINATED.",    type: 'override' },
  { ms: 2600, text: "Package 'mongose' flagged as TYPOSQUAT. Do not install.",   type: 'override' },
  { ms: 2700, text: "Package 'reactt' flagged as TYPOSQUAT. Do not install.",    type: 'override' },
  { ms: 3100, text: '',                                                  type: 'blank' },
  { ms: 3200, text: 'npm install express mongoose react',               type: 'cmd2' },
  { ms: 3700, text: '[AegisNode] Evaluating 3 packages...',             type: 'info' },
  { ms: 4100, text: '  ✓ express    →  safe',                          type: 'ok' },
  { ms: 4400, text: '  ✓ mongoose   →  safe',                          type: 'ok' },
  { ms: 4700, text: '  ✓ react      →  safe',                          type: 'ok' },
  { ms: 5000, text: '',                                                  type: 'blank' },
  { ms: 5100, text: '[AegisNode] All 3 verified. Proceeding...',        type: 'success' },
  { ms: 5200, text: 'added 247 packages in 3.1s',                      type: 'npm' },
];

const LINE_STYLE: Record<string, string> = {
  cmd:      'text-gray-100',
  cmd2:     'text-gray-100',
  blank:    'text-transparent select-none',
  info:     'text-blue-400 font-semibold',
  err:      'text-red-400 font-medium',
  override: 'text-red-300 font-bold',
  ok:       'text-emerald-400 font-medium',
  success:  'text-emerald-400 font-bold',
  npm:      'text-gray-500',
};

function HeroTerminal() {
  const [shown, setShown] = useState(0);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const timers = DEMO_LINES.map((l, i) =>
      setTimeout(() => setShown(i + 1), l.ms)
    );
    const restart = setTimeout(() => setShown(0), DEMO_LINES[DEMO_LINES.length-1].ms + 3500);
    return () => [...timers, restart].forEach(clearTimeout);
  }, [shown === 0 ? 0 : undefined]);

  useEffect(() => {
    const id = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/10"
      style={{ boxShadow: '0 0 0 1px rgba(59,130,246,0.1), 0 32px 64px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.06)' }}
    >
      {/* title bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="flex-1 text-center text-xs text-gray-500 font-mono">
          Windows PowerShell — AegisNode
        </span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-500 font-mono font-medium">PROTECTED</span>
        </div>
      </div>

      {/* body */}
      <div
        className="terminal bg-[#080d1a] p-5 text-sm md:text-[15px] leading-7 min-h-[400px] overflow-x-auto"
        role="log"
        aria-label="Live AegisNode terminal demo"
        aria-live="polite"
      >
        <p className="text-gray-600 text-xs mb-4 font-mono">Windows PowerShell 7.4.0 — AegisNode v1.0.0</p>

        {DEMO_LINES.slice(0, shown).map((line, i) => (
          <div key={i} className={`font-mono ${LINE_STYLE[line.type]}`}>
            {line.type === 'cmd' || line.type === 'cmd2' ? (
              <>
                <span className="text-blue-500 font-bold">PS</span>
                <span className="text-gray-400"> ~/project</span>
                <span className="text-blue-400 font-bold"> ❯ </span>
                {line.text}
              </>
            ) : (
              line.text || '\u00A0'
            )}
          </div>
        ))}

        {/* blinking cursor */}
        {shown > 0 && (
          <span
            className="inline-block w-2.5 h-[16px] bg-blue-400 translate-y-[2px] ml-1"
            style={{ opacity: cursor ? 1 : 0, transition: 'opacity 0.05s' }}
          />
        )}
      </div>
    </div>
  );
}

/* ── threat type card ────────────────────────────────────────────────── */
function ThreatTypeCard({
  icon: Icon, label, color, example, description,
}: {
  icon: any; label: string; color: string; example: string; description: string;
}) {
  const colorMap: Record<string, string> = {
    red:    'from-red-950/60 border-red-800/30 text-red-400',
    orange: 'from-orange-950/60 border-orange-800/30 text-orange-400',
    yellow: 'from-yellow-950/60 border-yellow-800/30 text-yellow-400',
  };
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className={`glass rounded-2xl p-6 bg-gradient-to-b ${colorMap[color]} shadow-xl`}
    >
      <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center mb-5 border border-white/5">
        <Icon className="w-6 h-6" style={{ color: 'inherit' }} />
      </div>
      <h3 className="text-lg font-bold mb-2 font-mono uppercase tracking-wider" style={{ color: 'inherit' }}>{label}</h3>
      <code className="text-xs text-gray-300 font-mono block mb-4 bg-black/40 px-3 py-2 rounded-lg border border-white/5">{example}</code>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

/* ── flow step ───────────────────────────────────────────────────────── */
function FlowStep({
  num, title, sub, icon: Icon, isLast = false,
}: {
  num: string; title: string; sub: string; icon: any; isLast?: boolean;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      className="flex gap-5 items-start"
    >
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-blue-950/80 border border-blue-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <span className="text-blue-400 font-black font-mono text-sm">{num}</span>
        </div>
        {!isLast && <div className="w-px h-full bg-gradient-to-b from-blue-500/40 to-transparent mt-3 min-h-[40px]" />}
      </div>
      <div className="pb-10 pt-1">
        <div className="flex items-center gap-3 mb-2">
          <Icon className="w-5 h-5 text-blue-400" />
          <span className="text-xl font-bold text-white tracking-tight">{title}</span>
        </div>
        <p className="text-base text-gray-400 leading-relaxed max-w-lg">{sub}</p>
      </div>
    </motion.div>
  );
}

/* ── install step ────────────────────────────────────────────────────── */
function InstallStep({ n, cmd, label, note }: { n: number; cmd: string; label: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass rounded-xl overflow-hidden mb-4 border-white/[0.08]"
    >
      <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold font-mono text-sm shrink-0">
          {n}
        </div>
        <span className="text-sm font-semibold text-gray-200">{label}</span>
        {note && <span className="ml-auto text-xs text-gray-500 italic hidden sm:block">{note}</span>}
        <button
          onClick={copy}
          className="ml-auto text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          aria-label={`Copy command for step ${n}`}
        >
          {copied ? (
            <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Copied!</span>
          ) : (
            <span className="flex items-center gap-1"><Terminal className="w-4 h-4"/> Copy</span>
          )}
        </button>
      </div>
      <pre className="terminal px-5 py-4 text-sm text-emerald-300 overflow-x-auto bg-black/40">
        <code>{cmd}</code>
      </pre>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050810] overflow-x-hidden selection:bg-blue-500/30">
      {/* Background layers */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.15) 0%, transparent 80%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle 800px at 80% 80%, rgba(99,102,241,0.08) 0%, transparent 100%)',
      }} />

      <NavBar />

      {/* ═══════════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section id="hero" className="relative pt-40 pb-24 px-6 text-center">
        {/* top badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 glass-blue px-4 py-2 rounded-full text-sm text-blue-400 font-medium mb-10 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse flex-shrink-0" />
          Windows-native npm Security Middleware
        </motion.div>

        {/* headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-7xl md:text-[88px] font-black tracking-tighter leading-[1.05] mb-8"
        >
          <span className="gradient-text drop-shadow-2xl">AegisNode</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-6 max-w-4xl mx-auto leading-tight"
        >
          Your AI coding agent just tried to install a package that&nbsp;
          <span className="gradient-red">doesn&apos;t exist.</span>
        </motion.p>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
        >
          AegisNode intercepts every <code className="text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-md font-mono text-base border border-blue-500/20">npm install</code> before
          it runs. It blocks hallucinated package names, typosquatting attacks, and known malware instantly.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-5 justify-center mb-20"
        >
          <Link href="#install" className="btn-primary text-lg">
            Install in 60 seconds <ChevronRight className="w-5 h-5" />
          </Link>
          <Link href="#demo" className="btn-secondary text-lg">
            Try live scanner
          </Link>
          <a
            href="https://github.com/priyansupattanaik/aegis-node"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-lg group"
          >
            <GithubIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            GitHub
          </a>
        </motion.div>

        {/* terminal */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, type: 'spring' }}
          className="max-w-4xl mx-auto"
        >
          <HeroTerminal />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          THE PROBLEM
          ═══════════════════════════════════════════════════════════════ */}
      <section id="problem" className="section-divider relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge-warn inline-flex mb-5 px-4 py-1.5 text-sm">⚠ The Problem</div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
              AI agents install packages blindly
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Tools like GitHub Copilot, Cursor, Claude, and Devin generate and run 
              <code className="text-blue-400 mx-1.5 bg-blue-950/40 px-1.5 rounded">npm install</code>
              commands without verifying if the package exists or is safe. This causes three types of attacks:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ThreatTypeCard
              icon={Search}
              label="Hallucinated"
              color="red"
              example="npm install express-router-util"
              description="AI models invent package names that sound plausible but don't exist. Attackers register these names with malicious payloads waiting to be installed."
            />
            <ThreatTypeCard
              icon={AlertTriangle}
              label="Typosquat"
              color="orange"
              example="npm install mongose  # mongoose"
              description="One-character typos in popular package names lead to malicious clones. The package installs fine but runs a backdoor, cryptominer, or credential stealer."
            />
            <ThreatTypeCard
              icon={ShieldAlert}
              label="Supply Chain"
              color="yellow"
              example="npm install event-stream@3.3.6"
              description="Real packages that were compromised after becoming popular. AegisNode maintains a curated blocklist of confirmed supply-chain attack packages."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="section-divider border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge-info inline-flex mb-5 px-4 py-1.5 text-sm">⚙ How It Works</div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
              Three layers. Zero friction.
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Every <code className="text-blue-400 mx-1 bg-blue-950/40 px-1.5 rounded border border-blue-500/20">npm install</code> runs through
              a three-layer evaluation pipeline. Safe packages proceed instantly. Blocked packages never touch your disk.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* flow diagram */}
            <div className="glass rounded-3xl p-8 shadow-2xl">
              <FlowStep
                num="01" icon={Terminal}
                title="Shell Intercept"
                sub="aegisnode init injects a function into your PowerShell $PROFILE. Every npm install is silently routed to aegisnode-proxy — you never notice the difference for safe packages."
              />
              <FlowStep
                num="02" icon={Search}
                title="Package Name Extraction"
                sub="The proxy parses the full npm command, extracting package names while ignoring flags (--save-dev, -D, -g etc). Scoped packages and version specifiers handled correctly."
              />
              <FlowStep
                num="03" icon={ShieldAlert}
                title="Local Cache Check"
                sub="First checks %LOCALAPPDATA%\AegisNode\cache.json — a local copy of the configured blocklist refreshed every 24 hours. Zero network latency, works offline."
              />
              <FlowStep
                num="04" icon={AlertTriangle}
                title="Heuristic API Analysis"
                sub="Unknown packages are sent to the /api/verify endpoint which checks: registry existence, publish age, download counts, and Levenshtein distance against top packages."
              />
              <FlowStep
                num="05" icon={ShieldCheck}
                title="Safe → Real npm Spawns"
                sub="Verified packages are passed to the real npm-cli.js via absolute path — preventing infinite loops. Full stdout/stderr streaming so AI agents see normal output."
                isLast
              />
            </div>

            {/* layer cards */}
            <div className="space-y-6">
              {[
                {
                  layer: 'Layer 1',
                  name: 'Local Blocklist Cache',
                  latency: '< 1ms',
                  color: 'blue',
                  desc: 'Downloads a curated blocklist from AEGISNODE_BLOCKLIST_URL once every 24 hours and stores it locally. Catches known malicious packages with zero network round-trip.',
                  checks: ['crossenv', 'event-stream', 'ua-parser-js', 'nodemailer-js', '+ 16 more'],
                },
                {
                  layer: 'Layer 2',
                  name: 'npm Registry Check',
                  latency: '~200ms',
                  color: 'purple',
                  desc: 'Queries registry.npmjs.org for the package. If it returns 404, the package is flagged as HALLUCINATED — it simply doesn\'t exist.',
                  checks: ['404 → HALLUCINATED', 'Published < 48h + downloads < 100 → SUSPICIOUS'],
                },
                {
                  layer: 'Layer 3',
                  name: 'Levenshtein Typosquat',
                  latency: '~5ms',
                  color: 'cyan',
                  desc: 'Computes edit distance against the top 1,000 npm packages. A distance of 1-2 characters from a popular package is a strong typosquat signal.',
                  checks: ['reactt → react (dist 1)', 'expres → express (dist 1)', 'mongose → mongoose (dist 1)'],
                },
              ].map((item, idx) => {
                const colorStyles: Record<string, string> = {
                  blue:   'border-blue-500/30 bg-blue-950/20',
                  purple: 'border-purple-500/30 bg-purple-950/20',
                  cyan:   'border-cyan-500/30 bg-cyan-950/20',
                };
                const badgeStyles: Record<string, string> = {
                  blue:   'bg-blue-600/20 text-blue-400 border-blue-500/40',
                  purple: 'bg-purple-600/20 text-purple-400 border-purple-500/40',
                  cyan:   'bg-cyan-600/20 text-cyan-400 border-cyan-500/40',
                };
                return (
                  <motion.div 
                    key={item.layer}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={`rounded-2xl border p-6 ${colorStyles[item.color]} backdrop-blur-sm`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-black font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${badgeStyles[item.color]}`}>
                        {item.layer}
                      </span>
                      <span className="text-sm font-bold text-gray-500 font-mono">{item.latency}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                    <p className="text-base text-gray-400 mb-4 leading-relaxed">{item.desc}</p>
                    <div className="space-y-2">
                      {item.checks.map((c) => (
                        <div key={c} className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                          <span className="text-red-500 font-bold">✗</span> {c}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          STATS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-y border-white/[0.04] py-20 px-6 bg-[#0a0f1e]/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          <StatCounter end={20}  suffix="+"  label="Threats Blocked" />
          <StatCounter end={1}   suffix="ms" label="Cache Latency" />
          <StatCounter end={24}  suffix="h"  label="Blocklist TTL" />
          <StatCounter end={1000} suffix="+" label="Typosquat DB Size" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LIVE DEMO
          ═══════════════════════════════════════════════════════════════ */}
      <section id="demo" className="section-divider border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="badge-info inline-flex mb-5 px-4 py-1.5 text-sm">🔍 Live Scanner</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
              Check any package right now
            </h2>
            <p className="text-gray-400 text-lg">
              The scanner hits the real npm registry and our heuristic engine — the exact same logic the CLI uses.
            </p>
          </div>
          <ThreatDemo />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          INSTALL
          ═══════════════════════════════════════════════════════════════ */}
      <section id="install" className="section-divider border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="badge-safe inline-flex mb-5 px-4 py-1.5 text-sm">🚀 Quick Install</div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-5 tracking-tight">
              Up and running in 60 seconds
            </h2>
            <p className="text-gray-400 text-lg">Windows PowerShell · Node.js 18+ required</p>
          </div>

          <div className="space-y-4">
            <InstallStep n={1} cmd="npm install -g aegisnode-cli" label="Install globally via npm" />
            <InstallStep n={2} cmd="aegisnode init" label="Inject shell hooks + download blocklist" note="Requires terminal restart" />
            <InstallStep n={3} cmd="# Close this PowerShell window and open a new one" label="Restart PowerShell" />
            <InstallStep n={4} cmd="aegisnode status" label="Verify protection is active" />
            <InstallStep n={5} cmd={"# Test — this will be BLOCKED:\nnpm install crossenv\n\n# Test — this will PASS:\nnpm install express"} label="Test the protection" />
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 glass rounded-2xl p-6 border-l-4 border-yellow-500/70"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-yellow-400" />
              <p className="text-base text-yellow-400 font-bold">What gets injected?</p>
            </div>
            <p className="text-base text-gray-300 leading-relaxed">
              A single PowerShell function in your <code className="text-blue-300 bg-blue-900/40 px-1.5 rounded">$PROFILE</code> file and a CMD AutoRun registry key.
              Both are clearly marked and easy to remove with <code className="text-blue-300 bg-blue-900/40 px-1.5 rounded">aegisnode uninstall</code> at any time.
              No core system files are modified.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA BANNER
          ═══════════════════════════════════════════════════════════════ */}
      <section className="section-divider border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
            viewport={{ once: true }}
          >
            <ShieldCheck className="w-20 h-20 text-blue-500 mx-auto mb-8 animate-float drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Protect your next project
          </h2>
          <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            One command. No configuration. Works seamlessly with every AI coding tool on Windows.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link href="#install" className="btn-primary text-lg px-8">
              Install AegisNode free <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/docs" className="btn-secondary text-lg px-8">
              Read the documentation
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-8 font-medium">
            Free & open source · MIT License · No telemetry · No accounts required.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
