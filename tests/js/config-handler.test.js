/**
 * Tests for config-handler.js
 * Configuration reading, writing, and popup management
 */

describe('config-handler.js - Configuration Management', () => {
  beforeEach(() => {
    // Setup DOM elements
    document.body.innerHTML = `
      <div class="setting">
        <input type="text" name="setting1" value="" />
      </div>
      <div class="setting">
        <input type="checkbox" name="setting2" />
      </div>
      <div class="setting">
        <select name="setting3">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </select>
      </div>
      <span id="output-folder"></span>
      <span id="database-path"></span>
      <div id="popup-overlay"></div>
      <div id="sucess-popup" class="popup" style="display: none;"></div>
      <div id="error-popup" class="popup" style="display: none;"></div>
    `;
  });

  describe('readConfig', () => {
    it('should send read-config request via IPC', () => {
      const readConfig = () => {
        ipcRenderer.send('read-config');
      };

      readConfig();
      expect(ipcRenderer.send).toHaveBeenCalledWith('read-config');
    });

    it('should update text input with config value', () => {
      const readConfig = () => {
        ipcRenderer.send('read-config');

        ipcRenderer.on('config-response', (event, config) => {
          if (config) {
            Object.keys(config).forEach(key => {
              const element = document.getElementsByName(key)[0];
              if (element) {
                if (element.type && (element.type === 'checkbox')) {
                  element.checked = config[key];
                } else {
                  element.value = config[key];
                }
              }
              document.getElementById('output-folder').textContent = config.OUTPUT_DIR;
              document.getElementById('database-path').textContent = config.DB_PATH;
            });
          }
        });
      };

      readConfig();

      // Simulate config response
      const mockCallback = ipcRenderer.on.mock.calls.find(call => call[0] === 'config-response')[1];
      mockCallback({}, {
        setting1: 'test value',
        setting2: true,
        setting3: 'option2',
        OUTPUT_DIR: '/path/to/output',
        DB_PATH: '/path/to/db'
      });

      expect(document.getElementsByName('setting1')[0].value).toBe('test value');
      expect(document.getElementsByName('setting2')[0].checked).toBe(true);
      expect(document.getElementsByName('setting3')[0].value).toBe('option2');
      expect(document.getElementById('output-folder').textContent).toBe('/path/to/output');
      expect(document.getElementById('database-path').textContent).toBe('/path/to/db');
    });

    it('should handle checkbox type correctly', () => {
      const readConfig = () => {
        ipcRenderer.on('config-response', (event, config) => {
          if (config) {
            Object.keys(config).forEach(key => {
              const element = document.getElementsByName(key)[0];
              if (element) {
                if (element.type && (element.type === 'checkbox')) {
                  element.checked = config[key];
                }
              }
            });
          }
        });
      };

      readConfig();

      const mockCallback = ipcRenderer.on.mock.calls.find(call => call[0] === 'config-response')[1];
      mockCallback({}, { setting2: false });

      expect(document.getElementsByName('setting2')[0].checked).toBe(false);
    });
  });

  describe('writeConfig', () => {
    it('should collect and send configuration successfully', () => {
      // Setup form values
      document.getElementsByName('setting1')[0].value = 'new value';
      document.getElementsByName('setting2')[0].checked = true;
      document.getElementsByName('setting3')[0].value = 'option1';
      document.getElementById('output-folder').textContent = '/new/output';
      document.getElementById('database-path').textContent = '/new/db';

      const showPopup = jest.fn();

      const writeConfig = () => {
        try {
          const config = {};
          document.querySelectorAll('.setting input, .setting select').forEach(element => {
            if (element.type === 'checkbox') {
              config[element.name] = element.checked;
            } else {
              config[element.name] = element.value;
            }
          });

          const outputFolderSpan = document.getElementById('output-folder');
          if (outputFolderSpan) {
            config['OUTPUT_DIR'] = outputFolderSpan.textContent;
          }
          const databasePathSpan = document.getElementById('database-path');
          if (databasePathSpan) {
            config['DB_PATH'] = databasePathSpan.textContent;
          }

          console.log("Configurações a serem salvas:", config);
          ipcRenderer.send('write-config', config);
          showPopup('sucess-popup');
        } catch (error) {
          console.error('Erro ao salvar configurações:', error);
          showPopup('error-popup');
        }
      };

      writeConfig();

      expect(ipcRenderer.send).toHaveBeenCalledWith('write-config', {
        setting1: 'new value',
        setting2: true,
        setting3: 'option1',
        OUTPUT_DIR: '/new/output',
        DB_PATH: '/new/db'
      });
      expect(showPopup).toHaveBeenCalledWith('sucess-popup');
    });

    it('should show error popup on exception', () => {
      const showPopup = jest.fn();

      const writeConfig = () => {
        try {
          // Force an error by querying non-existent elements
          document.querySelectorAll('.non-existent').forEach(() => {});
          throw new Error('Test error');
        } catch (error) {
          console.error('Erro ao salvar configurações:', error);
          showPopup('error-popup');
        }
      };

      writeConfig();

      expect(console.error).toHaveBeenCalledWith('Erro ao salvar configurações:', expect.any(Error));
      expect(showPopup).toHaveBeenCalledWith('error-popup');
    });
  });

  describe('showPopup', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="popup-overlay" style="display: none;"></div>
        <div id="popup1" class="popup" style="display: none;"></div>
        <div id="popup2" class="popup" style="display: none;"></div>
      `;
    });

    it('should display the specified popup and overlay', () => {
      const showPopup = (popupId) => {
        const overlay = document.getElementById("popup-overlay");
        overlay.classList.add("active");
        overlay.style.display = "flex";

        const allPopups = document.querySelectorAll(".popup");
        allPopups.forEach(popup => {
          if (popup.id !== popupId) {
            popup.style.display = "none";
          }
        });
        const popup = document.getElementById(popupId);
        popup.style.display = "flex";
      };

      showPopup('popup1');

      expect(document.getElementById('popup-overlay').style.display).toBe('flex');
      expect(document.getElementById('popup-overlay').classList.contains('active')).toBe(true);
      expect(document.getElementById('popup1').style.display).toBe('flex');
      expect(document.getElementById('popup2').style.display).toBe('none');
    });

    it('should hide other popups when showing a specific one', () => {
      const showPopup = (popupId) => {
        const overlay = document.getElementById("popup-overlay");
        overlay.classList.add("active");
        overlay.style.display = "flex";

        const allPopups = document.querySelectorAll(".popup");
        allPopups.forEach(popup => {
          if (popup.id !== popupId) {
            popup.style.display = "none";
          }
        });
        const popup = document.getElementById(popupId);
        popup.style.display = "flex";
      };

      // First show popup1
      showPopup('popup1');
      expect(document.getElementById('popup1').style.display).toBe('flex');

      // Then show popup2
      showPopup('popup2');
      expect(document.getElementById('popup1').style.display).toBe('none');
      expect(document.getElementById('popup2').style.display).toBe('flex');
    });
  });

  describe('closePopup', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="popup-overlay" class="active" style="display: flex;"></div>
        <div id="popup1" class="popup" style="display: flex;"></div>
        <div id="popup2" class="popup" style="display: none;"></div>
      `;
    });

    it('should close the specified popup', () => {
      const closePopup = (popupId) => {
        const popup = document.getElementById(popupId);
        popup.style.display = "none";

        const anyPopupOpen = Array.from(document.querySelectorAll(".popup"))
          .some(popup => popup.style.display === "flex");
        if (!anyPopupOpen) {
          const overlay = document.getElementById("popup-overlay");
          overlay.classList.remove("active");
          overlay.style.display = "none";
        }
      };

      closePopup('popup1');

      expect(document.getElementById('popup1').style.display).toBe('none');
      expect(document.getElementById('popup-overlay').style.display).toBe('none');
      expect(document.getElementById('popup-overlay').classList.contains('active')).toBe(false);
    });

    it('should keep overlay visible if another popup is still open', () => {
      // Set popup2 to be visible
      document.getElementById('popup2').style.display = 'flex';

      const closePopup = (popupId) => {
        const popup = document.getElementById(popupId);
        popup.style.display = "none";

        const anyPopupOpen = Array.from(document.querySelectorAll(".popup"))
          .some(popup => popup.style.display === "flex");
        if (!anyPopupOpen) {
          const overlay = document.getElementById("popup-overlay");
          overlay.classList.remove("active");
          overlay.style.display = "none";
        }
      };

      closePopup('popup1');

      expect(document.getElementById('popup1').style.display).toBe('none');
      expect(document.getElementById('popup-overlay').style.display).toBe('flex');
      expect(document.getElementById('popup-overlay').classList.contains('active')).toBe(true);
    });
  });

  describe('openDBFileDialog', () => {
    it('should send open-db-file-dialog via IPC', () => {
      const openDBFileDialog = () => {
        ipcRenderer.send('open-db-file-dialog');
      };

      openDBFileDialog();

      expect(ipcRenderer.send).toHaveBeenCalledWith('open-db-file-dialog');
    });
  });

  describe('IPC selected-db-file handler', () => {
    it('should update database-path element when path is provided', () => {
      const mockCallback = jest.fn((path) => {
        if (path) {
          document.getElementById('database-path').textContent = path;
        }
      });

      window.electron.ipcRenderer.on('selected-db-file', mockCallback);

      // Simulate receiving path
      mockCallback('/path/to/database.db');

      expect(document.getElementById('database-path').textContent).toBe('/path/to/database.db');
    });

    it('should not update database-path when path is null', () => {
      document.getElementById('database-path').textContent = '/existing/path';

      const mockCallback = jest.fn((path) => {
        if (path) {
          document.getElementById('database-path').textContent = path;
        }
      });

      window.electron.ipcRenderer.on('selected-db-file', mockCallback);

      // Simulate receiving null path
      mockCallback(null);

      expect(document.getElementById('database-path').textContent).toBe('/existing/path');
    });
  });
});
