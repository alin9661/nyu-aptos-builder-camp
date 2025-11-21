# Backend Testing Suite

Comprehensive automated testing suite for the NYU Aptos Builder Camp backend, following TDD (Test-Driven Development) best practices.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

This testing suite provides comprehensive coverage for all backend functionality including:

- **Unit Tests**: Test individual functions and modules in isolation
- **Integration Tests**: Test API endpoints with real database interactions
- **Mock Services**: Simulate external dependencies (Aptos blockchain, IPFS)
- **Fixtures**: Predefined test data for consistent testing
- **CI/CD**: Automated testing on every push and pull request

### Technology Stack

- **Jest**: Testing framework with TypeScript support
- **Supertest**: HTTP assertion library for API testing
- **ts-jest**: TypeScript preprocessor for Jest
- **PostgreSQL**: Test database for integration tests

## Test Structure

```
backend/tests/
├── setup.ts                    # Jest setup configuration
├── globalSetup.ts              # One-time setup before all tests
├── globalTeardown.ts           # Cleanup after all tests
├── README.md                   # This file
│
├── unit/                       # Unit tests
│   ├── config/
│   │   ├── database.test.ts    # Database configuration tests
│   │   └── aptos.test.ts       # Aptos helper function tests
│   ├── services/
│   │   └── ipfs.test.ts        # IPFS service tests
│   └── utils/
│       └── validators.test.ts  # Validation utility tests
│
├── integration/                # Integration tests
│   ├── treasury.test.ts        # Treasury API endpoint tests
│   ├── governance.test.ts      # Governance API endpoint tests
│   └── proposals.test.ts       # Proposals API endpoint tests
│
├── fixtures/                   # Test data
│   ├── users.fixture.ts        # User test data
│   ├── treasury.fixture.ts     # Treasury test data
│   ├── governance.fixture.ts   # Governance test data
│   └── proposals.fixture.ts    # Proposals test data
│
├── mocks/                      # Mock implementations
│   ├── aptos.mock.ts           # Aptos SDK mocks
│   └── ipfs.mock.ts            # IPFS client mocks
│
└── helpers/                    # Test helper utilities
    └── database.helper.ts      # Database seeding and cleanup
```

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Set up test database:
   ```bash
   # Create test database (PostgreSQL must be running)
   createdb nyu_aptos_test
   ```

3. Configure environment variables (optional):
   ```bash
   # Create .env.test file
   cp .env.example .env.test

   # Edit test-specific variables
   TEST_DB_HOST=localhost
   TEST_DB_PORT=5432
   TEST_DB_NAME=nyu_aptos_test
   TEST_DB_USER=postgres
   TEST_DB_PASSWORD=postgres
   ```

### Test Commands

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage

# Run tests for CI (with additional flags)
npm run test:ci
```

### Test Output

```bash
# Example successful test run
PASS  tests/unit/config/database.test.ts
PASS  tests/unit/config/aptos.test.ts
PASS  tests/integration/treasury.test.ts
PASS  tests/integration/proposals.test.ts

Test Suites: 4 passed, 4 total
Tests:       87 passed, 87 total
Snapshots:   0 total
Time:        12.345 s

-------------------------|---------|----------|---------|---------|
File                     | % Stmts | % Branch | % Funcs | % Lines |
-------------------------|---------|----------|---------|---------|
All files                |   85.32 |    82.45 |   88.67 |   85.89 |
 config/                 |   92.15 |    89.32 |   95.45 |   92.78 |
  aptos.ts               |   95.67 |    92.34 |   98.12 |   96.23 |
  database.ts            |   88.45 |    86.12 |   92.67 |   89.12 |
 routes/                 |   83.45 |    79.23 |   86.78 |   84.12 |
  treasury.ts            |   87.23 |    82.45 |   89.34 |   88.01 |
  proposals.ts           |   81.34 |    78.12 |   85.23 |   82.45 |
  governance.ts          |   82.12 |    77.89 |   84.56 |   82.78 |
