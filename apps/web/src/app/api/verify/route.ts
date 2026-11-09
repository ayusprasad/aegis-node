import { NextRequest, NextResponse } from 'next/server';
import levenshtein from 'fast-levenshtein';
import topNpmPackages from '@/data/top-npm-packages.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerifyRequest {
  package: string;
}

interface VerifyResponse {
  status: 'safe' | 'blocked';
  reason: string;
}

interface NpmPackageData {
  name?: string;
  time?: {
    created?: string;
    modified?: string;
    [version: string]: string | undefined;
  };
  'dist-tags'?: {
    latest?: string;
    [tag: string]: string | undefined;
  };
  versions?: Record<string, unknown>;
  description?: string;
}

interface NpmDownloadData {
  downloads?: number;
  package?: string;
  start?: string;
  end?: string;
}

// The checked-in dataset is generated from the public npm top-packages
// dataset. This small core list keeps essential packages present even when a
// popularity dataset omits them because of search ranking bias.
const CORE_NPM_PACKAGES = [
  'react', 'react-dom', 'express', 'lodash', 'chalk', 'axios', 'moment',
  'typescript', 'webpack', 'babel-core', 'eslint', 'prettier', 'jest',
  'mocha', 'nodemon', 'dotenv', 'cors', 'body-parser', 'mongoose',
  'sequelize', 'knex', 'pg', 'mysql2', 'redis', 'ioredis', 'socket.io',
  'next', 'vue', 'angular', 'svelte', 'nuxt', 'gatsby', 'remix',
  'vite', 'rollup', 'parcel', 'esbuild', 'turbo', 'nx', 'lerna',
  'commander', 'yargs', 'minimist', 'inquirer', 'ora', 'boxen',
  'fs-extra', 'glob', 'rimraf', 'mkdirp', 'chokidar', 'node-fetch',
  'cross-env', 'concurrently', 'husky', 'lint-staged', 'semantic-release',
  'uuid', 'nanoid', 'cuid', 'shortid', 'hashids', 'bcrypt', 'jsonwebtoken',
  'passport', 'express-session', 'cookie-parser', 'helmet', 'morgan',
  'winston', 'pino', 'debug', 'colors', 'ansi-styles', 'strip-ansi',
  'tailwindcss', 'postcss', 'autoprefixer', 'sass', 'less', 'stylus',
  'classnames', 'clsx', 'styled-components', 'emotion', 'radix-ui',
  'formik', 'react-hook-form', 'yup', 'zod', 'joi', 'ajv',
  'date-fns', 'luxon', 'dayjs', 'numeral', 'accounting',
  'lodash-es', 'ramda', 'immutable', 'immer', 'zustand', 'redux',
  'rxjs', 'graphql', 'apollo-client', 'prisma', 'typeorm',
  'jest-dom', 'testing-library', 'cypress', 'playwright', 'puppeteer',
  'aws-sdk', 'azure', 'firebase', 'supabase', 'netlify',
  'stripe', 'twilio', 'sendgrid', 'nodemailer', 'mailgun',
  'sharp', 'jimp', 'canvas', 'pdfkit', 'puppeteer-pdf',
  'multer', 'busboy', 'formidable', 'archiver', 'unzipper',
  'cheerio', 'jsdom', 'playwright', 'selenium-webdriver',
  'socket.io-client', 'ws', 'mqtt', 'amqplib', 'kafka-node',
  'bull', 'agenda', 'node-cron', 'later', 'cron',
  'compression', 'hpp', 'express-rate-limit', 'express-validator',
  'serialize-error', 'p-limit', 'p-queue', 'bottleneck', 'async',
  'through2', 'pump', 'mississippi', 'bl', 'readable-stream',
  'semver', 'validate-npm-package-name', 'npm-check-updates',
  'cosmiconfig', 'rc', 'conf', 'envfile', 'dotenv-expand',
];

const TOP_NPM_PACKAGES = Array.from(
  new Set([...topNpmPackages, ...CORE_NPM_PACKAGES]),
);

// ─── Validation ───────────────────────────────────────────────────────────────

const NPM_PACKAGE_NAME_REGEX = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

function validatePackageName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 214) return false;
  return NPM_PACKAGE_NAME_REGEX.test(name);
}

// ─── npm Registry Fetch ───────────────────────────────────────────────────────

async function fetchNpmPackage(packageName: string): Promise<{
  exists: boolean;
  data: NpmPackageData | null;
  statusCode: number;
}> {
  const encodedName = encodeURIComponent(packageName).replace('%40', '@');
  const url = `https://registry.npmjs.org/${encodedName}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'aegisnode-verify/1.0.0',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (response.status === 404) {
      return { exists: false, data: null, statusCode: 404 };
    }

    if (!response.ok) {
      return { exists: false, data: null, statusCode: response.status };
    }

    const data = (await response.json()) as NpmPackageData;
    return { exists: true, data, statusCode: 200 };
  } catch {
    return { exists: false, data: null, statusCode: 0 };
  }
}

// ─── npm Download Count Fetch ─────────────────────────────────────────────────

async function fetchDownloadCount(packageName: string): Promise<number> {
  const encodedName = encodeURIComponent(packageName).replace('%40', '@');
  // Last 7 days to have a reasonable sample
  const url = `https://api.npmjs.org/downloads/point/last-week/${encodedName}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'aegisnode-verify/1.0.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return 0;

    const data = (await response.json()) as NpmDownloadData;
    return data.downloads ?? 0;
  } catch {
    return 0;
  }
}

