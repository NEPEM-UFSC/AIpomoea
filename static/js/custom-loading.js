/**
 * Analyzes DOM and checks naming status, revealing elements if enabled.
 * @example
 * functionName()
 * // Logs naming status and modifies element display based on status.
 * @param {none} none - This function does not take any arguments.
 * @returns {void} This function does not return anything.
 * @description
 *   - Listens for naming status via 'ipcRenderer' events.
 *   - Reveals specific DOM elements if naming is enabled.
 *   - Outputs log messages about the naming status and modified elements.
 */
document.addEventListener('DOMContentLoaded', () => {

    function checkCustomLoading() {
        ipcRenderer.send('request-naming');
        ipcRenderer.on('naming-response', (_event, response) => {
            const { enableNamingSeparation, namingConvention } = response;
            console.log('Naming response received:', response); // Adicionar log para depuração
            if (enableNamingSeparation) {
                console.log('Naming separation enabled, revealing elements.'); // Adicionar log para depuração
                revealElements();
            } else {
                console.log('Naming separation not enabled.'); // Adicionar log para depuração
            }
        });
    }

    function revealElements() {
        const elements = document.querySelectorAll('.preloading-naming, h3[style*="display: none"]');
        elements.forEach(element => {
            element.style.display = 'block';
            console.log('Element revealed:', element); // Adicionar log para depuração
        });
    }

    checkCustomLoading();
});

/**
 * Executes a custom loading functionality based on selected option and custom input.
 * @example
 * executeCustomLoading()
 * Logs selected option and custom entry, sends them via ipcRenderer.
 * @param {void} - This function does not take any arguments.
 * @returns {void} This function does not return anything.
 * @description
 *   - Fetches selected option and custom entry from DOM.
 *   - Logs and stores the fetched values.
 *   - Sends stored values using ipcRenderer.
 *   - Handles errors during IPC communication with a try-catch block.
 */
function executeCustomLoading() {
    const selectedOption = document.querySelector('#textOption').value;
    const customEntry = document.querySelector('#textInput').value;

    // Armazenar os valores conforme necessário
    const storedValues = {
        selectedOption,
        customEntry
    };

    try {
        ipcRenderer.send('receive-custom', storedValues); // Pass the storedValues as a single object
    } catch (e) {
        console.error('Erro ao enviar comandos:', e);
    }
}