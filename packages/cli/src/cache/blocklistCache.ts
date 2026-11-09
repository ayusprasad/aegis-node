/**
 * AegisNode Cache Utility
 *
 * Manages the local blocklist cache stored in:
 *   %LOCALAPPDATA%\AegisNode\cache.json
 *
 * The cache is refreshed from AEGISNODE_BLOCKLIST_URL once every 24 hours.
 * This provides offline-capable, zero-latency first-line defense.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_BLOCKLIST_URL = 'http://localhost:3000/blocklist.json';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Path to the bundled blocklist.json that ships with this package.
 * Used as a last-resort fallback when both the cache file and the remote URL
 * are unavailable (e.g. on first run before `aegisnode init` has been called
 * and before the dev / production server is up).
 *
 * The repo layout is:
 *   packages/cli/dist/cache/blocklistCache.js   <- this file when compiled
 *   blocklist.json                               <- repo root
 *
 * So the bundled list is 3 directories up from __dirname (dist/cache → dist → cli → root).
 */
function getBundledBlocklistPath(): string {
  // When running from dist: __dirname = …/packages/cli/dist/cache
  // When running from src (ts-node): __dirname = …/packages/cli/src/cache
  // Either way, going up 4 levels reaches the monorepo root.
  return path.resolve(__dirname, '..', '..', '..', '..', 'blocklist.json');
}

function loadBundledBlocklist(): BlocklistEntry[] {
  const bundledPath = getBundledBlocklistPath();
  if (!fs.existsSync(bundledPath)) return [];
  try {
    const raw = fs.readFileSync(bundledPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<BlocklistCache>;
    if (!Array.isArray(parsed.known_malicious)) return [];
    return parsed.known_malicious;
  } catch {
    return [];
  }
}

function getCacheDir(): string {
  const localAppData =
    process.env['LOCALAPPDATA'] ||
    path.join(os.homedir(), 'AppData', 'Local');
  return path.join(localAppData, 'AegisNode');
}

function getCachePath(): string {
  const configuredPath = process.env['AEGISNODE_CACHE_PATH'];
  if (configuredPath) return configuredPath;
  return path.join(getCacheDir(), 'cache.json');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlocklistEntry {
  name: string;
  reason: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BlocklistCache {
  known_malicious: BlocklistEntry[];
  last_updated: string;
  version: string;
  fetched_at: string;
}

function isActionableEntry(entry: BlocklistEntry): boolean {
  return entry.reason !== 'SUPPLY_CHAIN_MALWARE_OSV';
}

// ─── Cache Read/Write ──────────────────────────────────────────────────────────

function ensureCacheDir(): void {
  const dir = getCacheDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readCache(): BlocklistCache | null {
  const cachePath = getCachePath();
  if (!fs.existsSync(cachePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(cachePath, 'utf-8');
    return JSON.parse(raw) as BlocklistCache;
  } catch {
    return null;
  }
}

function writeCache(data: BlocklistCache): void {
  ensureCacheDir();
  const cachePath = getCachePath();
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf-8');
}

function isCacheStale(cache: BlocklistCache): boolean {
  if (!cache.fetched_at) return true;
  const fetchedAt = new Date(cache.fetched_at).getTime();
  const now = Date.now();
  return now - fetchedAt > CACHE_TTL_MS;
}

// ─── Fetch from configured blocklist URL ───────────────────────────────────────

async function fetchBlocklistFromUrl(): Promise<BlocklistCache | null> {
  try {
    const blocklistUrl = process.env['AEGISNODE_BLOCKLIST_URL'] || DEFAULT_BLOCKLIST_URL;
    const response = await fetch(blocklistUrl, {
      headers: { 'User-Agent': 'aegisnode-cli/1.0.0' },
      // @ts-ignore - timeout option valid in node-fetch v2
      timeout: 5000,
    });

    if (!response.ok) {
      process.stderr.write(
        `[AEGISNODE WARN]: Failed to fetch blocklist (HTTP ${response.status}). Using cached data.\n`
      );
      return null;
    }

    const data = (await response.json()) as Partial<BlocklistCache>;
    if (!Array.isArray(data.known_malicious)) {
      process.stderr.write(
        '[AEGISNODE WARN]: Blocklist response has an invalid format. Using cached data.\n'
      );
      return null;
    }
    return {
      known_malicious: data.known_malicious,
      last_updated: data.last_updated || new Date().toISOString(),
      version: data.version || 'local',
      fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    process.stderr.write(
      `[AEGISNODE WARN]: Network error fetching blocklist. Using cached data.\n`
    );
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get the blocklist, refreshing from GitHub if stale or missing.
 * Falls back to cached data if network is unavailable.
 */
export async function getBlocklist(): Promise<BlocklistEntry[]> {
  let cache = readCache();

  if (!cache || isCacheStale(cache)) {
    const fresh = await fetchBlocklistFromUrl();
    if (fresh) {
      writeCache(fresh);
      cache = fresh;
    }
  }

  // If we still have no entries (no cache file AND remote fetch failed), fall
  // back to the blocklist.json that is bundled in the repository.  This
  // ensures the first-layer defence works even before `aegisnode init` has
  // been run and before the API server is up.
  const entries = cache?.known_malicious ?? [];
  if (entries.length === 0) {
    return loadBundledBlocklist().filter(isActionableEntry);
  }
  return entries.filter(isActionableEntry);
}

/**
 * Force-refresh the blocklist from GitHub regardless of TTL.
 */
export async function forceRefreshBlocklist(): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  const fresh = await fetchBlocklistFromUrl();
  if (!fresh) {
    return {
      success: false,
      count: 0,
      message: 'Failed to fetch blocklist from the configured URL. Check your connection.',
    };
  }
  writeCache(fresh);
  return {
    success: true,
    count: fresh.known_malicious.filter(isActionableEntry).length,
    message: `Blocklist updated: ${fresh.known_malicious.filter(isActionableEntry).length} actionable entries loaded.`,
  };
}

/**
 * Check if a package name appears in the blocklist.
 * Returns the matching entry or null if safe.
 */
export async function checkBlocklist(
  packageName: string
): Promise<BlocklistEntry | null> {
  const list = await getBlocklist();
  const normalized = packageName.toLowerCase().trim();
  return list.find((e) => e.name.toLowerCase() === normalized) ?? null;
}

/**
 * Get cache metadata for status display.
 */
export function getCacheStatus(): {
  exists: boolean;
  path: string;
  entryCount: number;
  fetchedAt: string | null;
  isStale: boolean;
} {
  const cachePath = getCachePath();
  const cache = readCache();

  if (!cache) {
    return {
      exists: false,
      path: cachePath,
      entryCount: 0,
      fetchedAt: null,
      isStale: true,
    };
  }

  return {
    exists: true,
    path: cachePath,
      entryCount: cache.known_malicious.filter(isActionableEntry).length,
    fetchedAt: cache.fetched_at || null,
    isStale: isCacheStale(cache),
  };
}
