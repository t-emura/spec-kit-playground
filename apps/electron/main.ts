import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { mkdirSync } from 'fs';
import { checkStaticDir, checkDbWritable } from './startup-checks.js';

// ESM: set ELECTRON flag before dynamic import to prevent API auto-start
process.env.ELECTRON = 'true';

// T007 + T008: set SQLITE_DB_PATH BEFORE dynamic import so env.ts caches the correct value.
// env.ts calls parseEnv() at module load time — setting the variable after import has no effect.
// app.getPath('userData') is available before app.whenReady(), so we can use it here.
if (app.isPackaged) {
  const packedDataDir = path.join(app.getPath('userData'), 'data');
  mkdirSync(packedDataDir, { recursive: true });
  process.env.SQLITE_DB_PATH = path.join(packedDataDir, 'outliner.db');
}

const { buildServer, runMigrations } = await import('../api/src/index.js');

import type { FastifyInstance } from 'fastify';

let server: FastifyInstance;
let isQuitting = false;

app.whenReady().then(async () => {
  // Phase 4 (US2): configure paths based on packaged vs dev mode
  const staticDir = app.isPackaged
    ? path.join(process.resourcesPath, 'public')
    : path.join(app.getAppPath(), 'public');
  const dataDir = path.join(app.getPath('userData'), 'data');

  // Phase 5 (US3): STATIC_DIR existence check
  if (!checkStaticDir(staticDir, { dialog, app })) return;

  // Phase 5 (US3): DB write permission check
  // T009: dev mode creates the DB directory here; packaged mode does it at top-level (before import)
  if (!app.isPackaged) {
    mkdirSync(dataDir, { recursive: true });
  }
  if (!checkDbWritable(dataDir, { dialog, app })) return;

  // Phase 4 (US2): set env vars for the API server
  process.env.STATIC_DIR = staticDir;

  // Run DB migrations using env.SQLITE_DB_PATH (same path buildServer() uses,
  // since env is cached at import time and cannot be changed after loading).
  // Pass migrationsDir explicitly so the path stays correct after API bundling
  // (import.meta.url inside the bundle points to the bundle file, not migrate.js).
  const migrationsDir = path.join(import.meta.dirname, '../api/src/db/migrations');
  runMigrations(undefined, migrationsDir);

  server = buildServer();
  await server.listen({ port: 0, host: '127.0.0.1' });
  const address = server.server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  ipcMain.on('get-port', (event) => { event.returnValue = port; });

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // ESM preload scripts require sandbox:false in Electron 28+
      sandbox: false,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}`);
}).catch((err) => {
  console.error('[main] startup error:', err);
  app.quit();
});

// Phase 4 (US2): graceful shutdown — guard prevents re-entrant quit
app.on('before-quit', async (event) => {
  if (isQuitting) return;
  event.preventDefault();
  isQuitting = true;
  if (server) {
    await server.close();
  }
  app.exit(0);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
