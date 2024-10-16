// verser.js - Version Checker
// This file is used to check the version of the application and display a badge indicating if it is up-to-date or not.

const VERSER_URL = 'https://nepemufsc.com/.netlify/functions/verser?project=AIpomoea';
const ERROR_MESSAGES = {
  INTERNET_DISCONNECTED: 'Erro ao verificar a versão, verifique sua conexão.',
  FETCH_ERROR: 'Erro desconhecido ao verificar a versão.',
  GENERAL_ERROR: 'Erro ao verificar a versão, verifique sua conexão ou contate o desenvolvedor.'
};

ipcRenderer.send('request-version');
ipcRenderer.on('version-response', (_event, version) => {
    document.getElementById('app-version').textContent = version;
    window.version = version;
  });


/**
  * Fetches the latest version from the server asynchronously.
  * @example
  * fetchLatestVersion()
  * '1.0.0'
  * @param {string} VERSER_URL - The URL from which to fetch the latest version.
  * @returns {string|null} The latest version or an error indicator.
  * @description
  *   - Returns 'INTERNET_DISCONNECTED' if there is no internet connection.
  *   - Handles both fetch and parsing errors gracefully.
  *   - Logs errors to the console for debugging purposes.
  */
  const fetchLatestVersion = async () => {
      try {
          const response = await fetch(VERSER_URL);
          const data = await response.json();
          return data.latest_version;
      } catch (error) {
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
              console.error('Error fetching the latest version: INTERNET_DISCONNECTED');
              return 'INTERNET_DISCONNECTED';
          } else {
              console.error('Error fetching the latest version:', error);
              return null;
          }
      }
  };
  
/**
   * Updates the version information and UI elements based on the latest version.
   *
   * @example
   * updateVersionBadge()
   * // Updates UI components with the version status
   *
   * @param {void} None - No parameters are required.
   * @returns {void} Updates UI elements indicating version status.
   *
   * @description
   * - Handles various states including 'INTERNET_DISCONNECTED', outdated versions, and errors.
   * - Modifies DOM elements like badges, status text, and buttons based on version comparison.
   * - Listens for click events to redirect users for updates if the version is outdated.
   */
  const updateVersionBadge = async () => {
    try {
      const latestVersion = await fetchLatestVersion();
      console.log('Latest version:', latestVersion);
      let currentVersion = await window.version;
      currentVersion = currentVersion.replace('Versao: ', '');
      currentVersion = currentVersion.replace('-beta', '');
      const badgeElement = document.getElementById('version-badge');
      const loadingSpinner = document.getElementById('loading-spinner');
      const statusText = document.getElementById('update-status');
      const updateButton = document.getElementById('update-button');
      const updateInfo = document.getElementById('update-info');
      const latestVersionSpan = document.getElementById('latest-version');
      const latestVersionPC = document.getElementById('latest-version-pc');

      if (latestVersion === 'INTERNET_DISCONNECTED') {
        badgeElement.src = '../static/images/error.svg';
        loadingSpinner.classList.add('hidden');
        badgeElement.classList.remove('hidden');
        document.getElementById('app-version').textContent = `${currentVersion}`;
        statusText.textContent = ERROR_MESSAGES.INTERNET_DISCONNECTED;
      } 
      else if (latestVersion) {
        const status = latestVersion === currentVersion ? 'updated' : 'outdated';
        badgeElement.src = `../static/images/${status}_badge.svg`;
        loadingSpinner.classList.add('hidden');
        badgeElement.classList.remove('hidden');
        document.getElementById('app-version').textContent = `${currentVersion}`;
  
        if (status === 'outdated') {
          statusText.textContent = 'Sua versão está desatualizada.';
          latestVersionSpan.textContent = latestVersion;
          latestVersionSpan.classList.remove('hidden');
          updateButton.classList.remove('hidden');
          updateInfo.classList.remove('hidden');
  
          const newUpdateButton = updateButton.cloneNode(true);
          updateButton.parentNode.replaceChild(newUpdateButton, updateButton);

          newUpdateButton.addEventListener('click', () => {
              window.open('https://github.com/NEPEM-UFSC/AIpomoea/releases', '_blank');
          });
        } else {
          statusText.textContent = 'Você está usando a versão mais recente.';
          updateButton.classList.add('hidden');
          updateInfo.classList.add('hidden');
          latestVersionPC.classList.add('hidden');
        }
      } else {
        console.error('Latest version is null');
        document.getElementById('update-status').textContent = ERROR_MESSAGES.FETCH_ERROR
      }
    } catch (error) {
      console.error('Error updating the version badge:', error);
      document.getElementById('update-status').textContent = ERROR_MESSAGES.GENERAL_ERROR;
    }
  };
  
window.onload = updateVersionBadge;
  
  