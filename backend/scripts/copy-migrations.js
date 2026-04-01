#!/usr/bin/env node
// Copies src/db/migrations/ -> dist/db/migrations/ after tsc build.
// Uses Node.js fs API instead of shell `cp` for cross-platform compatibility.

import { cpSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const src  = join(root, 'src',  'db', 'migrations');
const dest = join(root, 'dist', 'db', 'migrations');

if (!existsSync(src)) {
  console.error(`[copy-migrations] Source directory not found: ${src}`);
  process.exit(1);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

console.log(`[copy-migrations] Copied migrations: ${src} -> ${dest}`);
