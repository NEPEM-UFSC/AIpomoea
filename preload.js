const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args))
});

contextBridge.exposeInMainWorld('webUtils', {
    getPathForFile: async (file) => webUtils.getPathForFile(file)
});