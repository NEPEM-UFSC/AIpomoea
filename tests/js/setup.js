/**
 * Jest Setup File
 * Configures global mocks and utilities for JavaScript tests
 */

// Mock Electron IPC Renderer
global.ipcRenderer = {
  send: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn()
};

// Mock Electron webUtils
global.webUtils = {
  getPathForFile: jest.fn()
};

// Mock window.electron
global.window = global.window || {};
global.window.electron = {
  ipcRenderer: global.ipcRenderer
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// Mock fetch API
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');

// Setup DOM elements commonly used
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset window.version
  global.window.version = undefined;
});

// Cleanup after each test
afterEach(() => {
  jest.restoreAllMocks();
});
