#!/usr/bin/env node
// Auto-approve all pnpm builds
const fs = require('fs');
const path = require('path');

const config = {
  allowedBuilds: ['@clerk/shared', 'browser-tabs-lock', 'core-js', 'esbuild']
};

const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.pnpmrc');
const content = `build-jobs-concurrency=4\nallow-builds=${config.allowedBuilds.join(',')}`;

fs.writeFileSync(configPath, content);
console.log('✓ Approved builds: ' + config.allowedBuilds.join(', '));
