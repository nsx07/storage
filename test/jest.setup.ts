// Global test setup
beforeAll(async () => {
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';

  // Mock console.log in tests to reduce noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(async () => {
  // Cleanup after all tests
  jest.restoreAllMocks();
});

// Mock external dependencies globally
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    quit: jest.fn(),
  })),
}));

// Mock file system operations for consistent testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    rm: jest.fn(),
    rename: jest.fn(),
    appendFile: jest.fn(),
    readFile: jest.fn(),
  },
  readdirSync: jest.fn(),
  statSync: jest.fn(),
}));

// Mock child_process for backup tests
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));
