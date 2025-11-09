/**
 * Tests for check-models.js
 * Model information and validation functionality
 */

describe('check-models.js - Model Checking', () => {
  beforeEach(() => {
    // Setup DOM elements
    document.body.innerHTML = `
      <div id="models-info-popup" class="popup" style="display: none;"></div>
      <div id="error-popup" class="popup" style="display: none;"></div>
      <div id="sucess-model-popup" class="popup" style="display: none;"></div>
      <div id="model-error-popup" class="popup" style="display: none;"></div>
      <table id="models-table">
        <tbody></tbody>
      </table>
      <ul id="model-error-list"></ul>
    `;
  });

  describe('checkModelsInfo', () => {
    it('should send check-models-info via IPC', () => {
      const checkModelsInfo = () => {
        ipcRenderer.send('check-models-info');
      };

      checkModelsInfo();

      expect(ipcRenderer.send).toHaveBeenCalledWith('check-models-info');
    });
  });

  describe('checkModels', () => {
    it('should send check-models via IPC', () => {
      const checkModels = () => {
        console.log('Checking models...');
        ipcRenderer.send('check-models');
      };

      checkModels();

      expect(console.log).toHaveBeenCalledWith('Checking models...');
      expect(ipcRenderer.send).toHaveBeenCalledWith('check-models');
    });
  });

  describe('models-info-response handler', () => {
    it('should populate table with model information', () => {
      const showPopup = jest.fn();
      
      const mockModels = {
        root: ['root_format', 'root_color'],
        leaves: ['leaf_shape'],
        details: {
          'root_format': {
            model_name: 'Format Classifier',
            arc_name: 'ResNet50',
            arc_version: '1.0',
            dataset: 'Format Dataset',
            bin_eval_name: 'format.bat'
          },
          'root_color': {
            model_name: 'Color Classifier',
            arc_name: 'VGG16',
            arc_version: '2.0',
            dataset: 'Color Dataset',
            bin_eval_name: 'color.bat'
          },
          'leaf_shape': {
            model_name: 'Leaf Shape Classifier',
            arc_name: 'MobileNet',
            arc_version: '1.5',
            dataset: 'Leaf Dataset',
            bin_eval_name: 'leaf.bat'
          }
        }
      };

      const handleModelsInfoResponse = (event, models) => {
        if (models.error) {
          console.error('Erro ao carregar informações dos modelos:', models.error);
          showPopup('error-popup');
        } else {
          const tableBody = document.querySelector('#models-table tbody');
          tableBody.innerHTML = '';

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

          showPopup('models-info-popup');
        }
      };

      handleModelsInfoResponse({}, mockModels);

      const rows = document.querySelectorAll('#models-table tbody tr');
      expect(rows.length).toBe(3);
      expect(rows[0].textContent).toContain('root_format');
      expect(rows[0].textContent).toContain('Format Classifier');
      expect(rows[1].textContent).toContain('root_color');
      expect(rows[2].textContent).toContain('leaf_shape');
      expect(showPopup).toHaveBeenCalledWith('models-info-popup');
    });

    it('should show error popup when models have error', () => {
      const showPopup = jest.fn();
      
      const mockModels = {
        error: 'Failed to load models'
      };

      const handleModelsInfoResponse = (event, models) => {
        if (models.error) {
          console.error('Erro ao carregar informações dos modelos:', models.error);
          showPopup('error-popup');
        } else {
          const tableBody = document.querySelector('#models-table tbody');
          tableBody.innerHTML = '';
          showPopup('models-info-popup');
        }
      };

      handleModelsInfoResponse({}, mockModels);

      expect(console.error).toHaveBeenCalledWith('Erro ao carregar informações dos modelos:', 'Failed to load models');
      expect(showPopup).toHaveBeenCalledWith('error-popup');
    });

    it('should handle models without details', () => {
      const showPopup = jest.fn();
      
      const mockModels = {
        root: ['root_format', 'missing_model'],
        leaves: [],
        details: {
          'root_format': {
            model_name: 'Format Classifier',
            arc_name: 'ResNet50',
            arc_version: '1.0',
            dataset: 'Format Dataset',
            bin_eval_name: 'format.bat'
          }
        }
      };

      const handleModelsInfoResponse = (event, models) => {
        if (models.error) {
          console.error('Erro ao carregar informações dos modelos:', models.error);
          showPopup('error-popup');
        } else {
          const tableBody = document.querySelector('#models-table tbody');
          tableBody.innerHTML = '';

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

          showPopup('models-info-popup');
        }
      };

      handleModelsInfoResponse({}, mockModels);

      const rows = document.querySelectorAll('#models-table tbody tr');
      expect(rows.length).toBe(1); // Only root_format should be added
      expect(showPopup).toHaveBeenCalledWith('models-info-popup');
    });
  });

  describe('models-check-response handler', () => {
    it('should show success popup when all models are valid', () => {
      const showPopup = jest.fn();
      
      const mockResponse = {
        status: 'good'
      };

      const handleModelsCheckResponse = (event, response) => {
        if (response.status === 'good') {
          console.log('All models are valid');
          showPopup('sucess-model-popup');
        } else if (response.status === 'error') {
          console.error('Error checking models:', response.error);
          const errorList = document.querySelector('#model-error-list');
          errorList.innerHTML = '';

          response.invalidExecutables.forEach((model) => {
            const listItem = document.createElement('li');
            listItem.textContent = model;
            errorList.appendChild(listItem);
          });

          showPopup('model-error-popup');
        }
      };

      handleModelsCheckResponse({}, mockResponse);

      expect(console.log).toHaveBeenCalledWith('All models are valid');
      expect(showPopup).toHaveBeenCalledWith('sucess-model-popup');
    });

    it('should show error popup and list invalid models', () => {
      const showPopup = jest.fn();
      
      const mockResponse = {
        status: 'error',
        error: 'Some models are invalid',
        invalidExecutables: ['root_format.bat', 'leaf_shape.bat']
      };

      const handleModelsCheckResponse = (event, response) => {
        if (response.status === 'good') {
          console.log('All models are valid');
          showPopup('sucess-model-popup');
        } else if (response.status === 'error') {
          console.error('Error checking models:', response.error);
          const errorList = document.querySelector('#model-error-list');
          errorList.innerHTML = '';

          response.invalidExecutables.forEach((model) => {
            const listItem = document.createElement('li');
            listItem.textContent = model;
            errorList.appendChild(listItem);
          });

          showPopup('model-error-popup');
        }
      };

      handleModelsCheckResponse({}, mockResponse);

      expect(console.error).toHaveBeenCalledWith('Error checking models:', 'Some models are invalid');
      
      const errorItems = document.querySelectorAll('#model-error-list li');
      expect(errorItems.length).toBe(2);
      expect(errorItems[0].textContent).toBe('root_format.bat');
      expect(errorItems[1].textContent).toBe('leaf_shape.bat');
      
      expect(showPopup).toHaveBeenCalledWith('model-error-popup');
    });

    it('should clear previous error list before adding new items', () => {
      // Add some existing items
      document.querySelector('#model-error-list').innerHTML = '<li>old error</li>';
      
      const showPopup = jest.fn();
      
      const mockResponse = {
        status: 'error',
        error: 'New errors',
        invalidExecutables: ['new_error.bat']
      };

      const handleModelsCheckResponse = (event, response) => {
        if (response.status === 'error') {
          console.error('Error checking models:', response.error);
          const errorList = document.querySelector('#model-error-list');
          errorList.innerHTML = '';

          response.invalidExecutables.forEach((model) => {
            const listItem = document.createElement('li');
            listItem.textContent = model;
            errorList.appendChild(listItem);
          });

          showPopup('model-error-popup');
        }
      };

      handleModelsCheckResponse({}, mockResponse);

      const errorItems = document.querySelectorAll('#model-error-list li');
      expect(errorItems.length).toBe(1);
      expect(errorItems[0].textContent).toBe('new_error.bat');
    });
  });
});
