/** @type {import('next').NextConfig} */
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingIncludes: {
    '/*': [path.join(repoRoot, 'blocklist.json')],
  },
};

module.exports = nextConfig;
