# Quick Start: Testing Guide

## 1. One-Time Setup (5 minutes)

```bash
# Navigate to backend directory
cd /Users/aaronlin/Downloads/Projects/NYUxAptos/backend

# Install dependencies (if not already installed)
npm install

# Verify PostgreSQL is running
psql --version
# If not installed: brew install postgresql (macOS)

# Start PostgreSQL
brew services start postgresql  # macOS
# OR
sudo service postgresql start   # Linux

# Test database will be created automatically on first run
# Or create manually:
createdb nyu_aptos_test
```

## 2. Run Tests (Choose One)

```bash
# Option 1: Run all tests (recommended first time)
npm test

# Option 2: Run tests in watch mode (for active development)
npm run test:watch

# Option 3: Run only unit tests (fast, no database needed)
npm run test:unit

# Option 4: Run only integration tests (slower, uses database)
npm run test:integration

# Option 5: Generate coverage report
npm run test:coverage
```

## 3. Verify Success

You should see output like:

```
PASS  tests/unit/config/database.test.ts
PASS  tests/unit/config/aptos.test.ts
PASS  tests/integration/treasury.test.ts
PASS  tests/integration/proposals.test.ts

Test Suites: 4 passed, 4 total
Tests:       99 passed, 99 total
Time:        12.345 s

Coverage: 85% (exceeds threshold of 80%)
```

## 4. View Coverage Report

```bash
# Generate HTML coverage report
npm run test:coverage

# Open in browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

## 5. Common Issues & Solutions

### Issue: "Database connection refused"

```bash
# Solution: Start PostgreSQL
brew services start postgresql  # macOS
sudo service postgresql start   # Linux
```

### Issue: "Port 5432 already in use"

```bash
# Solution: PostgreSQL is already running, you're good!
# Or find what's using the port:
lsof -i :5432
```

### Issue: "Cannot find module"

```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Tests timeout

```bash
# Solution: Increase timeout (already set to 10s in config)
# Or your database is slow, try:
npm test -- --maxWorkers=1
```

## 6. Writing Your First Test

Create a new test file:

```typescript
// tests/unit/myfeature.test.ts
import { describe, it, expect } from '@jest/globals';

describe('My Feature', () => {
  it('should work correctly', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

Run your test:

```bash
npm test -- tests/unit/myfeature.test.ts
```

## 7. Before Committing Code

Always run these commands:

```bash
# Check code style
npm run lint

# Check TypeScript types
npm run typecheck

# Run all tests
npm test

# Verify build works
npm run build
```

## 8. Test File Structure

```
tests/
├── unit/               # Fast tests, no external dependencies
│   └── config/
│       ├── database.test.ts
│       └── aptos.test.ts
│
├── integration/        # Tests with database and API
│   ├── treasury.test.ts
│   ├── proposals.test.ts
│   └── governance.test.ts (add this)
│
├── fixtures/           # Test data
│   ├── users.fixture.ts
│   ├── treasury.fixture.ts
│   └── proposals.fixture.ts
│
├── mocks/              # Mock external services
│   ├── aptos.mock.ts
│   └── ipfs.mock.ts
│
└── helpers/            # Test utilities
    └── database.helper.ts
```

## 9. Using Test Fixtures

```typescript
import { testUsers, getAllTestUsers } from '../fixtures/users.fixture';
import { testProposals } from '../fixtures/proposals.fixture';
import { seedUsers, seedProposals, clearDatabase } from '../helpers/database.helper';

describe('My Test', () => {
  beforeEach(async () => {
    await clearDatabase();
    await seedUsers(getAllTestUsers());
    await seedProposals(testProposals);
  });

  it('should use test data', async () => {
    // Test with pre-seeded data
  });
});
```

## 10. CI/CD Status

Tests run automatically on:
- Every push to main, develop, or feature branches
- Every pull request
- You can see results in GitHub Actions tab

## Need Help?

1. **Detailed docs**: Read `tests/README.md`
2. **Examples**: Look at existing test files
3. **Jest docs**: https://jestjs.io/
4. **Supertest docs**: https://github.com/visionmedia/supertest

## Quick Command Reference

```bash
# Testing
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # Coverage report
npm run test:ci             # CI mode

# Code Quality
npm run lint                # Lint code
npm run typecheck           # Type check
npm run build               # Build project

# Development
npm run dev                 # Start dev server
npm run indexer             # Run indexer

# Database
psql -U postgres -d nyu_aptos_test  # Connect to test DB
```

## Test Coverage Goals

Target: **80%+ coverage**

Check coverage:
```bash
npm run test:coverage
open coverage/index.html
```

## Success Checklist

Before considering tests complete:

- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] No failing tests in CI
- [ ] Build succeeds
- [ ] Linter passes
- [ ] TypeScript compiles

## You're Ready! 🚀

Start testing with:
```bash
npm test
```

Everything should work out of the box. Happy testing!
