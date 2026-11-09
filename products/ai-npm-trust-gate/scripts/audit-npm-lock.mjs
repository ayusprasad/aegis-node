#!/usr/bin/env node

/**
 * Read-only, offline review of an npm manifest and package lock.
 * This reports review signals; it is not a malware detector or safety verdict.
 */
import fs from 'node:fs';
import path from 'node:path';

const INSTALL_SCRIPT_FLAG = 'hasInstallScript';
const MAX_EXAMPLES_PER_SIGNAL = 30;

function usage() {
  return [
    'Usage: node audit-npm-lock.mjs [--dir PROJECT] [--json] [--help]',
    '',
    'Reads package.json and npm-shrinkwrap.json or package-lock.json.',
    'Supports npm lockfile versions 1, 2, and 3. Makes no network calls',
    'and does not run npm or write files.',
  ].join('\n');
}

function parseArgs(argv) {
  const options = { dir: process.cwd(), json: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dir') {
      if (!argv[i + 1]) throw new Error('--dir requires a path');
      options.dir = argv[++i];
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw new Error(`Could not read valid JSON at ${filePath}: ${error.message}`);
  }
}

function packageNameFromLocation(location, fallback) {
  const parts = location.split('/');
  let found = fallback || location;
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i] !== 'node_modules' || !parts[i + 1]) continue;
    if (parts[i + 1].startsWith('@') && parts[i + 2]) {
      found = `${parts[i + 1]}/${parts[i + 2]}`;
      i += 2;
    } else {
      found = parts[i + 1];
      i += 1;
    }
  }
  return found;
}

function collectV1Dependencies(dependencies, prefix = '') {
  const entries = [];
  for (const [name, item] of Object.entries(dependencies || {})) {
    const location = prefix ? `${prefix}/node_modules/${name}` : `node_modules/${name}`;
    entries.push({
      location,
      name,
      version: item?.version ?? null,
      resolved: item?.resolved ?? null,
      integrity: item?.integrity ?? null,
      hasInstallScript: item?.[INSTALL_SCRIPT_FLAG] === true,
      link: item?.link === true,
      inBundle: item?.inBundle === true,
    });
    entries.push(...collectV1Dependencies(item?.dependencies, location));
  }
  return entries;
}

function collectPackages(lock) {
  if (lock?.packages && typeof lock.packages === 'object') {
    const entries = [];
    for (const [location, item] of Object.entries(lock.packages)) {
      if (!location || !item || typeof item !== 'object') continue;
      entries.push({
        location,
        name: packageNameFromLocation(location, item.name),
        version: item.version ?? null,
        resolved: item.resolved ?? null,
        integrity: item.integrity ?? null,
        hasInstallScript: item[INSTALL_SCRIPT_FLAG] === true,
        link: item.link === true,
        inBundle: item.inBundle === true,
      });
    }
    return { entries, rootDependencies: lock.packages['']?.dependencies ?? null };
  }

  return {
    entries: collectV1Dependencies(lock?.dependencies),
    rootDependencies: null,
  };
}

function isRegistryNpmUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname === 'registry.npmjs.org';
  } catch {
    return false;
  }
}

function isSourceSpec(spec) {
  return /^(?:file:|link:|workspace:|git\+|git:|github:|https?:\/\/)/i.test(spec);
}

