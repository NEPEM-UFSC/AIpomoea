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
                populateDropdown(namingConvention); // Populate dropdown with naming convention options
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

    function populateDropdown(namingConvention) {
        const dropdown = document.querySelector('#exportSeparationDropdown');
        dropdown.innerHTML = '';

        const naOption = document.createElement('option');
        naOption.value = 'Nenhum';
        naOption.textContent = 'Nenhum';
        dropdown.appendChild(naOption);

        const options = namingConvention.split('-');
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            dropdown.appendChild(opt);
        });
    }

    checkCustomLoading();
});

/**
 * Executes the loading process by gathering user inputs and sending them for further processing.
 * @example
 * executeCustomLoading()
 * undefined
 * @param {void} No parameters are expected.
 * @returns {void} Does not return any value.
 * @description
 *   - Collects values from user input fields and dropdowns on the interface.
 *   - Sends the collected values as an object for inter-process communication.
 *   - Logs an error message if there is an issue with sending the data.
 */
function executeCustomLoading() {
    const selectedOption = document.querySelector('#textOption').value;
    const customEntry = document.querySelector('#textInput').value;
    const exportSeparation = document.querySelector('#exportSeparationDropdown').value;

    const storedValues = {
        selectedOption,
        customEntry,
        exportSeparation
    };

    try {
        ipcRenderer.send('receive-custom', storedValues);
    } catch (e) {
        console.error('Erro ao enviar comandos:', e);
    }
}