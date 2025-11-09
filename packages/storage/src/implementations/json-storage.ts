/**
 * JSON Storage Implementation
 *
 * Data Model:
 * - Each collection stored as a separate JSON file in S3
 * - File structure: { items: Record<ID, Model>, metadata: { count, lastUpdated } }
 * - Relations managed through IDs (foreign keys)
 * - Cascade deletes implemented manually
 *
 * Philosophy:
 * - Simple data structure eliminates complexity
 * - Lock-based concurrency control
 * - Fail fast on errors
 */

import type {
  IStorage,
  User,
  UserCreate,
  UserUpdate,
  Carousel,
  CarouselCreate,
  CarouselUpdate,
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectImage,
  ProjectImageCreate,
  ProjectImageUpdate,
  Document,
  DocumentCreate,
  DocumentUpdate,
  ContactSubmission,
  ContactSubmissionCreate,
  ContactSubmissionUpdate,
  SiteSettings,
  SiteSettingsCreate,
  SiteSettingsUpdate,
  Handbook,
  HandbookCreate,
  HandbookUpdate,
  HandbookFile,
  HandbookFileCreate,
  HandbookFileUpdate,
  QueryOptions,
  ID,
} from '../types';

import {
  NotFoundError,
  ConflictError,
  ValidationError,
  UserSchema,
  CarouselSchema,
  ProjectSchema,
  ProjectImageSchema,
  DocumentSchema,
  ContactSubmissionSchema,
  SiteSettingsSchema,
  HandbookSchema,
  HandbookFileSchema,
} from '../types';

import { S3Helper, S3Config } from '../utils/s3';
import { generateId } from '../utils/id';
import { globalLock } from '../utils/lock';

// ============================================================================
// JSON File Structure
// ============================================================================

interface Collection<T> {
  items: Record<ID, T>;
  metadata: {
    count: number;
    lastUpdated: string;
  };
}

// ============================================================================
// Base Collection Manager - Template for all models
// ============================================================================

/**
 * Generic Collection Manager
 *
 * This is the "good taste" part - one template handles all models.
 * No special cases, no duplication.
 */
class CollectionManager<
  T extends { id: string; createdAt: Date; updatedAt: Date },
  TCreate extends Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  TUpdate extends Partial<TCreate>