function describeSourceSpec(spec) {
  if (/^workspace:/i.test(spec)) return 'workspace protocol';
  if (/^(?:file:|link:)/i.test(spec)) return 'local file or link protocol';
  if (/^(?:git\+|git:|github:)/i.test(spec)) return 'Git-based source';
  if (/^https?:\/\//i.test(spec)) return 'direct URL source';
  return 'non-registry source';
}

function describeResolution(value) {
  const normalized = value.replace(/^git\+/i, '');
  try {
    const parsed = new URL(normalized);
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}/[path and credentials omitted]`;
  } catch {
    return 'non-standard or local resolution (value omitted)';
  }
}

function addSignal(signals, code, level, message, packageName = null, location = null) {
  signals.push({ code, level, message, package: packageName, location });
}

function analyze(root, manifest, lock, lockName) {
  const signals = [];
  const dependencySections = ['dependencies', 'devDependencies', 'optionalDependencies'];
  const direct = new Map();
  for (const section of dependencySections) {
    const values = manifest[section];
    if (!values || typeof values !== 'object' || Array.isArray(values)) continue;
    for (const [name, spec] of Object.entries(values)) {
      direct.set(name, { spec: String(spec), sections: [...(direct.get(name)?.sections || []), section] });
      if (isSourceSpec(String(spec))) {
        addSignal(signals, 'direct-source-spec', 'REVIEW', `Direct dependency uses a ${describeSourceSpec(String(spec))}. Verify ownership, immutability, and policy.`, name, `package.json:${section}`);
      }
    }
  }

  if (!lock) {
    if (direct.size > 0) {
      addSignal(signals, 'lockfile-missing', 'HOLD', `${direct.size} direct dependencies are declared, but no npm lockfile was found.`);
    } else {
      addSignal(signals, 'lockfile-missing', 'INFO', 'No npm lockfile was found. This scan cannot inspect a resolved dependency tree.');
    }
    return { signals, direct, entries: [], lockfileVersion: null };
  }

  const { entries, rootDependencies } = collectPackages(lock);
  const lockedNames = new Set(entries.map((entry) => entry.name));
  for (const [name, item] of direct) {
    if (!lockedNames.has(name)) {
      addSignal(signals, 'direct-dependency-not-in-lock', 'HOLD', 'Declared direct dependency has no matching package entry in the lockfile.', name, `${lockName}:packages`);
    }
    if (rootDependencies && Object.hasOwn(rootDependencies, name) && String(rootDependencies[name]) !== item.spec) {
      addSignal(signals, 'manifest-lock-spec-drift', 'HOLD', `Manifest spec ${JSON.stringify(item.spec)} differs from lockfile root spec ${JSON.stringify(String(rootDependencies[name]))}.`, name, `${lockName}:packages[""]`);
    }
  }

  for (const entry of entries) {
    if (entry.link) {
      addSignal(signals, 'linked-package', 'REVIEW', 'Lockfile entry is a local link; verify the linked source and workspace boundary.', entry.name, entry.location);
    } else if (entry.resolved && !isRegistryNpmUrl(entry.resolved)) {
      addSignal(signals, 'non-default-resolution', 'REVIEW', `Resolved from a non-default npm URL or source (${describeResolution(entry.resolved)}). Confirm the expected registry/source and pin.`, entry.name, entry.location);
    } else if (entry.resolved && isRegistryNpmUrl(entry.resolved) && !entry.integrity && !entry.inBundle) {
      addSignal(signals, 'registry-artifact-without-integrity', 'REVIEW', 'Registry tarball has no integrity value in this lock entry; verify the lockfile and package-manager behavior.', entry.name, entry.location);
    }
    if (entry.hasInstallScript) {
      addSignal(signals, 'install-script-flag', 'REVIEW', 'Lockfile marks this package as having an install-time script. Inspect the exact package/version script and its effects; the flag alone does not imply malice.', entry.name, entry.location);
    }
  }

  if (lock.lockfileVersion === 1) {
    addSignal(signals, 'legacy-lockfile-format', 'INFO', 'npm lockfile version 1 carries less package-tree metadata than versions 2 and 3.');
  } else if (![2, 3].includes(lock.lockfileVersion)) {
    addSignal(signals, 'unrecognized-lockfile-format', 'REVIEW', `Lockfile version ${String(lock.lockfileVersion)} is outside the scanner's documented 1–3 range.`);
  }

  return { signals, direct, entries, lockfileVersion: lock.lockfileVersion ?? null, root };
}

