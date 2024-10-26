/**
 * Analyzes DOM and checks genotype status, revealing elements if enabled.
 * @example
 * functionName()
 * // Logs genotype status and modifies element display based on status.
 * @param {none} none - This function does not take any arguments.
 * @returns {void} This function does not return anything.
 * @description
 *   - Listens for genotype status via 'ipcRenderer' events.
 *   - Reveals specific DOM elements if genotype is enabled.
 *   - Outputs log messages about the genotype status and modified elements.
 */
document.addEventListener('DOMContentLoaded', () => {

    function checkCustomLoading() {
        ipcRenderer.send('request-genotype');
        ipcRenderer.on('genotype-response', (_event, enabledGenotype) => {
            if (enabledGenotype) {
                revealElements();
            }
        });
        function revealElements() {
            const elements = document.querySelectorAll('.preloading-genotype, h3[style*="display: none"]');
            elements.forEach(element => {
                element.style.display = 'block';
            });
        }
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