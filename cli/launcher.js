#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const cliPath = path.join(__dirname, 'index.ts');
const args = process.argv.slice(2);

try {
  execSync(`npx tsx "${cliPath}" ${args.join(' ')}`, {
    stdio: 'inherit',
    shell: true
  });
} catch (error) {
  process.exit(error.status || 1);
}