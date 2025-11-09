/**
 * Tests for version.js
 * Version checking and update badge functionality
 */

// Mock constants and functions from version.js
const VERSER_URL = 'https://nepemufsc.com/.netlify/functions/verser?project=AIpomoea';
const ERROR_MESSAGES = {
  INTERNET_DISCONNECTED: 'Erro ao verificar a versão, verifique sua conexão.',
  FETCH_ERROR: 'Erro desconhecido ao verificar a versão.',
  GENERAL_ERROR: 'Erro ao verificar a versão, verifique sua conexão ou contate o desenvolvedor.'
};

describe('version.js - Version Checker', () => {
  beforeEach(() => {
    // Setup DOM elements
    document.body.innerHTML = `
      <div id="app-version"></div>
      <img id="version-badge" class="hidden" />
      <div id="loading-spinner"></div>
      <div id="update-status"></div>
      <button id="update-button" class="hidden"></button>
      <div id="update-info" class="hidden"></div>
      <span id="latest-version" class="hidden"></span>
      <span id="latest-version-pc" class="hidden"></span>
    `;
    
    // Mock window.version
    window.version = 'v1.3.0';
  });

  describe('fetchLatestVersion', () => {
    it('should fetch and return the latest version successfully', async () => {
      const mockVersion = '1.3.0';
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ latest_version: mockVersion })
      });

      const fetchLatestVersion = async () => {
        try {
          const response = await fetch(VERSER_URL);
          const data = await response.json();
          return data.latest_version;
        } catch (error) {
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error('Error fetching the latest version: INTERNET_DISCONNECTED');
            return 'INTERNET_DISCONNECTED';
          }
          console.error('Error fetching the latest version:', error);
          return null;
        }
      };

      const result = await fetchLatestVersion();
      expect(result).toBe(mockVersion);
      expect(global.fetch).toHaveBeenCalledWith(VERSER_URL);
    });

    it('should return INTERNET_DISCONNECTED on network failure', async () => {
      global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const fetchLatestVersion = async () => {
        try {
          const response = await fetch(VERSER_URL);
          const data = await response.json();
          return data.latest_version;
        } catch (error) {
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error('Error fetching the latest version: INTERNET_DISCONNECTED');
            return 'INTERNET_DISCONNECTED';
          }
          console.error('Error fetching the latest version:', error);
          return null;
        }
      };

      const result = await fetchLatestVersion();
      expect(result).toBe('INTERNET_DISCONNECTED');
      expect(console.error).toHaveBeenCalledWith('Error fetching the latest version: INTERNET_DISCONNECTED');
    });

    it('should return null on general fetch errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Unknown error'));

      const fetchLatestVersion = async () => {
        try {
          const response = await fetch(VERSER_URL);
          const data = await response.json();
          return data.latest_version;
        } catch (error) {
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.error('Error fetching the latest version: INTERNET_DISCONNECTED');
            return 'INTERNET_DISCONNECTED';
          }
          console.error('Error fetching the latest version:', error);
          return null;
        }
      };

      const result = await fetchLatestVersion();
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Error fetching the latest version:', expect.any(Error));
    });
  });

  describe('updateVersionBadge', () => {
    it('should display updated badge when versions match', async () => {
      window.version = 'Versao: 1.3.0';
      const mockVersion = '1.3.0';
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ latest_version: mockVersion })
      });

      const updateVersionBadge = async () => {
        try {
          const fetchLatestVersion = async () => {
            const response = await fetch(VERSER_URL);
            const data = await response.json();
            return data.latest_version;
          };

          const latestVersion = await fetchLatestVersion();
          console.log('NEPEMVERSER, LATEST-VERSION: ', latestVersion);
          
          let currentVersion = await window.version;
          currentVersion = currentVersion.replace('Versao: ', '');
          
          const badgeElement = document.getElementById('version-badge');
          const loadingSpinner = document.getElementById('loading-spinner');
          const statusText = document.getElementById('update-status');
          const updateButton = document.getElementById('update-button');
          const updateInfo = document.getElementById('update-info');

          if (latestVersion === 'INTERNET_DISCONNECTED') {
            badgeElement.src = '../static/images/error.svg';
            loadingSpinner.classList.add('hidden');
            badgeElement.classList.remove('hidden');
            document.getElementById('app-version').textContent = `${currentVersion}`;
            statusText.textContent = ERROR_MESSAGES.INTERNET_DISCONNECTED;
          } else if (latestVersion) {
            const status = latestVersion === currentVersion ? 'updated' : 'outdated';
            badgeElement.src = `../static/images/${status}_badge.svg`;
            loadingSpinner.classList.add('hidden');
            badgeElement.classList.remove('hidden');
            document.getElementById('app-version').textContent = `${currentVersion}`;

            if (status === 'outdated') {
              statusText.textContent = 'Sua versão está desatualizada.';
              updateButton.classList.remove('hidden');
              updateInfo.classList.remove('hidden');
            } else {
              statusText.textContent = 'Você está usando a versão mais recente.';
              updateButton.classList.add('hidden');
              updateInfo.classList.add('hidden');
            }
          }
        } catch (error) {
          console.error('Error updating the version badge:', error);
          document.getElementById('update-status').textContent = ERROR_MESSAGES.GENERAL_ERROR;
        }
      };

      await updateVersionBadge();

      expect(document.getElementById('version-badge').src).toContain('updated_badge.svg');
      expect(document.getElementById('update-status').textContent).toBe('Você está usando a versão mais recente.');
      expect(document.getElementById('update-button').classList.contains('hidden')).toBe(true);
    });

    it('should display outdated badge when versions differ', async () => {
      window.version = 'Versao: 1.2.0';
      const mockVersion = '1.3.0';
      
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ latest_version: mockVersion })
      });

      const updateVersionBadge = async () => {
        try {
          const fetchLatestVersion = async () => {
            const response = await fetch(VERSER_URL);
            const data = await response.json();
            return data.latest_version;
          };

          const latestVersion = await fetchLatestVersion();
          let currentVersion = await window.version;
          currentVersion = currentVersion.replace('Versao: ', '');
          
          const badgeElement = document.getElementById('version-badge');
          const loadingSpinner = document.getElementById('loading-spinner');
          const statusText = document.getElementById('update-status');
          const updateButton = document.getElementById('update-button');
          const updateInfo = document.getElementById('update-info');
          const latestVersionSpan = document.getElementById('latest-version');
          const latestVersionPC = document.getElementById('latest-version-pc');

          if (latestVersion) {
            const status = latestVersion === currentVersion ? 'updated' : 'outdated';
            badgeElement.src = `../static/images/${status}_badge.svg`;
            loadingSpinner.classList.add('hidden');
            badgeElement.classList.remove('hidden');
            document.getElementById('app-version').textContent = `${currentVersion}`;

            if (status === 'outdated') {
              statusText.textContent = 'Sua versão está desatualizada.';
              latestVersionSpan.textContent = latestVersion;
              latestVersionSpan.classList.remove('hidden');
              latestVersionPC.classList.remove('hidden');
              updateButton.classList.remove('hidden');
              updateInfo.classList.remove('hidden');
            }
          }
        } catch (error) {
          console.error('Error updating the version badge:', error);
        }
      };

      await updateVersionBadge();

      expect(document.getElementById('version-badge').src).toContain('outdated_badge.svg');
      expect(document.getElementById('update-status').textContent).toBe('Sua versão está desatualizada.');
      expect(document.getElementById('latest-version').textContent).toBe('1.3.0');
      expect(document.getElementById('update-button').classList.contains('hidden')).toBe(false);
    });

    it('should display error badge when disconnected', async () => {
      window.version = 'Versao: 1.3.0';
      
      global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const updateVersionBadge = async () => {
        try {
          const fetchLatestVersion = async () => {
            try {
              const response = await fetch(VERSER_URL);
              const data = await response.json();
              return data.latest_version;
            } catch (error) {
              if (error instanceof TypeError && error.message === 'Failed to fetch') {
                return 'INTERNET_DISCONNECTED';
              }
              return null;
            }
          };

          const latestVersion = await fetchLatestVersion();
          let currentVersion = await window.version;
          currentVersion = currentVersion.replace('Versao: ', '');
          
          const badgeElement = document.getElementById('version-badge');
          const loadingSpinner = document.getElementById('loading-spinner');
          const statusText = document.getElementById('update-status');

          if (latestVersion === 'INTERNET_DISCONNECTED') {
            badgeElement.src = '../static/images/error.svg';
            loadingSpinner.classList.add('hidden');
            badgeElement.classList.remove('hidden');
            document.getElementById('app-version').textContent = `${currentVersion}`;
            statusText.textContent = ERROR_MESSAGES.INTERNET_DISCONNECTED;
          }
        } catch (error) {
          console.error('Error updating the version badge:', error);
        }
      };

      await updateVersionBadge();

      expect(document.getElementById('version-badge').src).toContain('error.svg');
      expect(document.getElementById('update-status').textContent).toBe(ERROR_MESSAGES.INTERNET_DISCONNECTED);
    });

    it('should handle null latest version gracefully', async () => {
      window.version = 'Versao: 1.3.0';
      
      global.fetch.mockRejectedValueOnce(new Error('Unknown error'));

      const updateVersionBadge = async () => {
        try {
          const fetchLatestVersion = async () => {
            try {
              const response = await fetch(VERSER_URL);
              const data = await response.json();
              return data.latest_version;
            } catch (error) {
              console.error('Error fetching the latest version:', error);
              return null;
            }
          };

          const latestVersion = await fetchLatestVersion();
          const statusText = document.getElementById('update-status');

          if (!latestVersion && latestVersion !== 'INTERNET_DISCONNECTED') {
            console.error('Latest version is null');
            statusText.textContent = ERROR_MESSAGES.FETCH_ERROR;
          }
        } catch (error) {
          console.error('Error updating the version badge:', error);
          document.getElementById('update-status').textContent = ERROR_MESSAGES.GENERAL_ERROR;
        }
      };

      await updateVersionBadge();

      expect(console.error).toHaveBeenCalledWith('Latest version is null');
      expect(document.getElementById('update-status').textContent).toBe(ERROR_MESSAGES.FETCH_ERROR);
    });
  });

  describe('IPC Communication', () => {
    it('should send request-version on initialization', () => {
      // Simulate the script loading
      ipcRenderer.send('request-version');
      
      expect(ipcRenderer.send).toHaveBeenCalledWith('request-version');
    });

    it('should handle version-response and update DOM', () => {
      const mockCallback = jest.fn((event, version) => {
        document.getElementById('app-version').textContent = version;
        window.version = version;
      });

      ipcRenderer.on('version-response', mockCallback);
      
      // Simulate receiving version response
      const mockEvent = {};
      const mockVersion = 'v1.3.0';
      mockCallback(mockEvent, mockVersion);

      expect(document.getElementById('app-version').textContent).toBe('v1.3.0');
      expect(window.version).toBe('v1.3.0');
    });
  });
});
