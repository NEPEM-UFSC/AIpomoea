/**
 * Sends a log message to the IPC renderer or logs an error if unavailable.
 * @example
 * logMessage('info', 'This is an informational message')
 * // If ipcRenderer is available, message is sent else logs error.
 * @param {string} level - The severity level of the log message ('info', 'warn', 'error').
 * @param {string} message - The content of the log message.
 * @returns {void} Does not return a value.
 * @description
 *   - Uses 'ipcRenderer' to send log messages.
 *   - Provides fallback error logging if 'ipcRenderer' is not present.
 */
function logMessage(level, message) {
    if (ipcRenderer) {
        ipcRenderer.send('log-message', level, message);
    } else {
        console.error('ipcRenderer is not available');
    }
}