#!/usr/bin/env node
/**
 * AegisNode Proxy Binary
 * This is the intercept shim that replaces `npm` in the user's shell.
 * Called as: aegisnode-proxy install express lodash
 *
 * CRITICAL: This script MUST resolve the ABSOLUTE path to the real npm-cli.js
 * to avoid infinite interception loops.
 */

import { runProxy } from '../proxy/runner';

runProxy(process.argv.slice(2)).catch((err: Error) => {
  process.stderr.write(`[AEGISNODE INTERNAL ERROR]: ${err.message}\n`);
  process.exit(2);
});
