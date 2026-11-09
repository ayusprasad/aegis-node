/**
 * AegisNode Init Command
 *
 * Installs AegisNode interception hooks into:
 *   1. PowerShell $PROFILE (detects and appends a function npm { aegisnode-proxy @args })
 *   2. CMD doskey configuration (creates a doskey macro file and registry key)
 *
 * Windows-specific implementation. Must handle:
 *   - PowerShell profile may not exist yet
 *   - Profile directory may not exist yet
 *   - Idempotent: won't add duplicate entries
 *   - Presents clear instructions for shell restart
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import chalk from 'chalk';

// ─── Constants ────────────────────────────────────────────────────────────────

const POWERSHELL_HOOK_MARKER = '# AegisNode Security Hook - DO NOT REMOVE';
const POWERSHELL_HOOK = `
${POWERSHELL_HOOK_MARKER}
function npm {
    $intercepted = @('install', 'i', 'add', 'isntall', 'instal')
    if ($args.Count -gt 0 -and $intercepted -contains $args[0]) {
        aegisnode-proxy @args
    } else {
        $realNpm = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if (-not $realNpm) {
            $realNpm = Get-Command npm -CommandType Application | Select-Object -First 1
        }
        & $realNpm.Source @args
    }
}
# End AegisNode Security Hook
`;

const CMD_DOSKEY_CONTENT = 'npm=aegisnode-proxy $*\n';

const CMD_AUTORUN_REG_KEY =
  'HKCU\\Software\\Microsoft\\Command Processor';
const CMD_AUTORUN_VALUE = 'AutoRun';

interface HookState {
  profilePath?: string;
  profileExisted?: boolean;
  profileBackupPath?: string;
  cmdAutoRunExisted?: boolean;
  cmdAutoRunValue?: string;
  macroPath?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPowerShellProfilePath(): string {
  // Try to get the actual PowerShell profile path via PowerShell
  try {
    const result = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-Command', '$PROFILE'],
      { encoding: 'utf-8', timeout: 5000 }
    );
    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }
  } catch {
    // Fall through to default
  }

  // Default path for CurrentUserCurrentHost profile
  return path.join(
    os.homedir(),
    'Documents',
    'WindowsPowerShell',
    'Microsoft.PowerShell_profile.ps1'
  );
}

function getCmdMacroPath(): string {
  const localAppData =
    process.env['LOCALAPPDATA'] ||
    path.join(os.homedir(), 'AppData', 'Local');
  return path.join(localAppData, 'AegisNode', 'cmd_macros.doskey');
}

function getHookStatePath(): string {
  const localAppData =
    process.env['LOCALAPPDATA'] ||
    path.join(os.homedir(), 'AppData', 'Local');
  return path.join(localAppData, 'AegisNode', 'hook-state.json');
}

function backupPowerShellProfile(profilePath: string): {
  existed: boolean;
  backupPath: string;
} {
  const backupPath = `${profilePath}.aegis-backup`;
  const existed = fs.existsSync(profilePath);

  if (existed && !fs.existsSync(backupPath)) {
    const current = fs.readFileSync(profilePath, 'utf-8');
    if (!current.includes(POWERSHELL_HOOK_MARKER)) {
      fs.copyFileSync(profilePath, backupPath);
    }
  }

  return { existed, backupPath };
}

function readCmdAutoRun(): {
  existed: boolean;
  value?: string;
} {
  try {
    const result = spawnSync(
      'reg',
      ['query', CMD_AUTORUN_REG_KEY, '/v', CMD_AUTORUN_VALUE],
      { encoding: 'utf-8', timeout: 5000 },
    );
    if (result.status !== 0) return { existed: false };

    const line = result.stdout
      .split(/\r?\n/)
      .find((candidate) => /^\s*AutoRun\s+REG_/i.test(candidate));
    const value = line?.replace(/^\s*AutoRun\s+REG_\w+\s*/i, '').trim();
    if (value?.toLowerCase().includes(getCmdMacroPath().toLowerCase())) {
      return { existed: false };
    }
    return value ? { existed: true, value } : { existed: false };
  } catch {
    return { existed: false };
  }
}

