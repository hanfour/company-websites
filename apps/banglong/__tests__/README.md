# Banglong Testing Guide

This directory contains automated tests for the Banglong application.

## Test Structure

```
__tests__/
├── api/                   # API integration tests
│   ├── public-apis.test.ts    # Public endpoint tests
│   └── admin-apis.test.ts     # Admin endpoint tests (auth required)
├── setup.ts              # Test environment setup
└── README.md            # This file
```

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Generate coverage report
```bash
npm run test:coverage
```

### Run tests for specific file
```bash
npx vitest __tests__/api/public-apis.test.ts
```

## Test Philosophy (Linus-style)

1. **Test real behavior, not implementation**
   - We test HTTP endpoints, not internal functions
   - Integration tests > Unit tests
   - If it works in production, it should pass the test

2. **Keep tests simple**
   - No complex mocking unless absolutely necessary
   - Test against a running server
   - Clear test names that describe what they're testing

3. **Fast feedback**
   - Tests should run quickly
   - Parallel execution where possible
   - Fail fast on critical errors

## Writing New Tests

### API Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { apiTester } from '@repo/testing';

const api = apiTester({
  baseURL: 'http://localhost:3000',
});

describe('Your Feature', () => {
  it('should do something', async () => {
    const result = await api.get('/api/your-endpoint');

    expect(result.passed).toBe(true);
    api.assertStatus(result, 200);
  });
});
```

## CI/CD

Tests run automatically on:
- Every push to `main` or `develop`
- Every pull request

See `.github/workflows/test.yml` for configuration.

## Test Coverage

Aim for:
- **API endpoints**: 100% (all endpoints should have tests)
- **Business logic**: 80%+
- **UI components**: Not required (use E2E instead)

## Troubleshooting

### Tests fail locally but pass in CI
- Check environment variables in `.env.test.local`
- Ensure database is in correct state
- Check if dev server is running on correct port

### Slow tests
- Use `test.concurrent` for parallel execution
- Mock external API calls
- Use test database instead of production

### Flaky tests
- Add proper wait conditions
- Don't rely on timing
- Use deterministic test data

## Next Steps

- [ ] Add E2E tests with Playwright
- [ ] Add performance tests
- [ ] Add security tests (SQL injection, XSS)
- [ ] Increase coverage to 90%+
