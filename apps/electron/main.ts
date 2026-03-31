import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { mkdirSync } from 'fs';
import { checkStaticDir, checkNotesDir } from './startup-checks.js';

// ESM: set ELECTRON flag before dynamic import to prevent API auto-start
process.env.ELECTRON = 'true';

// Set NOTES_DIR and STATIC_DIR BEFORE dynamic import so env.ts caches the
// correct values. env.ts calls parseEnv() at module load time — setting variables
// after import has no effect.
const staticDir = app.isPackaged
  ? path.join(process.resourcesPath, 'public')
  : path.join(app.getAppPath(), 'public');
process.env.STATIC_DIR = staticDir;

const notesDir = app.isPackaged
  ? path.join(app.getPath('userData'), 'data', 'notes')
  : path.join(app.getAppPath(), 'data', 'notes');
mkdirSync(notesDir, { recursive: true });
process.env.NOTES_DIR = notesDir;

const { buildServer } = await import('../api/src/index.js');

import type { FastifyInstance } from 'fastify';

let server: FastifyInstance;
let isQuitting = false;

app.whenReady().then(async () => {
  if (!checkStaticDir(staticDir, { dialog, app })) return;
  if (!checkNotesDir(notesDir, { dialog, app })) return;

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
      sandbox: false,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}`);
}).catch((err) => {
  console.error('[main] startup error:', err);
  app.quit();
});

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
