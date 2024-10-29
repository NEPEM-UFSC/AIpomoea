/**
 * Sends a request to read configuration and updates the DOM elements with the received configuration values.
 * @example
 * readConfig();
 * @param none
 * @returns {void} No return value.
 * @description
 *   - Listens for 'config-response' from IPC and processes the configuration.
 *   - Updates DOM elements matching configuration keys with appropriate values.
 *   - Logs success or error messages depending on presence of respective DOM elements.
 */
function readConfig() {
    ipcRenderer.send('read-config');

    ipcRenderer.on('config-response', (event, config) => {
        if (config) {
            Object.keys(config).forEach(key => {
                const element = document.getElementsByName(key)[0];
                if (element) {
                    if (element.type && (element.type === 'checkbox')) {
                        element.checked = config[key];
                    }
                    else {
                        element.value = config[key];
                    }
                document.getElementById('output-folder').textContent = config.OUTPUT_DIR;
                document.getElementById('database-path').textContent = config.DB_PATH;

                } else {
                    console.error(`Elemento ${key} não encontrado no DOM.`);
                }
            });
        }
    });
}


/**
 * Gathers form settings and sends them for saving
 * @example
 * writeConfig()
 * undefined
 * @param {none} - This function does not take any arguments.
 * @returns {void} No return value.
 * @description
 *   - Collects form inputs with class 'setting' and stores their values in a configuration object.
 *   - Supports both checkbox and other input types.
 *   - Logs the configuration object before sending it via IPC.
 */
function writeConfig() {
    try {
        const config = {};
        document.querySelectorAll('.setting input').forEach(element => {
            if (element.type === 'checkbox') {
                config[element.id] = element.checked;
            } else {
                config[element.id] = element.value;
            }
        });
        // Adiciona o caminho do diretório do span output-folder
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
}

/**
 * @brief Displays a popup element by ID and activates an overlay background.
 *
 * This function displays an overlay element and shows a specific popup by its ID.
 * All other popups are hidden to ensure only the requested popup is visible.
 *
 * @param[in] popupId The ID of the popup element to display.
 *
 * @return void This function does not return a value.
 *
 * @details
 * - Activates the overlay by setting its CSS `display` property to "flex" and adding the "active" class.
 * - Hides any other popups that may be open, to only display the specified popup.
 * - Displays the selected popup with the given ID by setting its CSS `display` property to "flex".
 *
 * @note Assumes that each popup has the CSS class `.popup` and the overlay has the ID `popup-overlay`.
 */
function showPopup(popupId) {
    const overlay = document.getElementById("popup-overlay");
    overlay.classList.add("active");
    overlay.style.display = "flex";

    // Oculta todos os popups antes de exibir o específico
    const allPopups = document.querySelectorAll(".popup");
    allPopups.forEach(popup => {
        if (popup.id !== popupId) {
            popup.style.display = "none";
        }
    });
    const popup = document.getElementById(popupId);
    popup.style.display = "flex";
}

/**
 * @brief Closes a specified popup and optionally hides the overlay if no other popups are open.
 *
 * This function hides a popup element by ID. If no other popups are currently visible,
 * the overlay background will also be hidden.
 *
 * @param[in] popupId The ID of the popup element to close.
 *
 * @return void This function does not return a value.
 *
 * @details
 * - Hides the specified popup by setting its CSS `display` property to "none".
 * - Checks if any other popups are open by iterating over elements with the `.popup` class.
 * - If no popups are open, removes the "active" class from the overlay and hides it by setting `display` to "none".
 *
 * @note Assumes that each popup has the CSS class `.popup` and the overlay has the ID `popup-overlay`.
 */
function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    popup.style.display = "none";

    // Verifica se há outros popups abertos. Se nenhum estiver aberto, oculta o overlay.
    const anyPopupOpen = Array.from(document.querySelectorAll(".popup"))
        .some(popup => popup.style.display === "flex");
    if (!anyPopupOpen) {
        const overlay = document.getElementById("popup-overlay");
        overlay.classList.remove("active");
        overlay.style.display = "none";
    }
}

/**
* Opens a dialog window to select a database file.
* @example
* openDBFileDialog()
* // Opens the file dialog
* @returns {void} Does not return a value.
* @description
*   - Utilizes ipcRenderer to send a signal.
*   - Part of a system for file handling.
*/
function openDBFileDialog() {
    ipcRenderer.send('open-db-file-dialog');
};


/**
 * Updates the text content of an HTML element if a path is provided.
 * @example
 * updateDatabasePath('/some/path')
 * // Updates the 'database-path' element text to '/some/path'
 * @param {string} path - The file path to set in the document.
 * @returns {void} No return value.
 * @description
 *   - Sets the text content of the element with ID 'database-path'.
 *   - Only updates the element if the path is truthy.
 */
window.electron.ipcRenderer.on('selected-db-file', (path) => {
    if (path) {
        document.getElementById('database-path').textContent = path;
    }
});