function writeHookState(state: HookState): void {
  const statePath = getHookStatePath();
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

// ─── PowerShell Hook ──────────────────────────────────────────────────────────

function installPowerShellHook(profilePath: string, force: boolean): {
  success: boolean;
  message: string;
  alreadyInstalled: boolean;
} {
  // Check if already installed
  if (fs.existsSync(profilePath)) {
    const existing = fs.readFileSync(profilePath, 'utf-8');
    if (existing.includes(POWERSHELL_HOOK_MARKER)) {
      if (!force) {
        return {
          success: true,
          message: 'PowerShell hook already installed.',
          alreadyInstalled: true,
        };
      }
      // Force reinstall: remove old hook first
      const cleaned = existing
        .replace(/\n# AegisNode Security Hook - DO NOT REMOVE[\s\S]*?# End AegisNode Security Hook\n?/g, '')
        .trimEnd();
      fs.writeFileSync(profilePath, cleaned + '\n', 'utf-8');
    }
  } else {
    // Create profile directory if needed
    const profileDir = path.dirname(profilePath);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    fs.writeFileSync(profilePath, '', 'utf-8');
  }

  // Append hook
  fs.appendFileSync(profilePath, POWERSHELL_HOOK, 'utf-8');

  return {
    success: true,
    message: `PowerShell hook installed to: ${profilePath}`,
    alreadyInstalled: false,
  };
}

// ─── CMD Doskey Hook ──────────────────────────────────────────────────────────

function installCmdHook(force: boolean): {
  success: boolean;
  message: string;
  alreadyInstalled: boolean;
} {
  const macroPath = getCmdMacroPath();
  const macroDir = path.dirname(macroPath);

  // Check registry for existing entry
  try {
    const regResult = spawnSync(
      'reg',
      ['query', CMD_AUTORUN_REG_KEY, '/v', CMD_AUTORUN_VALUE],
      { encoding: 'utf-8', timeout: 5000 }
    );

    if (regResult.status === 0 && regResult.stdout.includes(macroPath)) {
      if (!force) {
        return {
          success: true,
          message: 'CMD doskey hook already installed.',
          alreadyInstalled: true,
        };
      }
    }
  } catch {
    // Registry key might not exist yet, that's fine
  }

  // Write doskey macro file
  if (!fs.existsSync(macroDir)) {
    fs.mkdirSync(macroDir, { recursive: true });
  }
  fs.writeFileSync(macroPath, CMD_DOSKEY_CONTENT, 'utf-8');

  // Register AutoRun key so CMD loads doskey macros on startup
  const autoRunCommand = `doskey /macrofile="${macroPath}"`;
  const regAddResult = spawnSync(
    'reg',
    [
      'add',
      CMD_AUTORUN_REG_KEY,
      '/v',
      CMD_AUTORUN_VALUE,
      '/t',
      'REG_SZ',
      '/d',
      autoRunCommand,
      '/f',
    ],
    { encoding: 'utf-8', timeout: 5000 }
  );

  if (regAddResult.status !== 0) {
    return {
      success: false,
      message: `Failed to set CMD AutoRun registry key: ${regAddResult.stderr}`,
      alreadyInstalled: false,
    };
  }

  return {
    success: true,
    message: `CMD doskey hook installed. Macro file: ${macroPath}`,
    alreadyInstalled: false,
  };
}

// ─── Init Command Handler ─────────────────────────────────────────────────────

export async function initCommand(options: {
  force?: boolean;
  powershell?: boolean;
  cmd?: boolean;
}): Promise<void> {
  const force = options.force ?? false;
  const doPowerShell = options.powershell !== false;
  const doCmd = options.cmd !== false;

  console.log(chalk.bold('\n🛡️  AegisNode Initialization\n'));
  console.log(chalk.gray('Installing security hooks into your Windows shell environment...\n'));

  let anyFailed = false;
  const hookState: HookState = {};

  // ── PowerShell Hook ────────────────────────────────────────────────────────
  if (doPowerShell) {
    const profilePath = getPowerShellProfilePath();
    const backup = backupPowerShellProfile(profilePath);
    hookState.profilePath = profilePath;
    hookState.profileExisted = backup.existed;
    hookState.profileBackupPath = backup.backupPath;
    console.log(chalk.blue('→ PowerShell Profile:'), chalk.gray(profilePath));

    try {
      const result = installPowerShellHook(profilePath, force);
      if (result.alreadyInstalled) {
        console.log(chalk.yellow('  ⚠ Already installed. Use --force to reinstall.\n'));
      } else if (result.success) {
        console.log(chalk.green('  ✓ Hook installed successfully.\n'));
      } else {
        console.log(chalk.red('  ✗ Failed:', result.message, '\n'));
        anyFailed = true;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`  ✗ Error: ${message}\n`));
      anyFailed = true;
    }
  }

  // ── CMD Doskey Hook ────────────────────────────────────────────────────────
  if (doCmd) {
    console.log(chalk.blue('→ CMD Doskey Configuration:'));
    const previousAutoRun = readCmdAutoRun();
    hookState.cmdAutoRunExisted = previousAutoRun.existed;
    hookState.cmdAutoRunValue = previousAutoRun.value;
    hookState.macroPath = getCmdMacroPath();

    try {
      const result = installCmdHook(force);
      if (result.alreadyInstalled) {
        console.log(chalk.yellow('  ⚠ Already installed. Use --force to reinstall.\n'));
      } else if (result.success) {
        console.log(chalk.green('  ✓ Hook installed successfully.'));
        console.log(chalk.gray(`  File: ${getCmdMacroPath()}\n`));
      } else {
        console.log(chalk.red('  ✗ Failed:', result.message, '\n'));
        anyFailed = true;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(chalk.red(`  ✗ Error: ${message}\n`));
      anyFailed = true;
    }
  }

  writeHookState(hookState);

  // ── Fetch initial blocklist cache ────────────────────────────────────────
  console.log(chalk.blue('→ Fetching initial blocklist cache...'));
  try {
    const { forceRefreshBlocklist } = await import('../cache/blocklistCache');
    const cacheResult = await forceRefreshBlocklist();
    if (cacheResult.success) {
      console.log(chalk.green(`  ✓ ${cacheResult.message}\n`));
    } else {
      console.log(chalk.yellow(`  ⚠ ${cacheResult.message}\n`));
    }
  } catch {
    console.log(chalk.yellow('  ⚠ Could not fetch blocklist (offline). Will retry on next npm install.\n'));
  }

  // ── Final Instructions ─────────────────────────────────────────────────────
  if (!anyFailed) {
    console.log(chalk.green.bold('✅ AegisNode initialization complete!\n'));
    console.log(chalk.white.bold('Next steps:'));
    console.log(chalk.gray('  1. Restart your PowerShell terminal for hooks to take effect.'));
    console.log(chalk.gray('  2. Open a new CMD window (existing windows need restart) for CMD hooks.'));
    console.log(chalk.gray('  3. Run: ') + chalk.cyan('aegisnode status') + chalk.gray(' to verify protection is active.\n'));
  } else {
    console.log(chalk.red.bold('⚠ Initialization completed with errors. Check messages above.\n'));
    process.exit(1);
  }
}