// ─── Heuristic Checks ─────────────────────────────────────────────────────────

/**
 * Check if a package was published less than 48 hours ago.
 */
function isRecentlyPublished(npmData: NpmPackageData): boolean {
  const latestVersion = npmData['dist-tags']?.latest;
  const publishedStr =
    (latestVersion && npmData.time?.[latestVersion]) || npmData.time?.created;
  if (!publishedStr) return false;

  const createdAt = new Date(publishedStr).getTime();
  const nowMs = Date.now();
  const ageMs = nowMs - createdAt;
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  return ageMs < fortyEightHoursMs;
}

/**
 * Check Levenshtein distance against top npm packages.
 * Returns the closest package name if suspiciously close (dist ≤ 2).
 */
function findTyposquatCandidate(
  packageName: string
): { candidate: string; distance: number } | null {
  const TYPOSQUAT_THRESHOLD = 2;
  const name = packageName.toLowerCase();

  // Don't flag if it IS one of the top packages
  if (TOP_NPM_PACKAGES.some((pkg) => pkg.toLowerCase() === name)) return null;

  let closest: { candidate: string; distance: number } | null = null;

  for (const topPkg of TOP_NPM_PACKAGES) {
    // Skip obviously different-length packages
    if (Math.abs(name.length - topPkg.length) > TYPOSQUAT_THRESHOLD) continue;

    const dist = levenshtein.get(name, topPkg);
    if (dist > 0 && dist <= TYPOSQUAT_THRESHOLD) {
      if (!closest || dist < closest.distance) {
        closest = { candidate: topPkg, distance: dist };
      }
    }
  }

  return closest;
}

// ─── API Route Handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<VerifyResponse>> {
  // Parse request body
  let body: VerifyRequest;
  try {
    body = (await request.json()) as VerifyRequest;
  } catch {
    return NextResponse.json(
      { status: 'blocked', reason: 'INVALID_REQUEST' },
      { status: 400 }
    );
  }

  const packageName = typeof body?.package === 'string'
    ? body.package.trim().toLowerCase()
    : '';

  // Validate package name
  if (!packageName) {
    return NextResponse.json(
      { status: 'blocked', reason: 'INVALID_REQUEST' },
      { status: 400 }
    );
  }

  if (!validatePackageName(packageName)) {
    return NextResponse.json(
      { status: 'blocked', reason: 'INVALID_PACKAGE_NAME' },
      { status: 400 }
    );
  }

  // ── Step 1: Check npm registry existence ──────────────────────────────────
  const { exists, data: npmData, statusCode } = await fetchNpmPackage(packageName);
  const typosquat = findTyposquatCandidate(packageName);

  // A misspelled package can be both unpublished and a typosquat. Prefer the
  // more actionable security classification for that case.
  if (!exists && statusCode === 404 && typosquat) {
    return NextResponse.json({
      status: 'blocked',
      reason: `TYPOSQUAT - Levenshtein distance ${typosquat.distance} from "${typosquat.candidate}"`,
    });
  }

  if (!exists && statusCode === 404) {
    return NextResponse.json({
      status: 'blocked',
      reason: 'HALLUCINATED',
    });
  }

  // If the registry is unavailable or returns an unexpected status, default to
  // safe so a transient dependency outage cannot break a normal install.
  if (!exists) {
    return NextResponse.json({
      status: 'safe',
      reason: `REGISTRY_UNAVAILABLE${statusCode ? ` (HTTP ${statusCode})` : ''}`,
    });
  }

  // ── Step 2: Typosquat detection (before we fetch download counts) ─────────
  if (typosquat) {
    return NextResponse.json({
      status: 'blocked',
      reason: `TYPOSQUAT - Levenshtein distance ${typosquat.distance} from "${typosquat.candidate}". Possible impersonation`,
    });
  }

  // ── Step 3: Age + download count heuristic ────────────────────────────────
  if (npmData && isRecentlyPublished(npmData)) {
    const downloads = await fetchDownloadCount(packageName);

    if (downloads < 100) {
      return NextResponse.json({
        status: 'blocked',
        reason: `SUSPICIOUS - Published less than 48 hours ago with ${downloads} downloads. High risk of malicious payload`,
      });
    }
  }

  // ── All checks passed ──────────────────────────────────────────────────────
  return NextResponse.json({
    status: 'safe',
    reason: 'passed_all_checks',
  });
}

// Only allow POST
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with { "package": "package-name" }.' },
    { status: 405 }
  );
}
