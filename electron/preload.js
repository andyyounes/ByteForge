const { contextBridge, ipcRenderer } = require('electron')

// Exposed only to the local splash/offline pages — the real ByteForge site
// never sees or uses this.
contextBridge.exposeInMainWorld('bf', {
  retryLoad: () => ipcRenderer.send('retry-load'),
})
