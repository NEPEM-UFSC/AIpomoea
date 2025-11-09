/**
 * Tests for commands-check.js
 * Operation blocking based on available models
 */

describe('commands-check.js - Commands Check', () => {
  beforeEach(() => {
    // Setup DOM elements
    document.body.innerHTML = `
      <div class="operation-item">
        <input type="checkbox" id="root-format" />
      </div>
      <div class="operation-item">
        <input type="checkbox" id="root-color" />
      </div>
      <div class="operation-item">
        <input type="checkbox" id="leaf-shape" />
      </div>
      <div class="operation-item">
        <input type="checkbox" id="csv" />
      </div>
      <div class="operation-item">
        <input type="checkbox" id="json" />
      </div>
      <div class="operation-item">
        <input type="checkbox" id="connected-database" />
      </div>
      <div class="operation-item">
        <input type="checkbox" id="unavailable-model" />
      </div>
    `;
  });

  describe('checkAndBlockOperations', () => {
    it('should disable operations not in models.json', async () => {
      const mockModelsData = {
        root: ['root_format', 'root_color'],
        leaves: ['leaf_shape']
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockModelsData
      });

      const checkAndBlockOperations = () => {
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
      };

      checkAndBlockOperations();

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith('../models.json');
      
      // Check that available operations are not disabled
      expect(document.getElementById('root-format').disabled).toBeFalsy();
      expect(document.getElementById('root-color').disabled).toBeFalsy();
      expect(document.getElementById('leaf-shape').disabled).toBeFalsy();
      
      // Check that export operations are never disabled
      expect(document.getElementById('csv').disabled).toBeFalsy();
      expect(document.getElementById('json').disabled).toBeFalsy();
      expect(document.getElementById('connected-database').disabled).toBeFalsy();
      
      // Check that unavailable operation is disabled
      expect(document.getElementById('unavailable-model').disabled).toBe(true);
    });

    it('should handle ID to operation name conversion with hyphens', async () => {
      document.body.innerHTML = `
        <div class="operation-item">
          <input type="checkbox" id="root-format-test" />
        </div>
      `;

      const mockModelsData = {
        root: ['root_format_test'],
        leaves: []
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockModelsData
      });

      const checkAndBlockOperations = () => {
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
      };

      checkAndBlockOperations();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('root-format-test').disabled).toBeFalsy();
    });

    it('should never disable export operations (csv, json, connected_database)', async () => {
      const mockModelsData = {
        root: [],
        leaves: []
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockModelsData
      });

      const checkAndBlockOperations = () => {
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
      };

      checkAndBlockOperations();

      await new Promise(resolve => setTimeout(resolve, 0));

      // Export operations should never be disabled
      expect(document.getElementById('csv').disabled).toBeFalsy();
      expect(document.getElementById('json').disabled).toBeFalsy();
      expect(document.getElementById('connected-database').disabled).toBeFalsy();
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const checkAndBlockOperations = () => {
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
      };

      checkAndBlockOperations();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalledWith('Erro ao carregar models.json:', expect.any(Error));
    });

    it('should enable operations that are in root array', async () => {
      const mockModelsData = {
        root: ['root_format'],
        leaves: []
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockModelsData
      });

      const checkAndBlockOperations = () => {
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
      };

      checkAndBlockOperations();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('root-format').disabled).toBeFalsy();
      expect(document.getElementById('root-color').disabled).toBe(true);
    });

    it('should enable operations that are in leaves array', async () => {
      const mockModelsData = {
        root: [],
        leaves: ['leaf_shape']
      };

      global.fetch.mockResolvedValueOnce({
        json: async () => mockModelsData
      });

      const checkAndBlockOperations = () => {
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
      };

      checkAndBlockOperations();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('leaf-shape').disabled).toBeFalsy();
      expect(document.getElementById('root-format').disabled).toBe(true);
    });
  });
});
