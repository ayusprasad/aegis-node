/**
 * AegisNode Proxy Runner
 *
 * This is the core intercept engine. It is called by aegisnode-proxy
 * when npm commands are intercepted.
 *
 * CRITICAL DESIGN NOTE - Infinite Loop Prevention:
 * This runner MUST find the ABSOLUTE path to the real npm-cli.js and
 * invoke it via the absolute path of node.exe. Never spawn "npm" here,
 * as that would re-trigger the PowerShell function, causing infinite recursion.
 *
 * Execution Flow:
 *   1. Parse args to detect install/i/add commands and extract package names
 *   2. For each package, run evaluation pipeline:
 *      a. Check local blocklist cache
 *      b. If not found, query the configured heuristic API
 *   3. If any package is blocked: write LLM-formatted error to stderr, exit 1
 *   4. If all packages are safe: spawn real npm with original args, stream I/O
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { checkBlocklist } from '../cache/blocklistCache';
import { queryHeuristicApi } from '../evaluator/heuristicEvaluator';

// ─── Constants ────────────────────────────────────────────────────────────────

const INSTALL_COMMANDS = new Set(['install', 'i', 'add', 'isntall', 'instal']);

// ─── Types ────────────────────────────────────────────────────────────────────

interface PackageCheckResult {
  packageName: string;
  blocked: boolean;
  reason: string;
  severity?: string;
}

// ─── Real npm Path Resolution ─────────────────────────────────────────────────

/**
 * Resolve the absolute path to the real npm-cli.js.
 *
 * Strategy:
 *   1. Use the npm_execpath env var (set by npm itself when running scripts)
 *   2. Locate node executable and derive npm path relative to it
 *   3. Search common Windows installation locations
 *   4. Fall back to npm in PATH (last resort, risk of loop if in same shell session)
 */
function resolveRealNpmPath(): { nodePath: string; npmCliPath: string } | null {
  const configuredNodePath = process.env['AEGISNODE_NODE_PATH'];
  const configuredNpmPath = process.env['AEGISNODE_NPM_PATH'];

  if (
    configuredNodePath &&
    configuredNpmPath &&
    fs.existsSync(configuredNodePath) &&
    fs.existsSync(configuredNpmPath)
  ) {
    return { nodePath: configuredNodePath, npmCliPath: configuredNpmPath };
  }

  if (configuredNpmPath && fs.existsSync(configuredNpmPath)) {
    return { nodePath: process.execPath, npmCliPath: configuredNpmPath };
  }

  // Strategy 1: npm sets this env var when spawning child processes
  const npmExecPath = process.env['npm_execpath'];
  if (npmExecPath && fs.existsSync(npmExecPath)) {
    return {
      nodePath: process.execPath, // current node.exe
      npmCliPath: npmExecPath,
    };
  }

  // Strategy 2: Derive from process.execPath (e.g. C:\Program Files\nodejs\node.exe)
  // npm-cli.js lives at: <nodedir>\node_modules\npm\bin\npm-cli.js
  const nodeDir = path.dirname(process.execPath);
  const candidates = [
    path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    // Common Windows global install paths
    path.join('C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js'),
    path.join('C:\\Program Files (x86)\\nodejs\\node_modules\\npm\\bin\\npm-cli.js'),
    path.join(process.env['APPDATA'] || '', 'npm', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return {
        nodePath: process.execPath,
        npmCliPath: candidate,
      };
    }
  }

  return null;
}

// ─── Package Name Parser ──────────────────────────────────────────────────────

/**
 * Parse npm args to extract package names from install/i/add commands.
 * Handles: npm install express, npm i -D lodash, npm add react react-dom
 * Ignores flags like --save, --save-dev, -D, -P, -E, -g, etc.
 */
function parsePackageNames(args: string[]): {
  isInstallCommand: boolean;
  command: string;
  packages: string[];
  flags: string[];
} {
  if (args.length === 0) {
    return { isInstallCommand: false, command: '', packages: [], flags: [] };
  }

  const command = args[0] || '';
  const isInstallCommand = INSTALL_COMMANDS.has(command.toLowerCase());

  if (!isInstallCommand) {
    return { isInstallCommand: false, command, packages: [], flags: [] };
  }

  const packages: string[] = [];
  const flags: string[] = [];

  const isNonRegistrySpec = (value: string): boolean => {
    const normalized = value.toLowerCase();
    return normalized.startsWith('git+') ||
      normalized.startsWith('git://') ||
      normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.startsWith('file:') ||
      normalized.startsWith('link:') ||
      normalized.startsWith('workspace:') ||
      normalized.includes('npm:') ||
      normalized === '.' ||
      normalized === '..' ||
      normalized.startsWith('.\\') ||
      normalized.startsWith('./') ||
      normalized.startsWith('..\\') ||
      normalized.startsWith('../') ||
      normalized.startsWith('\\') ||
      /^[a-z]:[\\/]/i.test(value);
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i] || '';
    if (arg.startsWith('-') || arg.startsWith('--')) {
      flags.push(arg);
      // Some flags consume the next argument (e.g., --workspace <name>)
      if ((arg === '--workspace' || arg === '-w') && i + 1 < args.length) {
        flags.push(args[i + 1] || '');
        i++;
      }
    } else {
      if (isNonRegistrySpec(arg)) continue;
      // Package name may include version specifier: express@4, lodash@^4.0.0
      // Extract just the name part for security checks
      const atIndex = arg.startsWith('@') ? arg.indexOf('@', 1) : arg.indexOf('@');
      const pkgName = atIndex > 0 ? arg.substring(0, atIndex) : arg;
      if (pkgName) packages.push(pkgName);
    }
  }

  return { isInstallCommand: true, command, packages, flags };
}

