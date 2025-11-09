module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/js/**/*.test.js'],
  collectCoverageFrom: [
    'static/js/**/*.js',
    '!static/js/**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage/js',
  coverageReporters: ['text', 'html', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/tests/js/setup.js'],
  transform: {},
  moduleFileExtensions: ['js'],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
