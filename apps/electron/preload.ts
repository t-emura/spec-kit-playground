import { contextBridge, ipcRenderer } from 'electron';

// Synchronous IPC is more reliable in test/CI environments where async
// invoke can silently hang before the renderer's JS finishes loading.
const port = ipcRenderer.sendSync('get-port') as number;
contextBridge.exposeInMainWorld('electron', {
  apiBase: `http://127.0.0.1:${port}`,
});