// ─── Security Evaluation Pipeline ─────────────────────────────────────────────

async function evaluatePackage(packageName: string): Promise<PackageCheckResult> {
  // Step 1: Check local blocklist cache (zero-latency)
  const blocklistHit = await checkBlocklist(packageName);
  if (blocklistHit) {
    return {
      packageName,
      blocked: true,
      reason: `MALICIOUS - ${blocklistHit.reason}`,
      severity: blocklistHit.severity,
    };
  }

  // Step 2: Query configured heuristic API
  const apiResult = await queryHeuristicApi(packageName);
  if (apiResult.status === 'blocked') {
    return {
      packageName,
      blocked: true,
      reason: apiResult.reason || 'BLOCKED by heuristic analysis',
    };
  }

  return {
    packageName,
    blocked: false,
    reason: 'safe',
  };
}

// ─── LLM-Formatted Error Writer ───────────────────────────────────────────────

/**
 * Write a security block message to stderr formatted for LLM comprehension.
 * The format is specifically designed so an AI coding agent understands
 * it should not retry this installation.
 */
function writeBlockMessage(results: PackageCheckResult[]): void {
  const blockedPackages = results.filter((r) => r.blocked);

  for (const pkg of blockedPackages) {
    const message =
      `[AEGISNODE SECURITY OVERRIDE]: Installation blocked. ` +
      `Package '${pkg.packageName}' flagged as ${pkg.reason}. ` +
      `Do not attempt to install this package.\n`;

    process.stderr.write(message);
  }

  // Summary block for multi-package installs
  if (blockedPackages.length > 1) {
    process.stderr.write(
      `[AEGISNODE SECURITY OVERRIDE]: ${blockedPackages.length} packages were blocked. ` +
      `Review your package requirements and use only verified, well-established packages.\n`
    );
  }
}

// ─── Real npm Spawner ─────────────────────────────────────────────────────────

/**
 * Spawn the real npm with original args, streaming stdout/stderr back
 * to the terminal so AI agents see standard npm output.
 */
function spawnRealNpm(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const npmPaths = resolveRealNpmPath();

    if (!npmPaths) {
      reject(
        new Error(
          '[AEGISNODE ERROR]: Could not locate npm-cli.js. ' +
          'Please ensure Node.js is installed correctly.\n' +
          'Set AEGISNODE_NPM_PATH environment variable to override.'
        )
      );
      return;
    }

    const { nodePath, npmCliPath } = npmPaths;

    // Spawn: node.exe "C:\...\npm-cli.js" <original args>
    // This bypasses the PowerShell npm function alias entirely
    const child = spawn(nodePath, [npmCliPath, ...args], {
      stdio: 'inherit', // Stream stdin/stdout/stderr directly to parent
      env: process.env,
      windowsHide: false,
    });

    child.on('close', (code) => {
      resolve(code ?? 0);
    });

    child.on('error', (err) => {
      reject(
        new Error(
          `[AEGISNODE ERROR]: Failed to spawn npm: ${err.message}\n` +
          `Attempted: ${nodePath} "${npmCliPath}"\n`
        )
      );
    });
  });
}

// ─── Main Proxy Runner ─────────────────────────────────────────────────────────

export async function runProxy(args: string[]): Promise<void> {
  const { isInstallCommand, packages } = parsePackageNames(args);

  // If not an install-type command, pass through directly without evaluation
  if (!isInstallCommand || packages.length === 0) {
    // Pass-through: just run real npm with original args
    const exitCode = await spawnRealNpm(args).catch((err: Error) => {
      process.stderr.write(err.message + '\n');
      return 2;
    });
    process.exit(exitCode);
    return;
  }

  // Show interception banner
  process.stderr.write(
    chalk.cyan(`\n[AegisNode] Intercepting npm install - evaluating ${packages.length} package(s)...\n`)
  );

  // Evaluate all packages in parallel for speed
  const results = await Promise.all(packages.map((pkg) => evaluatePackage(pkg)));

  const blockedResults = results.filter((r) => r.blocked);
  const safeResults = results.filter((r) => !r.blocked);

  // Display evaluation summary
  for (const result of results) {
    if (result.blocked) {
      process.stderr.write(
        chalk.red(`  ✗ ${result.packageName}`) +
        chalk.gray(` → ${result.reason}`) + '\n'
      );
    } else {
      process.stderr.write(
        chalk.green(`  ✓ ${result.packageName}`) +
        chalk.gray(` → safe`) + '\n'
      );
    }
  }

  process.stderr.write('\n');

  // If any packages are blocked, halt the entire installation
  if (blockedResults.length > 0) {
    writeBlockMessage(results);
    process.exit(1);
    return;
  }

  // All packages are safe - proceed with real npm
  process.stderr.write(
    chalk.green(`[AegisNode] All ${safeResults.length} package(s) verified safe. Proceeding...\n\n`)
  );

  const exitCode = await spawnRealNpm(args).catch((err: Error) => {
    process.stderr.write(err.message + '\n');
    return 2;
  });

  process.exit(exitCode);
}
