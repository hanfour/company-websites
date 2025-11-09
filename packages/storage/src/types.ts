/**
 * Unified Storage Abstraction Types
 *
 * Design Philosophy (Linus-style):
 * 1. "Good taste" - No special cases, all models follow same CRUD pattern
 * 2. Simplicity - Relations via IDs, not complex nested objects
 * 3. Ownership - Parent owns children, parent deletion cascades
 */

import { z } from 'zod';

// ============================================================================
// Base Types - Common patterns used across all models
// ============================================================================

export type ID = string;

export interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface WithOrder {
  order: number;
}

export interface WithActive {
  isActive: boolean;
}

// ============================================================================
// Domain Models - Direct mapping from Prisma schema
// ============================================================================

// --- User Model ---
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(), // hashed
  role: z.string().default('admin'),
  hasChangedPassword: z.boolean().default(false),
  resetToken: z.string().optional(),
  resetTokenExpiry: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type UserCreate = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UserUpdate = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

// --- Carousel Model ---
export const CarouselSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  imageUrl: z.string(),
  linkUrl: z.string().optional(),
  linkText: z.string().optional(),
  textPosition: z.string().default('center'),
  textDirection: z.string().default('horizontal'),
  order: z.number().int(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Carousel = z.infer<typeof CarouselSchema>;
export type CarouselCreate = Omit<Carousel, 'id' | 'createdAt' | 'updatedAt'>;
export type CarouselUpdate = Partial<Omit<Carousel, 'id' | 'createdAt' | 'updatedAt'>>;

// --- Project Model ---
export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  details: z.any().optional(), // Json type
  order: z.number().int(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectCreate = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>;

// --- ProjectImage Model (Child of Project) ---
export const ProjectImageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  imageUrl: z.string(),
  order: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectImage = z.infer<typeof ProjectImageSchema>;
export type ProjectImageCreate = Omit<ProjectImage, 'id' | 'createdAt' | 'updatedAt'>;
export type ProjectImageUpdate = Partial<Omit<ProjectImage, 'id' | 'createdAt' | 'updatedAt'>>;

// --- Document Model ---
export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fileUrl: z.string(),
  fileType: z.string(),
  category: z.string(),
  order: z.number().int(),
  isActive: z.boolean().default(true),
  downloadCount: z.number().int().default(0),
  imageUrl: z.string().optional(),
  projectId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Document = z.infer<typeof DocumentSchema>;
export type DocumentCreate = Omit<Document, 'id' | 'createdAt' | 'updatedAt'>;
export type DocumentUpdate = Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt'>>;

// --- ContactSubmission Model ---
export const ContactSubmissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string(),
  status: z.string().default('new'),
  reply: z.string().optional(),
  archived: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ContactSubmission = z.infer<typeof ContactSubmissionSchema>;
export type ContactSubmissionCreate = Omit<ContactSubmission, 'id' | 'createdAt' | 'updatedAt'>;
export type ContactSubmissionUpdate = Partial<Omit<ContactSubmission, 'id' | 'createdAt' | 'updatedAt'>>;

// --- SiteSettings Model ---
export const SiteSettingsSchema = z.object({
  id: z.string(),
  type: z.string(),
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SiteSettings = z.infer<typeof SiteSettingsSchema>;
export type SiteSettingsCreate = Omit<SiteSettings, 'id' | 'createdAt' | 'updatedAt'>;
export type SiteSettingsUpdate = Partial<Omit<SiteSettings, 'id' | 'createdAt' | 'updatedAt'>>;

// --- Handbook Model ---
export const HandbookSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  coverImageUrl: z.string(),
  password: z.string(),
  order: z.number().int(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Handbook = z.infer<typeof HandbookSchema>;
export type HandbookCreate = Omit<Handbook, 'id' | 'createdAt' | 'updatedAt'>;
export type HandbookUpdate = Partial<Omit<Handbook, 'id' | 'createdAt' | 'updatedAt'>>;

// --- HandbookFile Model (Child of Handbook) ---
export const HandbookFileSchema = z.object({
  id: z.string(),
  handbookId: z.string(),
  title: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
  fileSize: z.number().int().optional(),
  downloadCount: z.number().int().default(0),
  order: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type HandbookFile = z.infer<typeof HandbookFileSchema>;
export type HandbookFileCreate = Omit<HandbookFile, 'id' | 'createdAt' | 'updatedAt'>;
export type HandbookFileUpdate = Partial<Omit<HandbookFile, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// Query Options - Common patterns for filtering, sorting, pagination
// ============================================================================

export interface QueryOptions<T = any> {
  where?: Partial<T>;
  orderBy?: {
    field: keyof T;
    direction: 'asc' | 'desc';
  };
  skip?: number;
  take?: number;
}

// ============================================================================
// Storage Interface - The contract all implementations must follow
// ============================================================================

/**
 * Unified Storage Interface
 *
 * Philosophy:
 * - All models use same CRUD pattern (create, findMany, findUnique, update, delete)
 * - No "special methods" - if needed, they're built on top of these primitives
 * - Relations are managed through IDs, cascade deletes are explicit
 * - Transactions are optional - JSON can be atomic via file writes
 */
export interface IStorage {
  // --- User Operations ---
  user: {
    create(data: UserCreate): Promise<User>;
    findMany(options?: QueryOptions<User>): Promise<User[]>;
    findUnique(id: ID): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: ID, data: UserUpdate): Promise<User>;
    delete(id: ID): Promise<void>;
  };

  // --- Carousel Operations ---
  carousel: {
    create(data: CarouselCreate): Promise<Carousel>;
    findMany(options?: QueryOptions<Carousel>): Promise<Carousel[]>;
    findUnique(id: ID): Promise<Carousel | null>;
    update(id: ID, data: CarouselUpdate): Promise<Carousel>;
    delete(id: ID): Promise<void>;
    reorder(ids: ID[]): Promise<void>; // Batch update order
  };

  // --- Project Operations ---
  project: {
    create(data: ProjectCreate): Promise<Project>;
    findMany(options?: QueryOptions<Project>): Promise<Project[]>;
    findUnique(id: ID): Promise<Project | null>;
    update(id: ID, data: ProjectUpdate): Promise<Project>;
    delete(id: ID): Promise<void>; // Cascade deletes ProjectImages
    reorder(ids: ID[]): Promise<void>;
  };

  // --- ProjectImage Operations ---
  projectImage: {
    create(data: ProjectImageCreate): Promise<ProjectImage>;
    findMany(options?: QueryOptions<ProjectImage>): Promise<ProjectImage[]>;
    findUnique(id: ID): Promise<ProjectImage | null>;
    findByProject(projectId: ID): Promise<ProjectImage[]>;
    update(id: ID, data: ProjectImageUpdate): Promise<ProjectImage>;
    delete(id: ID): Promise<void>;
    reorder(projectId: ID, ids: ID[]): Promise<void>;
  };

  // --- Document Operations ---
  document: {
    create(data: DocumentCreate): Promise<Document>;
    findMany(options?: QueryOptions<Document>): Promise<Document[]>;
    findUnique(id: ID): Promise<Document | null>;
    findByProject(projectId: ID): Promise<Document[]>;
    update(id: ID, data: DocumentUpdate): Promise<Document>;
    delete(id: ID): Promise<void>;
  };

  // --- ContactSubmission Operations ---
  contactSubmission: {
    create(data: ContactSubmissionCreate): Promise<ContactSubmission>;
    findMany(options?: QueryOptions<ContactSubmission>): Promise<ContactSubmission[]>;
    findUnique(id: ID): Promise<ContactSubmission | null>;
    update(id: ID, data: ContactSubmissionUpdate): Promise<ContactSubmission>;
    delete(id: ID): Promise<void>;
  };

  // --- SiteSettings Operations ---
  siteSettings: {
    create(data: SiteSettingsCreate): Promise<SiteSettings>;
    findMany(options?: QueryOptions<SiteSettings>): Promise<SiteSettings[]>;
    findUnique(id: ID): Promise<SiteSettings | null>;
    findByTypeAndKey(type: string, key: string): Promise<SiteSettings | null>;
    update(id: ID, data: SiteSettingsUpdate): Promise<SiteSettings>;
    delete(id: ID): Promise<void>;
  };

  // --- Handbook Operations ---
  handbook: {
    create(data: HandbookCreate): Promise<Handbook>;
    findMany(options?: QueryOptions<Handbook>): Promise<Handbook[]>;
    findUnique(id: ID): Promise<Handbook | null>;
    findByProject(projectId: ID): Promise<Handbook[]>;
    update(id: ID, data: HandbookUpdate): Promise<Handbook>;
    delete(id: ID): Promise<void>; // Cascade deletes HandbookFiles
    reorder(ids: ID[]): Promise<void>;
  };

  // --- HandbookFile Operations ---
  handbookFile: {
    create(data: HandbookFileCreate): Promise<HandbookFile>;
    findMany(options?: QueryOptions<HandbookFile>): Promise<HandbookFile[]>;
    findUnique(id: ID): Promise<HandbookFile | null>;
    findByHandbook(handbookId: ID): Promise<HandbookFile[]>;
    update(id: ID, data: HandbookFileUpdate): Promise<HandbookFile>;
    delete(id: ID): Promise<void>;
    reorder(handbookId: ID, ids: ID[]): Promise<void>;
  };

  // --- Health Check ---
  health(): Promise<{ status: 'ok' | 'error'; message?: string }>;
}

// ============================================================================
// Storage Configuration
// ============================================================================

export interface StorageConfig {
  type: 'prisma' | 'json';

  // For Prisma
  databaseUrl?: string;

  // For JSON
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string; // For local testing with MinIO
  };

  // Common
  concurrency?: {
    maxRetries: number;
    retryDelay: number;
  };
}

// ============================================================================
// Error Types - Explicit error handling
// ============================================================================

export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION' | 'UNKNOWN',
    public details?: any
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NotFoundError extends StorageError {
  constructor(model: string, id: string) {
    super(`${model} with id ${id} not found`, 'NOT_FOUND');
  }
}

export class ConflictError extends StorageError {
  constructor(model: string, field: string, value: any) {
    super(`${model} with ${field}=${value} already exists`, 'CONFLICT');
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION', details);
  }
}
