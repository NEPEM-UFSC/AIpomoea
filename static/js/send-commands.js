/**
 * Execute commands based on the specified mode and checkbox states.
 * @example
 * executeCommands('edit')
 * // Executes commands in 'edit' mode and sends checkbox states to ipcRenderer
 * @param {string} mode - The operation mode to execute commands in.
 * @returns {void} Does not return a value.
 * @description
 *   - Collects the state of all checkboxes within the side-panel.
 *   - Sends the mode and checkbox states to the IPC renderer process.
 */
function executeCommands(mode) {
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
}