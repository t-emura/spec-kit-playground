#!/usr/bin/env node
// Bundles the API source code for the Electron build using esbuild.
//
// Why this is needed: electron-builder's default '!**/node_modules' pattern
// blocks the explicit 'node_modules/**/*' files entry, and the root package.json
// has no 'dependencies', so electron-builder's smart pruner packages zero
// node_modules into the asar. Bundling inlines all JS deps except better-sqlite3
// (a native module that must remain external).
//
// Why the createRequire banner: esbuild's __require shim in ESM bundles requires
// the global `require` to be available, which it is NOT in Node.js/Electron ESM
// context. The banner injects a proper `require` via createRequire so that
// bundled CJS modules (pino, undici, etc.) can call require('node:events') etc.

import * as esbuild from 'esbuild';

const result = await esbuild.build({
  entryPoints: ['apps/api/src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['better-sqlite3'],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  outfile: 'apps/electron/dist/api/src/index.js',
  logLevel: 'info',
});

if (result.errors.length > 0) {
  process.exit(1);
}
