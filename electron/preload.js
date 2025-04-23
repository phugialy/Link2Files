const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    ipcRenderer: {
      invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
      on: (channel, func) => {
        const validChannels = ['download-progress', 'download-complete', 'init-progress', 'theme-changed'];
        if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
      },
      once: (channel, func) => {
        const validChannels = ['download-progress', 'download-complete', 'init-progress', 'theme-changed'];
        if (validChannels.includes(channel)) {
          ipcRenderer.once(channel, (event, ...args) => func(...args));
        }
      },
      removeAllListeners: (channel) => {
        const validChannels = ['download-progress', 'download-complete', 'init-progress', 'theme-changed'];
        if (validChannels.includes(channel)) {
          ipcRenderer.removeAllListeners(channel);
        }
      }
    },
    theme: {
      get: () => ipcRenderer.invoke('get-theme'),
      set: (theme) => ipcRenderer.invoke('set-theme', theme),
      onChange: (callback) => ipcRenderer.on('theme-changed', (_, theme) => callback(theme))
    }
  }
); 