-------------------------|---------|----------|---------|---------|
```

## Writing Tests

### TDD Workflow

Follow the Red-Green-Refactor cycle:

1. **RED**: Write a failing test first
   ```typescript
   it('should format coin amount correctly', () => {
     const amount = BigInt(100000000);
     const formatted = formatCoinAmount(amount);
     expect(formatted).toBe('1');
   });
   ```

2. **GREEN**: Write minimal code to make it pass
   ```typescript
   export const formatCoinAmount = (amount: bigint): string => {
     const divisor = BigInt(10 ** 8);
     return (amount / divisor).toString();
   };
   ```

3. **REFACTOR**: Improve the code while keeping tests green
   ```typescript
   export const formatCoinAmount = (amount: bigint, decimals = 8): string => {
     const divisor = BigInt(10 ** decimals);
     const integerPart = amount / divisor;
     const fractionalPart = amount % divisor;

     if (fractionalPart === BigInt(0)) {
       return integerPart.toString();
     }

     const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
     return `${integerPart}.${fractionalStr.replace(/0+$/, '')}`;
   };
   ```

### Unit Test Example

```typescript
import { describe, it, expect } from '@jest/globals';
import { formatCoinAmount } from '../../../src/config/aptos';

describe('formatCoinAmount', () => {
  it('should format integer amounts correctly', () => {
    // Arrange
    const amount = BigInt(100000000);

    // Act
    const formatted = formatCoinAmount(amount);

    // Assert
    expect(formatted).toBe('1');
  });

  it('should format decimal amounts correctly', () => {
    const amount = BigInt(123456789);
    const formatted = formatCoinAmount(amount);
    expect(formatted).toBe('1.23456789');
  });

  it('should handle zero correctly', () => {
    const amount = BigInt(0);
    const formatted = formatCoinAmount(amount);
    expect(formatted).toBe('0');
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/index';
import { clearDatabase, seedUsers } from '../helpers/database.helper';

describe('GET /api/treasury/balance', () => {
  beforeEach(async () => {
    await clearDatabase();
    await seedUsers(getAllTestUsers());
  });

  it('should return current treasury balance', async () => {
    // Act
    const response = await request(app)
      .get('/api/treasury/balance')
      .expect('Content-Type', /json/)
      .expect(200);

    // Assert
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('balance');
    expect(response.body.data).toHaveProperty('balanceFormatted');
  });

  it('should handle blockchain errors gracefully', async () => {
    // Arrange - mock blockchain error
    const aptos = require('../../src/config/aptos').aptos;
    aptos.view.mockRejectedValueOnce(new Error('Network error'));

    // Act
    const response = await request(app)
      .get('/api/treasury/balance')
      .expect(500);

    // Assert
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Failed to fetch treasury balance');
  });
});
```

### Using Fixtures

```typescript
import { testUsers, getAllTestUsers } from '../fixtures/users.fixture';
import { testProposals } from '../fixtures/proposals.fixture';
import { seedUsers, seedProposals } from '../helpers/database.helper';

describe('Proposals API', () => {
  beforeEach(async () => {
    await clearDatabase();
    await seedUsers(getAllTestUsers());
    await seedProposals(testProposals);
  });

  it('should list all proposals', async () => {
    const response = await request(app)
      .get('/api/proposals')
      .expect(200);

    expect(response.body.data.proposals.length).toBe(testProposals.length);
  });
});
```

### Using Mocks

```typescript
import { createMockAptosClient, createMockTransaction } from '../mocks/aptos.mock';

describe('Treasury Service', () => {
  it('should wait for transaction confirmation', async () => {
    // Arrange
    const mockAptos = createMockAptosClient();
    mockAptos.waitForTransaction.mockResolvedValue(
      createMockTransaction({ success: true })
    );

    // Act
    const result = await treasuryService.submitReimbursement('0x1234');

    // Assert
    expect(mockAptos.waitForTransaction).toHaveBeenCalledWith({
      transactionHash: '0x1234'
    });
    expect(result.success).toBe(true);
  });
});
```

## Test Coverage

### Coverage Goals

The testing suite aims for **80%+ code coverage** across all metrics:

- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

### Viewing Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/index.html

# Or on Linux
xdg-open coverage/index.html
```

### Coverage Configuration

Coverage thresholds are configured in `jest.config.js`:

```javascript
coverageThresholds: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### What to Test

**Always Test:**
- All API endpoints (happy paths and error cases)
- Business logic and calculations
- Data validation and sanitization
- Error handling and edge cases
- Authentication and authorization
- Database operations

**Don't Need to Test:**
- Third-party library internals
- TypeScript type definitions
- Simple getters/setters
- Configuration files

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Every push to `main`, `develop`, or `feature/**` branches
- Every pull request to `main` or `develop`
- Changes to backend code or test configuration

### Workflow Steps

1. **Checkout**: Get latest code
2. **Setup**: Install Node.js and dependencies
3. **Lint**: Check code style
4. **Type Check**: Verify TypeScript types
5. **Unit Tests**: Run unit tests
6. **Integration Tests**: Run integration tests with PostgreSQL
7. **Coverage**: Generate and upload coverage reports
8. **Build**: Verify production build works

### Local CI Simulation

```bash
# Run the same checks as CI
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

## Best Practices

### Test Organization

1. **One test file per source file**: `src/routes/treasury.ts` → `tests/integration/treasury.test.ts`
2. **Group related tests**: Use `describe` blocks for logical grouping
3. **Clear test names**: Describe what is being tested and expected outcome
   ```typescript
   // Good
   it('should return 404 when proposal does not exist', async () => {})

   // Bad
   it('test proposal', async () => {})
   ```

### Test Independence

Each test should be independent and not rely on other tests:

```typescript
// Good - each test cleans up and sets up its own data
describe('Proposals', () => {
  beforeEach(async () => {
    await clearDatabase();
    await seedUsers(getAllTestUsers());
  });

  it('should create proposal', async () => {
    // Test code
  });

  it('should list proposals', async () => {
    await seedProposals(testProposals);
    // Test code
  });
});

// Bad - tests depend on execution order
describe('Proposals', () => {
  it('should create proposal', async () => {
    // Creates proposal
  });

  it('should list proposals', async () => {
    // Expects proposal from previous test
  });
});
```

### Arrange-Act-Assert Pattern

Structure tests with clear sections:

```typescript
it('should format coin amount correctly', () => {
  // Arrange - set up test data
  const amount = BigInt(100000000);

  // Act - perform the action
  const formatted = formatCoinAmount(amount);

  // Assert - verify the result
  expect(formatted).toBe('1');
});
```

### Error Testing

Always test both success and failure cases:

```typescript
describe('API Endpoint', () => {
  it('should succeed with valid data', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ valid: 'data' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  it('should fail with invalid data', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ invalid: 'data' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it('should handle server errors gracefully', async () => {
    // Mock database error
    mockDatabase.query.mockRejectedValue(new Error('DB Error'));

    const response = await request(app)
      .post('/api/endpoint')
      .send({ valid: 'data' })
      .expect(500);

    expect(response.body.success).toBe(false);
  });
});
```

### Mock Management

Reset mocks between tests to avoid test pollution:

```typescript
import { jest } from '@jest/globals';
import { createMockAptosClient } from '../mocks/aptos.mock';

describe('Service Tests', () => {
  let mockAptos: any;

  beforeEach(() => {
    mockAptos = createMockAptosClient();
    // Reset all mock call history
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original implementations
    jest.restoreAllMocks();
  });
});
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Database connection refused"
```bash
# Solution: Ensure PostgreSQL is running
brew services start postgresql  # macOS
sudo service postgresql start   # Linux

# Verify connection
psql -U postgres -d nyu_aptos_test
```

**Issue**: Tests timeout
```bash
# Solution: Increase timeout in jest.config.js
testTimeout: 30000  // 30 seconds
```

**Issue**: "Port already in use" error
```bash
# Solution: Kill process using the port
lsof -ti:3001 | xargs kill -9
```

**Issue**: Test database not created
```bash
# Solution: Run global setup manually
npm run test -- --runInBand globalSetup.ts
```

**Issue**: Stale mocks affecting tests
```bash
# Solution: Clear Jest cache
npx jest --clearCache
```

### Debug Mode

Run tests with additional debugging:

```bash
# Run specific test file
npm test -- tests/integration/treasury.test.ts

# Run with debugging output
DEBUG=* npm test

# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Getting Help

- Check the [Jest documentation](https://jestjs.io/)
- Review [Supertest documentation](https://github.com/visionmedia/supertest)
- Ask the team in #backend-testing channel
- Create an issue in the repository

## Contributing

When adding new features:

1. **Write tests first** (TDD approach)
2. **Ensure tests pass** before committing
3. **Maintain coverage** above 80%
4. **Update documentation** if needed
5. **Review test output** in CI before merging

## License

MIT License - See LICENSE file for details