> {
  constructor(
    private s3: S3Helper,
    private collectionKey: string,
    private schema: any
  ) {}

  /**
   * Load entire collection from S3
   */
  private async load(): Promise<Collection<T>> {
    const data = await this.s3.readJSON<Collection<T>>(this.collectionKey);

    if (!data) {
      // Initialize empty collection
      return {
        items: {},
        metadata: {
          count: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    // Convert date strings back to Date objects
    for (const item of Object.values(data.items)) {
      if (item.createdAt && typeof item.createdAt === 'string') {
        (item.createdAt as any) = new Date(item.createdAt);
      }
      if (item.updatedAt && typeof item.updatedAt === 'string') {
        (item.updatedAt as any) = new Date(item.updatedAt);
      }
    }

    return data;
  }

  /**
   * Save entire collection to S3
   */
  private async save(collection: Collection<T>): Promise<void> {
    collection.metadata.lastUpdated = new Date().toISOString();
    await this.s3.writeJSON(this.collectionKey, collection);
  }

  /**
   * Create new item
   */
  async create(data: TCreate): Promise<T> {
    return globalLock.acquire(this.collectionKey, async () => {
      const collection = await this.load();

      const now = new Date();
      const item = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      } as T;

      // Validate with Zod
      const validated = this.schema.parse(item);

      collection.items[validated.id] = validated;
      collection.metadata.count++;

      await this.save(collection);

      return validated;
    });
  }

  /**
   * Find many items
   */
  async findMany(options?: QueryOptions<T>): Promise<T[]> {
    const collection = await this.load();
    let items = Object.values(collection.items);

    // Apply where filter
    if (options?.where) {
      items = items.filter((item) => {
        return Object.entries(options.where!).every(([key, value]) => {
          return (item as any)[key] === value;
        });
      });
    }

    // Apply orderBy
    if (options?.orderBy) {
      const { field, direction } = options.orderBy;
      items.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    if (options?.skip !== undefined) {
      items = items.slice(options.skip);
    }
    if (options?.take !== undefined) {
      items = items.slice(0, options.take);
    }

    return items;
  }

  /**
   * Find unique item by ID
   */
  async findUnique(id: ID): Promise<T | null> {
    const collection = await this.load();
    return collection.items[id] || null;
  }

  /**
   * Update item
   */
  async update(id: ID, data: TUpdate): Promise<T> {
    return globalLock.acquire(this.collectionKey, async () => {
      const collection = await this.load();

      const item = collection.items[id];
      if (!item) {
        throw new NotFoundError(this.collectionKey, id);
      }

      const updated = {
        ...item,
        ...data,
        updatedAt: new Date(),
      };

      // Validate with Zod
      const validated = this.schema.parse(updated);

      collection.items[id] = validated;

      await this.save(collection);

      return validated;
    });
  }

  /**
   * Delete item
   */
  async delete(id: ID): Promise<void> {
    return globalLock.acquire(this.collectionKey, async () => {
      const collection = await this.load();

      if (!collection.items[id]) {
        throw new NotFoundError(this.collectionKey, id);
      }

      delete collection.items[id];
      collection.metadata.count--;

      await this.save(collection);
    });
  }

  /**
   * Delete multiple items (for cascade deletes)
   */
  async deleteMany(ids: ID[]): Promise<void> {
    return globalLock.acquire(this.collectionKey, async () => {
      const collection = await this.load();

      let deletedCount = 0;
      for (const id of ids) {
        if (collection.items[id]) {
          delete collection.items[id];
          deletedCount++;
        }
      }

      collection.metadata.count -= deletedCount;

      await this.save(collection);
    });
  }

  /**
   * Batch update order
   */
  async reorder(ids: ID[]): Promise<void> {
    return globalLock.acquire(this.collectionKey, async () => {
      const collection = await this.load();

      ids.forEach((id, index) => {
        if (collection.items[id]) {
          (collection.items[id] as any).order = index;
          (collection.items[id] as any).updatedAt = new Date();
        }
      });

      await this.save(collection);
    });
  }
}

// ============================================================================
// JSON Storage Implementation
// ============================================================================

export class JSONStorage implements IStorage {
  private s3: S3Helper;

  // Collection managers
  private users: CollectionManager<User, UserCreate, UserUpdate>;
  private carousels: CollectionManager<Carousel, CarouselCreate, CarouselUpdate>;
  private projects: CollectionManager<Project, ProjectCreate, ProjectUpdate>;
  private projectImages: CollectionManager<ProjectImage, ProjectImageCreate, ProjectImageUpdate>;
  private documents: CollectionManager<Document, DocumentCreate, DocumentUpdate>;
  private contactSubmissions: CollectionManager<
    ContactSubmission,
    ContactSubmissionCreate,
    ContactSubmissionUpdate
  >;
  private siteSettingsCollection: CollectionManager<
    SiteSettings,
    SiteSettingsCreate,
    SiteSettingsUpdate
  >;
  private handbooks: CollectionManager<Handbook, HandbookCreate, HandbookUpdate>;
  private handbookFiles: CollectionManager<HandbookFile, HandbookFileCreate, HandbookFileUpdate>;

  constructor(s3Config: S3Config, _concurrency?: any) {
    this.s3 = new S3Helper(s3Config);

    // Initialize all collection managers
    this.users = new CollectionManager(this.s3, 'users.json', UserSchema);
    this.carousels = new CollectionManager(this.s3, 'carousels.json', CarouselSchema);
    this.projects = new CollectionManager(this.s3, 'projects.json', ProjectSchema);
    this.projectImages = new CollectionManager(this.s3, 'project-images.json', ProjectImageSchema);
    this.documents = new CollectionManager(this.s3, 'documents.json', DocumentSchema);
    this.contactSubmissions = new CollectionManager(
      this.s3,
      'contact-submissions.json',
      ContactSubmissionSchema
    );
    this.siteSettingsCollection = new CollectionManager(
      this.s3,
      'site-settings.json',
      SiteSettingsSchema
    );
    this.handbooks = new CollectionManager(this.s3, 'handbooks.json', HandbookSchema);
    this.handbookFiles = new CollectionManager(
      this.s3,
      'handbook-files.json',
      HandbookFileSchema
    );
  }

  // ============================================================================
  // User Operations
  // ============================================================================

  user = {
    create: async (data: UserCreate): Promise<User> => {
      // Check email uniqueness
      const existing = await this.users.findMany({ where: { email: data.email } as any });
      if (existing.length > 0) {
        throw new ConflictError('User', 'email', data.email);
      }

      return this.users.create(data);
    },

    findMany: (options?: QueryOptions<User>): Promise<User[]> => {
      return this.users.findMany(options);
    },

    findUnique: (id: ID): Promise<User | null> => {
      return this.users.findUnique(id);
    },

    findByEmail: async (email: string): Promise<User | null> => {
      const users = await this.users.findMany({ where: { email } as any });
      return users[0] || null;
    },

    update: (id: ID, data: UserUpdate): Promise<User> => {
      return this.users.update(id, data);
    },

    delete: (id: ID): Promise<void> => {
      return this.users.delete(id);
    },
  };

  // ============================================================================
  // Carousel Operations
  // ============================================================================

  carousel = {
    create: (data: CarouselCreate): Promise<Carousel> => {
      return this.carousels.create(data);
    },

    findMany: (options?: QueryOptions<Carousel>): Promise<Carousel[]> => {
      return this.carousels.findMany(options);
    },

    findUnique: (id: ID): Promise<Carousel | null> => {
      return this.carousels.findUnique(id);
    },

    update: (id: ID, data: CarouselUpdate): Promise<Carousel> => {
      return this.carousels.update(id, data);
    },

    delete: (id: ID): Promise<void> => {
      return this.carousels.delete(id);
    },

    reorder: (ids: ID[]): Promise<void> => {
      return this.carousels.reorder(ids);
    },
  };

  // ============================================================================
  // Project Operations (with cascade delete)
  // ============================================================================

  project = {
    create: (data: ProjectCreate): Promise<Project> => {
      return this.projects.create(data);
    },

    findMany: (options?: QueryOptions<Project>): Promise<Project[]> => {
      return this.projects.findMany(options);
    },

    findUnique: (id: ID): Promise<Project | null> => {
      return this.projects.findUnique(id);
    },

    update: (id: ID, data: ProjectUpdate): Promise<Project> => {
      return this.projects.update(id, data);
    },

    delete: async (id: ID): Promise<void> => {
      // Cascade delete: ProjectImages
      const images = await this.projectImages.findMany({ where: { projectId: id } as any });
      await this.projectImages.deleteMany(images.map((img) => img.id));

      // Update Documents (set projectId to null)
      const docs = await this.documents.findMany({ where: { projectId: id } as any });
      for (const doc of docs) {
        await this.documents.update(doc.id, { projectId: undefined } as any);
      }

      // Update Handbooks (set projectId to null)
      const handbooks = await this.handbooks.findMany({ where: { projectId: id } as any });
      for (const handbook of handbooks) {
        await this.handbooks.update(handbook.id, { projectId: undefined } as any);
      }

      // Delete the project itself
      await this.projects.delete(id);
    },

    reorder: (ids: ID[]): Promise<void> => {
      return this.projects.reorder(ids);
    },
  };

  // ============================================================================
  // ProjectImage Operations
  // ============================================================================

  projectImage = {
    create: (data: ProjectImageCreate): Promise<ProjectImage> => {
      return this.projectImages.create(data);
    },

    findMany: (options?: QueryOptions<ProjectImage>): Promise<ProjectImage[]> => {
      return this.projectImages.findMany(options);
    },

    findUnique: (id: ID): Promise<ProjectImage | null> => {
      return this.projectImages.findUnique(id);
    },

    findByProject: async (projectId: ID): Promise<ProjectImage[]> => {
      return this.projectImages.findMany({ where: { projectId } as any });
    },

    update: (id: ID, data: ProjectImageUpdate): Promise<ProjectImage> => {
      return this.projectImages.update(id, data);
    },

    delete: (id: ID): Promise<void> => {
      return this.projectImages.delete(id);
    },

    reorder: async (projectId: ID, ids: ID[]): Promise<void> => {
      return this.projectImages.reorder(ids);
    },
  };

  // ============================================================================
  // Document Operations
  // ============================================================================

  document = {
    create: (data: DocumentCreate): Promise<Document> => {
      return this.documents.create(data);
    },

    findMany: (options?: QueryOptions<Document>): Promise<Document[]> => {
      return this.documents.findMany(options);
    },

    findUnique: (id: ID): Promise<Document | null> => {
      return this.documents.findUnique(id);
    },

    findByProject: async (projectId: ID): Promise<Document[]> => {
      return this.documents.findMany({ where: { projectId } as any });
    },

    update: (id: ID, data: DocumentUpdate): Promise<Document> => {
      return this.documents.update(id, data);
    },

    delete: (id: ID): Promise<void> => {
      return this.documents.delete(id);
    },
  };

  // ============================================================================
  // ContactSubmission Operations
  // ============================================================================

  contactSubmission = {
    create: (data: ContactSubmissionCreate): Promise<ContactSubmission> => {
      return this.contactSubmissions.create(data);
    },

    findMany: (options?: QueryOptions<ContactSubmission>): Promise<ContactSubmission[]> => {
      return this.contactSubmissions.findMany(options);
    },

    findUnique: (id: ID): Promise<ContactSubmission | null> => {
      return this.contactSubmissions.findUnique(id);
    },

    update: (id: ID, data: ContactSubmissionUpdate): Promise<ContactSubmission> => {
      return this.contactSubmissions.update(id, data);
    },

    delete: (id: ID): Promise<void> => {
      return this.contactSubmissions.delete(id);
    },
  };

  // ============================================================================
  // SiteSettings Operations
  // ============================================================================

  siteSettings = {
    create: async (data: SiteSettingsCreate): Promise<SiteSettings> => {
      // Check uniqueness of type+key
      const existing = await this.siteSettingsCollection.findMany({
        where: { type: data.type, key: data.key } as any,
      });

      if (existing.length > 0) {
        throw new ConflictError('SiteSettings', 'type+key', `${data.type}:${data.key}`);
      }

      return this.siteSettingsCollection.create(data);
    },

    findMany: (options?: QueryOptions<SiteSettings>): Promise<SiteSettings[]> => {
      return this.siteSettingsCollection.findMany(options);
    },

    findUnique: (id: ID): Promise<SiteSettings | null> => {
      return this.siteSettingsCollection.findUnique(id);
    },

    findByTypeAndKey: async (type: string, key: string): Promise<SiteSettings | null> => {
      const items = await this.siteSettingsCollection.findMany({
        where: { type, key } as any,
      });
      return items[0] || null;
    },

    update: (id: ID, data: SiteSettingsUpdate): Promise<SiteSettings> => {
      return this.siteSettingsCollection.update(id, data);
    },

    delete: (id: ID): Promise<void> => {
      return this.siteSettingsCollection.delete(id);
    },
  };

  // ============================================================================
  // Handbook Operations (with cascade delete)
  // ============================================================================

  handbook = {
    create: (data: HandbookCreate): Promise<Handbook> => {
      return this.handbooks.create(data);
    },

    findMany: (options?: QueryOptions<Handbook>): Promise<Handbook[]> => {
      return this.handbooks.findMany(options);
    },

    findUnique: (id: ID): Promise<Handbook | null> => {
      return this.handbooks.findUnique(id);
    },

    findByProject: async (projectId: ID): Promise<Handbook[]> => {
      return this.handbooks.findMany({ where: { projectId } as any });
    },

    update: (id: ID, data: HandbookUpdate): Promise<Handbook> => {
      return this.handbooks.update(id, data);
    },

    delete: async (id: ID): Promise<void> => {
      // Cascade delete: HandbookFiles
      const files = await this.handbookFiles.findMany({ where: { handbookId: id } as any });
      await this.handbookFiles.deleteMany(files.map((file) => file.id));

      // Delete the handbook itself
      await this.handbooks.delete(id);
    },

    reorder: (ids: ID[]): Promise<void> => {
      return this.handbooks.reorder(ids);
    },
  };

  // ============================================================================
  // HandbookFile Operations
  // ============================================================================

  handbookFile = {
    create: (data: HandbookFileCreate): Promise<HandbookFile> => {
      return this.handbookFiles.create(data);
    },

    findMany: (options?: QueryOptions<HandbookFile>): Promise<HandbookFile[]> => {
      return this.handbookFiles.findMany(options);
    },

    findUnique: (id: ID): Promise<HandbookFile | null> => {
      return this.handbookFiles.findUnique(id);
    },

    findByHandbook: async (handbookId: ID): Promise<HandbookFile[]> => {
      return this.handbookFiles.findMany({ where: { handbookId } as any });
    },

    update: (id: ID, data: HandbookFileUpdate): Promise<HandbookFile> => {
      return this.handbookFiles.update(id, data);
    },

    delete: (id: ID): Promise<void> => {
      return this.handbookFiles.delete(id);
    },

    reorder: async (handbookId: ID, ids: ID[]): Promise<void> => {
      return this.handbookFiles.reorder(ids);
    },
  };

  // ============================================================================
  // Health Check
  // ============================================================================

  async health(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      // Try to read one collection
      await this.users.findMany({ take: 1 });
      return { status: 'ok' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}
