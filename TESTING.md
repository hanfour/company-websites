# Testing Guide for Company Websites Monorepo

## 📊 Current Test Coverage

### Banglong Application
- **19 tests** - All passing ✅
- **Test files**: 2
  - `__tests__/api/public-apis.test.ts` - 10 tests
  - `__tests__/api/admin-apis.test.ts` - 9 tests
- **Execution time**: < 2.5 seconds
- **Coverage**: API endpoints (public & admin)

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests in banglong
cd apps/banglong
npm test

# Watch mode (auto-rerun on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Using Turbo (from root)

```bash
# Run tests for banglong only
turbo run test --filter=@repo/banglong

# Run tests for all apps
turbo run test
```

## 📁 Test Structure

```
packages/testing/          # Shared testing utilities
├── src/
│   ├── api-tester.ts     # API testing helper
│   ├── test-server.ts    # Server lifecycle management
│   └── types.ts          # TypeScript definitions

apps/banglong/__tests__/   # Banglong test suites
├── api/
│   ├── public-apis.test.ts    # Public endpoints
│   └── admin-apis.test.ts     # Protected admin endpoints
├── setup.ts               # Test environment setup
└── README.md             # Detailed testing guide
```

## ✅ What's Tested

### Public APIs
- ✅ GET /api/carousel - Returns carousel items
- ✅ GET /api/handbooks - Returns handbooks list
- ✅ GET /api/projects - Returns projects list
- ✅ POST /api/contacts - Form validation & honeypot
- ✅ Error handling (404s, malformed requests)

### Admin APIs (Authentication Required)
- ✅ GET /api/handbooks/admin - Protected
- ✅ GET /api/carousel/admin - Protected
- ✅ GET /api/projects/admin - Protected
- ✅ GET /api/contacts/admin - Protected
- ✅ PUT/DELETE operations - Protected

## 🛠️ Writing New Tests

### Example: Testing a New API Endpoint

```typescript
import { describe, it, expect } from 'vitest';
import { apiTester } from '@repo/testing';

const api = apiTester({
  baseURL: 'http://localhost:3000',
});

describe('My New Feature', () => {
  it('should work correctly', async () => {
    const result = await api.get('/api/my-endpoint');

    expect(result.passed).toBe(true);
    api.assertStatus(result, 200);
  });
});
```

## 🔧 Configuration

### Environment Variables
Tests use `.env.test.local` if present, falling back to `.env`.

### PostCSS Handling
The PostCSS configuration automatically disables Tailwind CSS processing in test mode to avoid Vite conflicts:

```javascript
// postcss.config.mjs
const config = process.env.NODE_ENV === 'test'
  ? { plugins: [] }
  : { plugins: ["@tailwindcss/postcss"] };
```

## 🤖 CI/CD Integration

Tests run automatically via GitHub Actions on:
- Push to `main` or `develop`
- Pull requests

See `.github/workflows/test.yml` for configuration.

## 📊 Test Philosophy (Linus-style Pragmatism)

1. **Integration over Unit**
   - Test real HTTP endpoints
   - No complex mocking
   - If it works in production, it passes the test

2. **Fast Feedback**
   - All tests run in < 3 seconds
   - Fail fast on critical errors
   - Parallel execution where possible

3. **Maintainability**
   - Clear, descriptive test names
   - Simple assertions
   - Minimal setup/teardown

## 🐛 Troubleshooting

### Tests fail with PostCSS errors
Make sure `NODE_ENV=test` is set. The npm scripts handle this automatically.

### Connection refused errors
Ensure the dev server is running on port 3000:
```bash
npm run dev
```

### Slow tests
- Check network latency to database
- Consider using test database instead of prod
- Review timeout settings (default: 15s)

## 📈 Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Increase coverage to 90%+
- [ ] Add performance benchmarks
- [ ] Add security tests (SQL injection, XSS)
- [ ] Visual regression testing

## 🎯 Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| API Endpoints | 90% | 100% |
| Business Logic | 0% | 80% |
| UI Components | 0% | 60% |

---

**Last Updated**: November 8, 2025
**Maintainer**: @hanfourhuang
