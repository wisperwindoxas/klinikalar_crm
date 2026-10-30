const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Screen and TV display management
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  openTvOnDisplay: (displayId, fullscreen = true) => ipcRenderer.invoke('open-tv-on-display', { displayId, fullscreen }),
  closeTvDisplay: () => ipcRenderer.invoke('close-tv-display'),
  isTvOpen: () => ipcRenderer.invoke('is-tv-open'),
  
  // Real-time listener when displays are added/removed
  onDisplaysChanged: (callback) => {
    const handler = (_event, displays) => callback(displays);
    ipcRenderer.on('displays-changed', handler);
    return () => ipcRenderer.removeListener('displays-changed', handler);
  },

  // Printer management & silent printing
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  silentPrint: (options) => ipcRenderer.invoke('silent-print', options),
  printTicket: (options) => ipcRenderer.invoke('print-ticket', options),

  // Local backend connectivity
  checkBackendHealth: () => ipcRenderer.invoke('check-backend-health'),

  // GitHub Updates & Installer downloader
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  downloadUpdate: (options) => ipcRenderer.invoke('download-update', options),
  installUpdate: (filePath) => ipcRenderer.invoke('install-update', filePath),
  onUpdateDownloadProgress: (callback) => {
    const handler = (_event, percent) => callback(percent);
    ipcRenderer.on('update-download-progress', handler);
    return () => ipcRenderer.removeListener('update-download-progress', handler);
  },
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),

  // Platform info
  platform: process.platform,
  isElectron: true
});


