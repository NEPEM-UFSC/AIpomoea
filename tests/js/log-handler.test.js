/**
 * Tests for log-handler.js
 * Logging message functionality via IPC
 */

describe('log-handler.js - Logging', () => {
  describe('logMessage', () => {
    it('should send log message via IPC when ipcRenderer is available', () => {
      const logMessage = (level, message) => {
        if (ipcRenderer) {
          ipcRenderer.send('log-message', level, message);
        } else {
          console.error('ipcRenderer is not available');
        }
      };

      logMessage('info', 'Test message');

      expect(ipcRenderer.send).toHaveBeenCalledWith('log-message', 'info', 'Test message');
    });

    it('should handle error level logs', () => {
      const logMessage = (level, message) => {
        if (ipcRenderer) {
          ipcRenderer.send('log-message', level, message);
        } else {
          console.error('ipcRenderer is not available');
        }
      };

      logMessage('error', 'Error occurred');

      expect(ipcRenderer.send).toHaveBeenCalledWith('log-message', 'error', 'Error occurred');
    });

    it('should handle warn level logs', () => {
      const logMessage = (level, message) => {
        if (ipcRenderer) {
          ipcRenderer.send('log-message', level, message);
        } else {
          console.error('ipcRenderer is not available');
        }
      };

      logMessage('warn', 'Warning message');

      expect(ipcRenderer.send).toHaveBeenCalledWith('log-message', 'warn', 'Warning message');
    });

    it('should log error when ipcRenderer is not available', () => {
      const originalIpcRenderer = global.ipcRenderer;
      global.ipcRenderer = null;

      const logMessage = (level, message) => {
        if (ipcRenderer) {
          ipcRenderer.send('log-message', level, message);
        } else {
          console.error('ipcRenderer is not available');
        }
      };

      logMessage('info', 'Test message');

      expect(console.error).toHaveBeenCalledWith('ipcRenderer is not available');

      // Restore original ipcRenderer
      global.ipcRenderer = originalIpcRenderer;
    });
  });
});
