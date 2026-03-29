import { contextBridge, ipcRenderer } from 'electron';

async function init() {
  const port = await ipcRenderer.invoke('get-port');
  contextBridge.exposeInMainWorld('electron', {
    apiBase: `http://127.0.0.1:${port}`,
  });
}

init();
