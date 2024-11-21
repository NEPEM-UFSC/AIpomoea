/**
* Sends a message to check models information via ipcRenderer
* @example
* checkModelsInfo()
* undefined
* @param {none} No parameters are required.
* @returns {undefined} Does not return any value.
* @description
*   - Utilizes ipcRenderer to communicate with the main process.
*   - Triggers an event named 'check-models-info'.
*/
function checkModelsInfo() {
    ipcRenderer.send('check-models-info');
}

/**
 * Triggers a check for available models by sending a signal.
 * @example
 * checkModels()
 * // sends signal to check models
 * @returns {void} No return value.
 * @description
 *   - Sends an IPC message using 'check-models' channel.
 *   - Intended for triggering model verification processes.
 *   - Utilizes Node.js IPC Renderer for inter-process communication.
 */
function checkModels() {
    console.log('Checking models...');
    ipcRenderer.send('check-models');
}


/**
 * Populates a table with model information or shows an error popup if loading fails.
 * @example
 * updateModelTable(event, models)
 * Displays table rows with model data or an error popup
 * @param {Object} event - Event object triggering the update.
 * @param {Object} models - Contains model data and potential error information.
 * @returns {void} This function does not return any value.
 * @description
 *   - Utilizes DOM manipulation to clear and update the table body with new rows.
 *   - Handles both root and leaf model types.
 *   - Invokes popup display functions based on success or failure of data loading.
 */
ipcRenderer.on('models-info-response', (event, models) => {
    if (models.error) {
        console.error('Erro ao carregar informações dos modelos:', models.error);
        showPopup('error-popup');
    } else {
        // Seleciona o corpo da tabela e limpa qualquer conteúdo pré-existente
        const tableBody = document.querySelector('#models-table tbody');
        tableBody.innerHTML = '';

        // Função para adicionar uma linha na tabela
        const addModelRow = (modelKey, modelDetails) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${modelKey}</td>
                <td>${modelDetails.model_name}</td>
                <td>${modelDetails.arc_name}</td>
                <td>${modelDetails.arc_version}</td>
                <td>${modelDetails.dataset}</td>
                <td>${modelDetails.bin_eval_name}</td>
            `;
            tableBody.appendChild(row);
        };

        // Itera sobre os modelos em "root" e "leaves" e insere na tabela
        models.root.forEach(modelKey => {
            const modelDetails = models.details[modelKey];
            if (modelDetails) {
                addModelRow(modelKey, modelDetails);
            }
        });

        models.leaves.forEach(modelKey => {
            const modelDetails = models.details[modelKey];
            if (modelDetails) {
                addModelRow(modelKey, modelDetails);
            }
        });

        // Exibe o popup com as informações dos modelos
        showPopup('models-info-popup');
    }
});

/**
* Handles the response for model validation and displays appropriate popups based on the response status.
* @example
* handleModelValidation(event, response)
* // Logs messages and shows appropriate popups
* @param {Object} event - The event object triggering the validation process.
* @param {Object} response - The response object from the model validation, containing status and list of invalid models.
* @returns {void} No return value.
* @description
*   - Displays a success popup if all models are valid.
*   - Logs error details to the console if there are invalid models.
*   - Populates an error list with models when the response contains errors.
*/
ipcRenderer.on('models-check-response', (event, response) => {
    if (response.status === 'good') {
        console.log('All models are valid');
        showPopup('sucess-model-popup');
    } else if (response.status === 'error') {
        console.error('Error checking models:', response.error);
        const errorList = document.querySelector('#model-error-list');
        errorList.innerHTML = ''; // Clear previous content

        // Display each invalid model in the error popup
        response.invalidExecutables.forEach((model) => {
            const listItem = document.createElement('li');
            listItem.textContent = model;
            errorList.appendChild(listItem);
        });

        showPopup('model-error-popup');
    }
});