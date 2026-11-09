#!/usr/bin/env node
/**
 * AegisNode CLI Entry Point
 * Main command interface for aegisnode tool
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { updateCommand } from './commands/update';
import { verifyCommand } from './commands/verify';
import { uninstallCommand } from './commands/uninstall';

const program = new Command();

console.log(
  chalk.cyan.bold('\n  ╔═══════════════════════════════════╗') + '\n' +
  chalk.cyan.bold('  ║     ') + chalk.white.bold('AegisNode Security Guard') + chalk.cyan.bold('      ║') + '\n' +
  chalk.cyan.bold('  ║  ') + chalk.gray('npm package threat interceptor') + chalk.cyan.bold('  ║') + '\n' +
  chalk.cyan.bold('  ╚═══════════════════════════════════╝\n')
);

program
  .name('aegisnode')
  .description('Windows security middleware CLI - intercepts and blocks malicious npm packages from AI coding agents')
  .version('1.0.0');

program
  .command('init')
  .description('Install AegisNode hooks into PowerShell $PROFILE and CMD doskey')
  .option('--force', 'Force reinstall even if already installed')
  .option('--no-powershell', 'Skip PowerShell profile injection')
  .option('--no-cmd', 'Skip CMD doskey configuration')
  .action(initCommand);

program
  .command('status')
  .description('Show current AegisNode protection status')
  .action(statusCommand);

program
  .command('update')
  .description('Force update the local blocklist cache from GitHub')
  .action(updateCommand);

program
  .command('verify <package>')
  .description('Manually verify if a package is safe to install')
  .action(verifyCommand);

program
  .command('uninstall')
  .description('Remove shell hooks and restore the backed-up shell configuration')
  .action(uninstallCommand);

program.parse(process.argv);
