/**
 * Disables checkboxes for operations not found in the specified model arrays.
 * @example
 * checkAndBlockOperations()
 * // Fetches data from models.json, disables unavailable operations
 * @param {void} No parameters required for this function.
 * @returns {void} This function does not return any value.
 * @description
 *   - Fetches a JSON file to determine which operations should remain enabled.
 *   - Disables operations that are not listed in `root` or `leaves` arrays from the fetched data.
 *   - Logs an error to the console if there is an issue loading the JSON file.
 */
function checkAndBlockOperations() {
    fetch('../models.json')
        .then(response => response.json())
        .then(data => {
            const operations = document.querySelectorAll('.operation-item input[type="checkbox"]');
            operations.forEach(operation => {
                const operationId = operation.id.replace(/-/g, '_');
                if (!data.root.includes(operationId) && !data.leaves.includes(operationId) && !['csv', 'json', 'connected_database'].includes(operationId)) {
                    operation.disabled = true;
                }
            });
        })
        .catch(error => console.error('Erro ao carregar models.json:', error));
}