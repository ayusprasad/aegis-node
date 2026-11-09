import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import chalk from 'chalk';

const POWERSHELL_HOOK_MARKER = '# AegisNode Security Hook - DO NOT REMOVE';
const POWERSHELL_HOOK_END = '# End AegisNode Security Hook';
const CMD_AUTORUN_REG_KEY = 'HKCU\\Software\\Microsoft\\Command Processor';
const CMD_AUTORUN_VALUE = 'AutoRun';

interface HookState {
  profilePath?: string;
  profileExisted?: boolean;
  profileBackupPath?: string;
  cmdAutoRunExisted?: boolean;
  cmdAutoRunValue?: string;
  macroPath?: string;
}

function getLocalAppData(): string {
  return process.env['LOCALAPPDATA'] || path.join(os.homedir(), 'AppData', 'Local');
}

function getStatePath(): string {
  return path.join(getLocalAppData(), 'AegisNode', 'hook-state.json');
}

function removePowerShellHook(content: string): string {
  return content
    .replace(
      new RegExp(`\\n?${POWERSHELL_HOOK_MARKER}[\\s\\S]*?${POWERSHELL_HOOK_END}\\n?`, 'g'),
      '',
    )
    .trimEnd();
}

function restorePowerShellProfile(state: HookState): string {
  if (!state.profilePath) return 'PowerShell profile state was not recorded.';

  const backupPath = state.profileBackupPath;
  if (backupPath && fs.existsSync(backupPath)) {
    const backup = fs.readFileSync(backupPath, 'utf8');
    if (!backup.includes(POWERSHELL_HOOK_MARKER)) {
      fs.copyFileSync(backupPath, state.profilePath);
      return `Restored PowerShell profile backup: ${state.profilePath}`;
    }
  }

  if (!fs.existsSync(state.profilePath)) {
    return 'PowerShell profile was not present.';
  }

  const cleaned = removePowerShellHook(fs.readFileSync(state.profilePath, 'utf8'));
  if (!cleaned && state.profileExisted === false) {
    fs.unlinkSync(state.profilePath);
    return 'Removed the profile created by AegisNode.';
  }

  fs.writeFileSync(state.profilePath, `${cleaned}\n`, 'utf8');
  return `Removed AegisNode hook from: ${state.profilePath}`;
}

function restoreCmdAutoRun(state: HookState): string {
  if (state.cmdAutoRunExisted && state.cmdAutoRunValue) {
    const result = spawnSync(
      'reg',
      [
        'add', CMD_AUTORUN_REG_KEY, '/v', CMD_AUTORUN_VALUE,
        '/t', 'REG_SZ', '/d', state.cmdAutoRunValue, '/f',
      ],
      { encoding: 'utf8', timeout: 5000 },
    );
    return result.status === 0
      ? 'Restored the previous CMD AutoRun value.'
      : `Could not restore CMD AutoRun: ${result.stderr || 'reg.exe failed'}`;
  }

  const result = spawnSync(
    'reg',
    ['delete', CMD_AUTORUN_REG_KEY, '/v', CMD_AUTORUN_VALUE, '/f'],
    { encoding: 'utf8', timeout: 5000 },
  );
  return result.status === 0 || result.stdout?.includes('Unable to find')
    ? 'Removed the AegisNode CMD AutoRun value.'
    : `Could not remove CMD AutoRun: ${result.stderr || 'reg.exe failed'}`;
}

export async function uninstallCommand(): Promise<void> {
  console.log(chalk.bold('\n🛡️  Removing AegisNode shell hooks\n'));

  if (!fs.existsSync(getStatePath())) {
    console.log(chalk.yellow('No AegisNode hook state was found. Nothing to remove.\n'));
    return;
  }

  const state = JSON.parse(fs.readFileSync(getStatePath(), 'utf8')) as HookState;
  console.log(chalk.green(`✓ ${restorePowerShellProfile(state)}`));
  console.log(chalk.green(`✓ ${restoreCmdAutoRun(state)}`));

  if (state.macroPath && fs.existsSync(state.macroPath)) {
    fs.unlinkSync(state.macroPath);
    console.log(chalk.green(`✓ Removed CMD macro file: ${state.macroPath}`));
  }

  fs.unlinkSync(getStatePath());
  console.log(chalk.green('\nAegisNode shell hooks removed. The cache and backups were retained for manual review.\n'));
}
