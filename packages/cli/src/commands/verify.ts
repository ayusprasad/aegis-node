/**
 * AegisNode Verify Command
 * Manually verify a specific package against the blocklist and API.
 */

import chalk from 'chalk';
import { checkBlocklist } from '../cache/blocklistCache';
import { queryHeuristicApi } from '../evaluator/heuristicEvaluator';

export async function verifyCommand(packageName: string): Promise<void> {
  console.log(chalk.bold(`\n🔍  Verifying package: ${chalk.cyan(packageName)}\n`));

  // Step 1: Local blocklist check
  console.log(chalk.gray('Step 1: Checking local blocklist cache...'));
  const blocklistHit = await checkBlocklist(packageName);

  if (blocklistHit) {
    console.log(chalk.red(`  ✗ BLOCKED by local blocklist`));
    console.log(chalk.red(`\n[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package '${packageName}' flagged as MALICIOUS - ${blocklistHit.reason}. Do not attempt to install this package.\n`));
    process.exit(1);
    return;
  }

  console.log(chalk.green('  ✓ Not in local blocklist'));

  // Step 2: Heuristic API check
  console.log(chalk.gray('\nStep 2: Querying heuristic API...'));
  const apiResult = await queryHeuristicApi(packageName);

  if (apiResult.status === 'blocked') {
    console.log(chalk.red(`  ✗ BLOCKED by heuristic analysis`));
    console.log(chalk.gray(`  Reason: ${apiResult.reason}`));
    console.log(chalk.red(`\n[AEGISNODE SECURITY OVERRIDE]: Installation blocked. Package '${packageName}' flagged as ${apiResult.reason}. Do not attempt to install this package.\n`));
    process.exit(1);
    return;
  }

  console.log(chalk.green(`  ✓ API verdict: ${apiResult.status}`));
  if (apiResult.source === 'offline') {
    console.log(chalk.yellow(`  ⚠ (API unavailable - offline mode: ${apiResult.reason})`));
  }

  console.log(chalk.green.bold(`\n✅ Package '${packageName}' is safe to install.\n`));
}
