const logger = require("../../tools/logger");


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
        // Unused variable 'event'
        console.log('Recebendo configurações:', config);
        if (config) {
            
            console.log('Configurações recebidas com sucesso.');
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

function showPopup(popupId) {
    // Mostra o fundo de overlay
    const overlay = document.getElementById("popup-overlay");
    overlay.classList.add("active");

    // Exibe o popup específico
    const popup = document.getElementById(popupId);
    popup.style.display = "flex";
}

function closePopup(popupId) {
    // Oculta o popup específico
    const popup = document.getElementById(popupId);
    popup.style.display = "none";

    // Verifica se há outros popups abertos. Se nenhum estiver aberto, oculta o overlay
    const anyPopupOpen = Array.from(document.querySelectorAll(".popup"))
        .some(popup => popup.style.display === "flex");

    if (!anyPopupOpen) {
        document.getElementById("popup-overlay").classList.remove("active");
    }
}