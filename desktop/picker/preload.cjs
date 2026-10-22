const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('valShare', Object.freeze({
  sources: () => ipcRenderer.invoke('val:share-sources'),
  select: (id, audio) => ipcRenderer.invoke('val:share-select', { id, audio: audio === true })
}));
