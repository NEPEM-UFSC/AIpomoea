function logMessage(level, message) {
    if (ipcRenderer) {
        ipcRenderer.send('log-message', level, message);
    } else {
        console.error('ipcRenderer is not available');
    }
}