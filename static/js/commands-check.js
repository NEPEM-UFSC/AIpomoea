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