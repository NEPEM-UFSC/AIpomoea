const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, ...args))
});

contextBridge.exposeInMainWorld('webUtils', {
    getPathForFile: async (file) => webUtils.getPathForFile(file)
});

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
/**
        * Sends data to a specified channel if the channel is valid.
        * @example
        * sendIfValidChannel('open-db-file-dialog', { path: '/user/docs' })
        * undefined
        * @param {string} channel - The channel to which the data should be sent.
        * @param {Object} data - The data to send through the channel.
        * @returns {void} No return value.
        * @description
        *   - The function checks if the provided channel is within a predefined list of valid channels.
        *   - If the channel is valid, it uses ipcRenderer to send the data.
        *   - Valid channels ensure that data is sent only through secure, recognized pathways.
        */
        send: (channel, data) => {
            const validChannels = ['open-db-file-dialog', 'read-config', 'write-config'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
/**
         * Sets up an event listener on a given channel if it's valid.
         * @example
         * (channel, func) => { ... }
         * @param {string} channel - The channel name to listen to.
         * @param {function} func - The callback function to execute when the event is triggered.
         * @returns {void} No return value.
         * @description
         *   - Listens for specified IPC renderer channels.
         *   - Executes the callback with the arguments passed from the event.
         *   - Ensures the channel is among a predefined list of valid channels.
         *   - Utilizes IPC communication within an Electron application context.
         */
        on: (channel, func) => {
            const validChannels = ['selected-db-file', 'config-response', 'write-config-response'];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
});