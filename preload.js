const { contextBridge, ipcRenderer } = require('electron');
const { webUtils } = require('electron');

// Lista de canais IPC válidos para segurança
const validChannels = [
  'log-message',
  'request-version',
  'version-response',
  'upload-image',
  'upload-image-response',
  'upload-images', // Novo handler
  'run-factory',
  'factory-response',
  'receive_commands',
  'execute-pipeline', // Novo handler
  'python-message', // Novo canal de mensagens do Python
  'read-config',
  'config-response',
  'write-config',
  'write-config-response',
  'request-naming',
  'naming-response',
  'receive-custom',
  'check-models-info',
  'models-info-response',
  'open-db-file-dialog',
  'selected-db-file',
  'create-project',
  'get-projects',
  'import-files',
  'finalize-ingestion',
  'get-project-samples',
  'start-processing',
  'atualizacao-progresso',
  'export-project'
];

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Comunicação IPC genérica
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // NOVO: Suporte para ipcRenderer.invoke (comunicação assíncrona)
  invoke: (channel, data) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Canal inválido: ${channel}`));
  },

  on: (channel, callback) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },

  removeListener: (channel, callback) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },

  // Funções específicas para facilitar o uso
  logMessage: (level, message) => {
    ipcRenderer.send('log-message', level, message);
  },

  requestVersion: () => {
    ipcRenderer.send('request-version');
  },

  // LEGADO: Mantido para compatibilidade
  uploadImages: (filePaths) => {
    ipcRenderer.send('upload-image', filePaths);
  },

  // Utilitários do Electron
  getPathForFile: (file) => {
    return webUtils.getPathForFile(file);
  },

  // DEBUG & DEV TOOLS
  isDebug: ipcRenderer.sendSync('is-debug'),
  getAvailableViews: () => [
    'index.html',
    'projects.html',
    'new_project.html',
    'import_project.html',
    'processing_grid.html',
    'project_summary.html',
    'settings.html',
    'help.html',
    'about.html',
    'update.html',
    'first_time.html'
  ]
});

// Para compatibilidade com código legado, expor ipcRenderer de forma controlada
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  invoke: (channel, data) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Canal inválido: ${channel}`));
  },

  on: (channel, callback) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },

  removeListener: (channel, callback) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});

// Expor webUtils para manipulação de arquivos
contextBridge.exposeInMainWorld('webUtils', {
  getPathForFile: (file) => {
    return webUtils.getPathForFile(file);
  }
});

console.log('🔗 Preload script loaded successfully (Refactored for execute-pipeline)');

window.addEventListener('DOMContentLoaded', () => {
  // Verificamos o isDebug via IPC Sync exposto
  if (ipcRenderer.sendSync('is-debug')) {
    const script = document.createElement('script');
    script.src = '../static/js/dev-menu.js';
    document.body.appendChild(script);
  }
});