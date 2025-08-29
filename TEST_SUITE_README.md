# Test Suite Documentation

This project has a comprehensive test suite covering unit tests, integration tests, and end-to-end tests.

## Test Structure

```
test/
├── jest.setup.ts          # Global test setup and mocks
├── jest-e2e.json         # E2E test configuration
├── test-utils.ts         # Test utility functions and mocks
└── app.e2e-spec.ts       # End-to-end integration tests

src/
├── modules/
│   ├── storage/
│   │   ├── services/
│   │   │   └── storage.service.spec.ts     # Storage service unit tests
│   │   └── controllers/
│   │       └── storage.controller.spec.ts  # Storage controller unit tests
│   ├── backup/
│   │   ├── services/
│   │   │   └── backup.service.spec.ts      # Backup service unit tests
│   │   └── controllers/
│   │       └── backup.controller.spec.ts   # Backup controller unit tests
│   └── cache/
│       └── services/
│           ├── cache.service.spec.ts       # Cache service unit tests
│           └── cache.factory.spec.ts       # Cache factory unit tests
├── core/
│   └── guards/
│       └── auth.guard.spec.ts              # Auth guard unit tests
└── app.controller.spec.ts                  # App controller unit tests
```

## Running Tests

### Run all tests

```bash
npm test
```

### Run unit tests only

```bash
npm run test:unit
```

### Run integration/e2e tests only

```bash
npm run test:e2e
```

### Run tests with coverage

```bash
npm run test:cov
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests for CI/CD

```bash
npm run test:ci
```

### Run all test suites

```bash
npm run test:all
```

## Test Coverage

The test suite covers:

### Storage Module

- ✅ File/directory creation, deletion, and renaming
- ✅ File compression (ZIP creation)
- ✅ File reading and logging operations
- ✅ Directory listing and tree structure
- ✅ Error handling for file system operations
- ✅ HTTP endpoints with proper status codes

### Backup Module

- ✅ Database backup creation (continuous and one-time)
- ✅ Backup restoration from files
- ✅ Scheduled backup jobs management
- ✅ Backup job listing and removal
- ✅ PostgreSQL command execution
- ✅ Error handling for backup operations

### Cache Module

- ✅ Redis and Memory cache providers
- ✅ Cache factory pattern implementation
- ✅ CRUD operations on cache
- ✅ Provider lifecycle management
- ✅ Configuration-based provider selection

### Security

- ✅ API authentication guard
- ✅ Token validation
- ✅ Bypass mode for development
- ✅ Unauthorized access handling

### Integration Tests

- ✅ Full API endpoint testing
- ✅ Request/response validation
- ✅ Authentication flow testing
- ✅ Error response handling
- ✅ Service integration testing

## Test Configuration

### Jest Configuration

- **Unit Tests**: Uses `jest.config.js` with TypeScript compilation
- **E2E Tests**: Uses `test/jest-e2e.json` configuration
- **Coverage**: Excludes interfaces, DTOs, and modules from coverage
- **Timeout**: 10s for unit tests, 30s for e2e tests

### Global Mocks

- File system operations are mocked for consistent testing
- Redis client is mocked to avoid external dependencies
- Child process execution is mocked for backup operations
- Logger outputs are suppressed during tests

### Environment Setup

- Test environment variables are automatically set
- Mock API keys are configured for authentication tests
- Database connections are mocked to avoid real database operations

## Best Practices Implemented

1. **Isolation**: Each test is isolated with proper mock reset
2. **Mocking**: External dependencies are comprehensively mocked
3. **Coverage**: Maintains high test coverage across all modules
4. **Error Testing**: Both success and failure paths are tested
5. **Integration**: E2E tests verify full request/response cycles
6. **Performance**: Tests run efficiently with proper timeouts
7. **CI/CD Ready**: Test suite is optimized for continuous integration

## Adding New Tests

When adding new features:

1. Create unit tests for services and controllers
2. Update integration tests for new endpoints
3. Mock external dependencies appropriately
4. Follow the established naming conventions
5. Ensure both success and error scenarios are covered
6. Update this documentation as needed

## Debugging Tests

To debug failing tests:

```bash
# Run specific test file
npm test -- storage.service.spec.ts

# Run tests in debug mode
npm run test:debug

# Run with verbose output
npm test -- --verbose

# Run single test case
npm test -- --testNamePattern="should create directory successfully"
```

## Coverage Reports

Coverage reports are generated in:

- `coverage/` - Unit test coverage
- `coverage-e2e/` - E2E test coverage

Open `coverage/lcov-report/index.html` in a browser to view detailed coverage reports.
