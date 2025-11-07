# Testing Quick Start Guide

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup test database:**
   ```bash
   # Create test database
   createdb nyu_aptos_test

   # Run migrations (if you have them)
   npm run migrate:test
   ```

3. **Set environment variables:**
   ```bash
   # Copy .env.example to .env.test
   cp .env.example .env.test

   # Update test-specific values
   DB_NAME=nyu_aptos_test
   NODE_ENV=test
   JWT_SECRET=test-secret-key
   JWT_REFRESH_SECRET=test-refresh-secret-key
   ```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test validators.test.ts
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run unit tests only
```bash
npm run test:unit
```

### Run integration tests only
```bash
npm run test:integration
```

### Run with coverage
```bash
npm run test:coverage
```

### Run in CI mode
```bash
npm run test:ci
```

## Test Structure

```
tests/
├── unit/              # Unit tests (isolated, fast)
├── integration/       # Integration tests (with DB, slower)
├── helpers/           # Test utilities
├── mocks/            # Mock implementations
└── fixtures/         # Test data
```

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { functionToTest } from '../../../src/module';

describe('Module Name', () => {
  describe('functionToTest', () => {
    it('should behave as expected', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      expect(functionToTest('')).toBe('default');
    });
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import router from '../../src/routes/myroute';
import { clearDatabase, seedUsers } from '../helpers/database.helper';
import { expectSuccess, TEST_ADDRESSES } from '../helpers/api.helper';

describe('My Route Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/myroute', router);
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should test endpoint', async () => {
    const response = await request(app)
      .get('/api/myroute')
      .expect(200);

    const data = expectSuccess(response);
    expect(data.field).toBeDefined();
  });
});
```

## Common Test Helpers

### API Testing
```typescript
import { createApiHelper, expectSuccess, TEST_ADDRESSES, TEST_ROLES } from './helpers/api.helper';

const api = createApiHelper(app);
api.authenticate(TEST_ADDRESSES.ADMIN, TEST_ROLES.ADMIN);

const response = await api.get('/api/endpoint');
const data = expectSuccess(response);
```

### Mock Data
```typescript
import { generateUser, generateProposal } from './helpers/mock-data.helper';

const user = generateUser({ role: 'admin' });
const proposals = generateProposals(10, { status: 1 });
```

### Database Seeding
```typescript
import { seedUsers, seedProposals, clearDatabase } from './helpers/database.helper';

await clearDatabase();
await seedUsers([testUser]);
await seedProposals([testProposal]);
```

## Debugging Tests

### Run single test
```bash
npm test -- -t "test name"
```

### Show console output
```bash
npm test -- --verbose
```

### Run with debugger
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Reports

After running `npm run test:coverage`, open:
```bash
open coverage/index.html
```

## Troubleshooting

### Tests fail with database errors
- Ensure test database exists
- Run migrations on test database
- Check DATABASE_URL in .env.test

### Tests timeout
- Increase timeout in jest.config.js
- Check for hanging promises
- Ensure database connections close

### Tests are flaky
- Check for test interdependence
- Ensure clearDatabase() in beforeEach
- Reset mocks between tests

## Best Practices

1. **Test isolation:** Each test should be independent
2. **Clear names:** Test names should explain what they test
3. **AAA pattern:** Arrange, Act, Assert
4. **Mock external deps:** Don't call real APIs/blockchain
5. **Fast tests:** Keep unit tests under 100ms
6. **Coverage:** Aim for 80%+ but focus on meaningful tests

## CI/CD Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Every pull request (GitHub Actions)
- Before deployment

Commits blocked if:
- Tests fail
- Coverage drops below threshold
- Linting errors exist

## Resources

- **Test Suite Summary:** `TEST_SUITE_SUMMARY.md`
- **Jest Docs:** https://jestjs.io/docs/getting-started
- **Supertest Docs:** https://github.com/visionmedia/supertest
- **TDD Guide:** https://martinfowler.com/bliki/TestDrivenDevelopment.html

## Status

**Completed:** 8/12 test files (66%)
**Coverage Target:** 80%+
**Next Steps:** Implement integration test templates

See `TEST_SUITE_SUMMARY.md` for detailed documentation.
