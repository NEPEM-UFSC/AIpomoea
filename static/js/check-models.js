function checkModelsInfo() {
    ipcRenderer.send('check-models-info');
}

// Recebe a resposta com os dados de models.json
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
