import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { mkdirSync } from 'fs';
import { checkStaticDir, checkDbWritable } from './startup-checks.js';

// ESM: set ELECTRON flag before dynamic import to prevent API auto-start
process.env.ELECTRON = 'true';
const { buildServer } = await import('../api/src/index.js');

import type { FastifyInstance } from 'fastify';

let server: FastifyInstance;

app.whenReady().then(async () => {
  // Phase 4 (US2): configure paths based on packaged vs dev mode
  const staticDir = app.isPackaged
    ? path.join(process.resourcesPath, 'public')
    : path.join(app.getAppPath(), 'public');
  const dataDir = path.join(app.getPath('userData'), 'data');

  // Phase 5 (US3): STATIC_DIR existence check
  if (!checkStaticDir(staticDir, { dialog, app })) return;

  // Phase 4 (US2): create DB directory
  mkdirSync(dataDir, { recursive: true });

  // Phase 5 (US3): DB write permission check
  if (!checkDbWritable(dataDir, { dialog, app })) return;

  // Phase 4 (US2): set env vars before buildServer
  process.env.STATIC_DIR = staticDir;
  process.env.SQLITE_DB_PATH = path.join(dataDir, 'outliner.db');

  server = buildServer();
  await server.listen({ port: 0, host: '127.0.0.1' });
  const address = server.server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  ipcMain.handle('get-port', () => port);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}`);
});

// Phase 4 (US2): graceful shutdown
app.on('before-quit', async (event) => {
  event.preventDefault();
  if (server) {
    await server.close();
  }
  app.exit(0);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
