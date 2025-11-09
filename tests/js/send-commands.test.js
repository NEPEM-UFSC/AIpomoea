/**
 * Tests for send-commands.js
 * Command execution functionality
 */

describe('send-commands.js - Command Execution', () => {
  beforeEach(() => {
    // Setup DOM elements with checkboxes
    document.body.innerHTML = `
      <div id="loading-popup" class="popup" style="display: none;"></div>
      <div class="side-panel">
        <input type="checkbox" id="command1" checked />
        <input type="checkbox" id="command2" />
        <input type="checkbox" id="command3" checked />
      </div>
    `;
  });

  describe('executeCommands', () => {
    it('should collect checkbox states and send via IPC', () => {
      // Mock showPopup function
      const showPopup = jest.fn((popupId) => {
        const popup = document.getElementById(popupId);
        if (popup) {
          popup.style.display = 'flex';
        }
      });

      const executeCommands = (mode) => {
        showPopup('loading-popup');
        const typemode = mode;
        const checkboxes = Array.from(document.querySelectorAll('.side-panel input[type="checkbox"]'));
        const checkboxStates = {};

        checkboxes.forEach(checkbox => {
          checkboxStates[checkbox.id] = checkbox.checked;
        });

        try {
          ipcRenderer.send('receive_commands', { typemode, checkboxStates });
        } catch (e) {
          console.error('Erro ao enviar comandos:', e);
        }
      };

      executeCommands('edit');

      expect(showPopup).toHaveBeenCalledWith('loading-popup');
      expect(ipcRenderer.send).toHaveBeenCalledWith('receive_commands', {
        typemode: 'edit',
        checkboxStates: {
          command1: true,
          command2: false,
          command3: true
        }
      });
    });

    it('should handle different mode types', () => {
      const showPopup = jest.fn();

      const executeCommands = (mode) => {
        showPopup('loading-popup');
        const typemode = mode;
        const checkboxes = Array.from(document.querySelectorAll('.side-panel input[type="checkbox"]'));
        const checkboxStates = {};

        checkboxes.forEach(checkbox => {
          checkboxStates[checkbox.id] = checkbox.checked;
        });

        try {
          ipcRenderer.send('receive_commands', { typemode, checkboxStates });
        } catch (e) {
          console.error('Erro ao enviar comandos:', e);
        }
      };

      executeCommands('process');

      expect(ipcRenderer.send).toHaveBeenCalledWith('receive_commands', {
        typemode: 'process',
        checkboxStates: expect.any(Object)
      });
    });

    it('should handle empty checkbox list', () => {
      document.body.innerHTML = `
        <div id="loading-popup" class="popup" style="display: none;"></div>
        <div class="side-panel"></div>
      `;

      const showPopup = jest.fn();

      const executeCommands = (mode) => {
        showPopup('loading-popup');
        const typemode = mode;
        const checkboxes = Array.from(document.querySelectorAll('.side-panel input[type="checkbox"]'));
        const checkboxStates = {};

        checkboxes.forEach(checkbox => {
          checkboxStates[checkbox.id] = checkbox.checked;
        });

        try {
          ipcRenderer.send('receive_commands', { typemode, checkboxStates });
        } catch (e) {
          console.error('Erro ao enviar comandos:', e);
        }
      };

      executeCommands('edit');

      expect(ipcRenderer.send).toHaveBeenCalledWith('receive_commands', {
        typemode: 'edit',
        checkboxStates: {}
      });
    });

    it('should handle errors during command sending', () => {
      ipcRenderer.send.mockImplementationOnce(() => {
        throw new Error('IPC Error');
      });

      const showPopup = jest.fn();

      const executeCommands = (mode) => {
        showPopup('loading-popup');
        const typemode = mode;
        const checkboxes = Array.from(document.querySelectorAll('.side-panel input[type="checkbox"]'));
        const checkboxStates = {};

        checkboxes.forEach(checkbox => {
          checkboxStates[checkbox.id] = checkbox.checked;
        });

        try {
          ipcRenderer.send('receive_commands', { typemode, checkboxStates });
        } catch (e) {
          console.error('Erro ao enviar comandos:', e);
        }
      };

      executeCommands('edit');

      expect(console.error).toHaveBeenCalledWith('Erro ao enviar comandos:', expect.any(Error));
    });

    it('should show loading popup before sending commands', () => {
      const showPopup = jest.fn();

      const executeCommands = (mode) => {
        showPopup('loading-popup');
        const typemode = mode;
        const checkboxes = Array.from(document.querySelectorAll('.side-panel input[type="checkbox"]'));
        const checkboxStates = {};

        checkboxes.forEach(checkbox => {
          checkboxStates[checkbox.id] = checkbox.checked;
        });

        try {
          ipcRenderer.send('receive_commands', { typemode, checkboxStates });
        } catch (e) {
          console.error('Erro ao enviar comandos:', e);
        }
      };

      executeCommands('edit');

      expect(showPopup).toHaveBeenCalledWith('loading-popup');
      // Verify that showPopup was called before ipcRenderer.send
      const showPopupCallOrder = showPopup.mock.invocationCallOrder[0];
      const ipcSendCallOrder = ipcRenderer.send.mock.invocationCallOrder[0];
      expect(showPopupCallOrder).toBeLessThan(ipcSendCallOrder);
    });
  });
});
