// verser.js - Version Checker
// This file is used to check the version of the application and display a badge indicating if it is up-to-date or not.
// Based on the implementation of the serverless function "NEPEMVERSER" available at https://nepemufsc.com/.netlify/functions/verser?project=AIpomoea
// The version is displayed in the footer of the application and is checked against the latest version available on the server.
// If the version is outdated, a badge is displayed with a link to the GitHub releases page for the user to download the latest version.
// The badge is updated when the application is loaded and the latest version is fetched from the server.
// This logic is based on the orthodox client side version checker implementation of NEPEMVERSER.


const VERSER_URL = 'https://nepemufsc.com/.netlify/functions/verser?project=AIpomoea';
const ERROR_MESSAGES = {
  INTERNET_DISCONNECTED: 'Erro ao verificar a versão, verifique sua conexão.',
  FETCH_ERROR: 'Erro desconhecido ao verificar a versão.',
  GENERAL_ERROR: 'Erro ao verificar a versão, verifique sua conexão ou contate o desenvolvedor.'
};

// Pedidos constantes
ipcRenderer.send('request-version');

/**
* Updates the application's version display and global version variable.
* @example
* updateVersion(event, 'v1.0.0')
* // Updates the DOM element with id 'app-version' to show 'v1.0.0' and sets window.version to 'v1.0.0'
* @param {Event} _event - The event that triggers the version update.
* @param {string} version - The version number to be displayed and stored globally.
* @returns {void} No return value.
* @description
*   - Updates the text content of the element with the id 'app-version'.
*   - Sets the global window.version variable to the provided version value.
*/
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
          } 
              console.error('Error fetching the latest version:', error);
              return null;
      }
  };
  
/**
   * Checks the application version and updates the UI accordingly.
   * @example
   * checkAndUpdateVersion()
   * undefined
   * @async
   * @function
   * @param {void} N/A - This function does not take any arguments.
   * @returns {Promise<void>} Promise that resolves when the UI has been updated based on the latest version check.
   * @description
   *   - Fetches the latest version of the application asynchronously.
   *   - Updates the UI elements like badges, status text, and buttons based on the version comparison.
   *   - Handles different states, such as internet disconnected or errors during fetching latest version.
   *   - Adds an event listener to the update button to redirect users for downloading the latest version.
   */
  const updateVersionBadge = async () => {
    try {
      const latestVersion = await fetchLatestVersion();
      console.log('NEPEMVERSER, LATEST-VERSION: ', latestVersion);
      let currentVersion = await window.version;
      currentVersion = currentVersion.replace('Versao: ', '');
      currentVersion = currentVersion.replace('-release candidate', '');
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
          latestVersionPC.classList.remove('hidden');
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

  
  