function toReport(root, manifest, lockName, analysis) {
  const counts = { BLOCK: 0, HOLD: 0, REVIEW: 0, INFO: 0 };
  const grouped = new Map();
  for (const signal of analysis.signals) {
    counts[signal.level] = (counts[signal.level] || 0) + 1;
    const group = grouped.get(signal.code) || { code: signal.code, level: signal.level, count: 0, examples: [] };
    group.count += 1;
    if (group.examples.length < MAX_EXAMPLES_PER_SIGNAL) group.examples.push(signal);
    grouped.set(signal.code, group);
  }
  return {
    tool: 'AI npm Trust Gate offline static scanner',
    project: root,
    manifest: manifest.name ?? null,
    lockfile: lockName,
    lockfileVersion: analysis.lockfileVersion,
    directDependencyCount: analysis.direct.size,
    lockedPackageEntryCount: analysis.entries.length,
    signalCounts: counts,
    signalGroups: [...grouped.values()],
    limitations: [
      'No network requests or package-manager commands were made.',
      'Package source code and lifecycle-script bodies were not inspected or executed.',
      'Older lockfile formats may omit lifecycle-script metadata; no flag does not prove scripts are absent.',
      'No malware, advisory, maintainer, provenance, signature, or reputation lookup was performed.',
      'A lack of static signals is not a safety verdict.',
    ],
  };
}

function printHuman(report) {
  console.log('AI npm Trust Gate — offline static scan');
  console.log(`Project: ${report.project}`);
  console.log(`Manifest: ${report.manifest || 'unnamed package.json'}`);
  console.log(`Lockfile: ${report.lockfile || 'not found'}${report.lockfileVersion ? ` (version ${report.lockfileVersion})` : ''}`);
  console.log(`Direct dependencies: ${report.directDependencyCount}`);
  console.log(`Locked package entries: ${report.lockedPackageEntryCount}`);
  console.log(`Signals: ${JSON.stringify(report.signalCounts)}`);

  const samples = report.signalGroups.flatMap((group) => group.examples);
  if (samples.length === 0) {
    console.log('No static review signals found. This does not establish that dependencies are safe.');
  } else {
    console.log('\nReview signals:');
    for (const signal of samples) {
      const subject = signal.package ? ` ${signal.package}` : '';
      const where = signal.location ? ` (${signal.location})` : '';
      console.log(`- [${signal.level}] ${signal.code}${subject}${where}: ${signal.message}`);
    }
    const omitted = report.signalGroups.reduce((sum, group) => sum + group.count - group.examples.length, 0);
    if (omitted > 0) console.log(`- ${omitted} additional signal(s) omitted from the display; use --json for structured details.`);
  }

  console.log('\nNo network, npm command, package execution, or file write was performed.');
  console.log('Use these signals to guide evidence collection; this scan does not issue a safety verdict.');
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }

  const root = path.resolve(options.dir);
  const manifestPath = path.join(root, 'package.json');
  let manifest;
  try {
    manifest = readJson(manifestPath);
    if (!manifest) throw new Error(`package.json not found at ${manifestPath}`);
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('package.json must contain a JSON object');
    const shrinkwrapPath = path.join(root, 'npm-shrinkwrap.json');
    const packageLockPath = path.join(root, 'package-lock.json');
    const lockPath = fs.existsSync(shrinkwrapPath) ? shrinkwrapPath : packageLockPath;
    const lockName = fs.existsSync(lockPath) ? path.basename(lockPath) : null;
    const lock = lockName ? readJson(lockPath) : null;
    if (lockName && (!lock || typeof lock !== 'object' || Array.isArray(lock))) throw new Error(`${lockName} must contain a JSON object`);
    const analysis = analyze(root, manifest, lock, lockName);
    const report = toReport(root, manifest, lockName, analysis);
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printHuman(report);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}

main();
