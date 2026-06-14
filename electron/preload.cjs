const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  // Check for updates
  checkForUpdates: async () => {
    return await ipcRenderer.invoke('check-for-updates');
  },

  // Install and restart
  installUpdate: async () => {
    return await ipcRenderer.invoke('install-update');
  },

  // Listen to update status events
  onUpdateStatus: (callback) => {
    const listener = (event, status) => {
      callback(status);
    };
    ipcRenderer.on('update-status', listener);
    return () => {
      ipcRenderer.removeListener('update-status', listener);
    };
  },

  // Get current app version
  getAppVersion: async () => {
    return await ipcRenderer.invoke('get-app-version');
  },

  // Get stable desktop device id for license activation
  getDesktopDeviceId: async () => {
    return await ipcRenderer.invoke('get-desktop-device-id');
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
