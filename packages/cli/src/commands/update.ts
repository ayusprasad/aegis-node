/**
 * AegisNode Update Command
 * Force-refreshes the local blocklist cache from GitHub.
 */

import chalk from 'chalk';
import { forceRefreshBlocklist } from '../cache/blocklistCache';

export async function updateCommand(): Promise<void> {
  console.log(chalk.bold('\n🔄  Updating AegisNode Blocklist\n'));
  console.log(chalk.gray('Fetching latest threat data from GitHub...\n'));

  try {
    const result = await forceRefreshBlocklist();

    if (result.success) {
      console.log(chalk.green(`✓ ${result.message}`));
      console.log(chalk.gray('\nBlocklist is now up to date.\n'));
    } else {
      console.log(chalk.red(`✗ Update failed: ${result.message}`));
      console.log(chalk.gray('\nUsing existing cached data if available.\n'));
      process.exit(1);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(chalk.red(`✗ Unexpected error: ${message}\n`));
    process.exit(1);
  }
}
