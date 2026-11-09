/**
 * AegisNode Status Command
 * Shows current protection status: hook presence, cache age, configuration.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import { getCacheStatus } from '../cache/blocklistCache';

function getPowerShellProfilePath(): string {
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
    // Fall through
  }
  return path.join(os.homedir(), 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1');
}

function getCmdMacroPath(): string {
  const localAppData =
    process.env['LOCALAPPDATA'] ||
    path.join(os.homedir(), 'AppData', 'Local');
  return path.join(localAppData, 'AegisNode', 'cmd_macros.doskey');
}

function checkPowerShellHook(): boolean {
  const profilePath = getPowerShellProfilePath();
  if (!fs.existsSync(profilePath)) return false;
  const content = fs.readFileSync(profilePath, 'utf-8');
  return content.includes('# AegisNode Security Hook - DO NOT REMOVE');
}

function checkCmdHook(): boolean {
  const macroPath = getCmdMacroPath();
  if (!fs.existsSync(macroPath)) return false;

  const macroContent = fs.readFileSync(macroPath, 'utf8');
  if (!macroContent.includes('npm=aegisnode-proxy $*')) return false;

  try {
    const regResult = spawnSync(
      'reg',
      ['query', 'HKCU\\Software\\Microsoft\\Command Processor', '/v', 'AutoRun'],
      { encoding: 'utf-8', timeout: 5000 }
    );
    return regResult.status === 0 && regResult.stdout.includes(macroPath);
  } catch {
    return false;
  }
}

function formatDate(isoStr: string | null): string {
  if (!isoStr) return 'Never';
  const d = new Date(isoStr);
  return d.toLocaleString();
}

export async function statusCommand(): Promise<void> {
  console.log(chalk.bold('\n🛡️  AegisNode Protection Status\n'));

  // PowerShell hook status
  const psHookActive = checkPowerShellHook();
  console.log(
    chalk.blue('PowerShell Hook:'),
    psHookActive
      ? chalk.green('✓ Active')
      : chalk.red('✗ Not installed') + chalk.gray(' (run: aegisnode init)')
  );

  // CMD hook status
  const cmdHookActive = checkCmdHook();
  console.log(
    chalk.blue('CMD Doskey Hook:'),
    cmdHookActive
      ? chalk.green('✓ Active')
      : chalk.red('✗ Not installed') + chalk.gray(' (run: aegisnode init)')
  );

  // Cache status
  const cacheStatus = getCacheStatus();
  console.log(
    chalk.blue('\nBlocklist Cache:'),
    cacheStatus.exists
      ? chalk.green(`✓ ${cacheStatus.entryCount} entries`)
      : chalk.red('✗ Not downloaded')
  );
  console.log(chalk.gray(`  Path:       ${cacheStatus.path}`));
  console.log(chalk.gray(`  Last fetch: ${formatDate(cacheStatus.fetchedAt)}`));
  console.log(
    chalk.gray('  Status:     '),
    cacheStatus.isStale
      ? chalk.yellow('Stale (will refresh on next install)')
      : chalk.green('Fresh')
  );

  // Node/npm environment info
  console.log(chalk.blue('\nEnvironment:'));
  console.log(chalk.gray(`  Node.js:    ${process.version}`));
  console.log(chalk.gray(`  node.exe:   ${process.execPath}`));

  // Overall protection status
  const fullyProtected = psHookActive && cmdHookActive;
  console.log();
  if (fullyProtected) {
    console.log(chalk.green.bold('✅ AegisNode is active and protecting your environment.\n'));
  } else if (psHookActive || cmdHookActive) {
    console.log(chalk.yellow.bold('⚠️  AegisNode is partially active.'));
    console.log(chalk.gray('   Restart or reinstall the missing shell hook with: ') + chalk.cyan('aegisnode init') + '\n');
  } else {
    console.log(chalk.red.bold('⚠️  AegisNode is NOT protecting your environment.'));
    console.log(chalk.gray('   Run: ') + chalk.cyan('aegisnode init') + chalk.gray(' to install hooks.\n'));
  }
}
