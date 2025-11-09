# @repo/storage

Unified storage abstraction layer for company websites monorepo.

## Philosophy (Linus-style)

1. **Good Taste** - All models use identical CRUD patterns. No special cases.
2. **Simplicity** - Relations via IDs, not complex nested objects.
3. **Ownership** - Parent owns children. Cascade deletes are explicit.
4. **Swap-ability** - Switch between Prisma and JSON+S3 with zero code changes.

## Features

- ✅ **Dual Implementations**: Prisma (PostgreSQL) and JSON (S3)
- ✅ **Unified Interface**: Same API regardless of backend
- ✅ **Type Safe**: Full TypeScript support with Zod validation
- ✅ **Cascade Deletes**: Automatic cleanup of related records
- ✅ **Concurrency Control**: Lock-based writes prevent data corruption
- ✅ **Query Support**: Filtering, ordering, pagination
- ✅ **Tested**: 13 tests covering all core functionality

## Installation

```bash
# From workspace root
npm install

# This package is private and used internally
```

## Usage

### Basic Setup

```typescript
import { createStorage } from '@repo/storage';

// Option 1: Prisma + PostgreSQL
const storage = createStorage({
  type: 'prisma',
  databaseUrl: process.env.DATABASE_URL,
});

// Option 2: JSON + S3
const storage = createStorage({
  type: 'json',
  s3: {
    bucket: 'my-bucket',
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

### CRUD Operations

All models follow the same pattern:

```typescript
// Create
const user = await storage.user.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed_password',
  role: 'ADMIN',
});

// Find many (with filtering and ordering)
const users = await storage.user.findMany({
  where: { role: 'ADMIN' },
  orderBy: { field: 'name', direction: 'asc' },
  skip: 0,
  take: 10,
});

// Find unique
const user = await storage.user.findUnique(userId);

// Update
const updated = await storage.user.update(userId, {
  name: 'Jane Doe',
});

// Delete
await storage.user.delete(userId);
```

### Available Collections

```typescript
storage.user           // User management
storage.carousel       // Homepage carousels
storage.project        // Construction projects
storage.projectImage   // Project images (child of project)
storage.document       // Documents
storage.contactSubmission  // Contact form submissions
storage.siteSettings   // Site configuration
storage.handbook       // User handbooks
storage.handbookFile   // Handbook files (child of handbook)
```

### Cascade Deletes

Parent deletions automatically clean up children:

```typescript
// Delete project -> automatically deletes all project images
await storage.project.delete(projectId);

// Delete handbook -> automatically deletes all handbook files
await storage.handbook.delete(handbookId);
```

### Reordering

Collections with `order` field support batch reordering:

```typescript
// Reorder carousels
await storage.carousel.reorder([id3, id1, id2]);
// Result: id3 has order=0, id1 has order=1, id2 has order=2
```

### Health Check

```typescript
const health = await storage.health();
// { status: 'ok' } or { status: 'error', message: '...' }
```

## Data Models

### Core Models

- **User**: System users with roles (ADMIN, EDITOR)
- **Carousel**: Homepage carousel items
- **Project**: Construction projects
- **ProjectImage**: Project photos (cascade delete)
- **Document**: Downloadable documents
- **ContactSubmission**: Contact form entries
- **SiteSettings**: Key-value configuration
- **Handbook**: User handbooks/manuals
- **HandbookFile**: Handbook attachments (cascade delete)

### Relationships

```
Project
  ├── ProjectImage[] (cascade delete)
  ├── Document[] (set null on delete)
  └── Handbook[] (set null on delete)

Handbook
  └── HandbookFile[] (cascade delete)
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

Current coverage: **13 tests passing**
- User CRUD operations
- Carousel operations with reordering
- Query options (filtering, ordering, pagination)
- Concurrency control
- Cascade deletes

## Architecture

### File Structure

```
packages/storage/
├── src/
│   ├── index.ts                    # Entry point
│   ├── factory.ts                  # Storage factory
│   ├── types.ts                    # Interfaces and schemas
│   ├── implementations/
│   │   ├── json-storage.ts         # JSON+S3 implementation
│   │   └── prisma-storage.ts       # Prisma wrapper
│   └── utils/
│       ├── s3.ts                   # S3 helper
│       ├── id.ts                   # ID generation
│       └── lock.ts                 # Concurrency control
├── __tests__/
│   └── json-storage.test.ts        # Test suite
├── package.json
├── vitest.config.ts
└── README.md
```

### Design Patterns

**CollectionManager (JSON)**
- Generic class handling all CRUD for any model
- One implementation, zero duplication
- Lock-based concurrency control

**Interface Adapter (Prisma)**
- Thin wrapper around Prisma Client
- Maps interface calls to Prisma methods
- Leverages Prisma's native cascade deletes

## Migration Guide

### Switching from Prisma to JSON

1. **Export existing data**:
   ```bash
   npm run export-data
   ```

2. **Update configuration**:
   ```typescript
   const storage = createStorage({
     type: 'json',  // Changed from 'prisma'
     s3: { /* ... */ }
   });
   ```

3. **No code changes needed** - the interface is identical!

### Switching from JSON to Prisma

1. **Import data to PostgreSQL**:
   ```bash
   npm run import-data
   ```

2. **Update configuration**:
   ```typescript
   const storage = createStorage({
     type: 'prisma',  // Changed from 'json'
     databaseUrl: process.env.DATABASE_URL
   });
   ```

3. **No code changes needed** - the interface is identical!

## Performance Considerations

### Prisma
- ✅ Fast queries with indexes
- ✅ Connection pooling
- ✅ Native cascade deletes
- ❌ Requires PostgreSQL instance
- ❌ Connection limits

### JSON+S3
- ✅ No database needed
- ✅ Unlimited "connections"
- ✅ Simple deployment
- ❌ Slower for large datasets
- ❌ Manual cascade deletes

## Future Improvements

- [ ] Add `findOrCreate` helper
- [ ] Batch operations for JSON
- [ ] Redis-based distributed locks
- [ ] Search/full-text search support
- [ ] Backup/restore utilities

## Philosophy Notes

From Linus Torvalds:

> "Bad programmers worry about the code. Good programmers worry about data structures and their relationships."

This package prioritizes:
1. **Simple, consistent data structures**
2. **Eliminating special cases** through interface design
3. **Pragmatic choices** (in-memory locks vs. distributed systems)
4. **Real-world usability** over theoretical perfection

---

**Last Updated**: November 8, 2025
**Status**: Production Ready ✅
**Test Coverage**: 13/13 passing
