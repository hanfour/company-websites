/**
 * Prisma Storage Implementation
 *
 * Simple wrapper around Prisma Client.
 * Philosophy: Don't fight the framework, just adapt it.
 */

import { PrismaClient } from '@prisma/client';
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

import { NotFoundError } from '../types';

export class PrismaStorage implements IStorage {
  private prisma: PrismaClient;

  constructor(databaseUrl: string) {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  // ============================================================================
  // User Operations
  // ============================================================================

  user = {
    create: async (data: UserCreate): Promise<User> => {
      return this.prisma.user.create({ data }) as any;
    },

    findMany: async (options?: QueryOptions<User>): Promise<User[]> => {
      return this.prisma.user.findMany({
        where: options?.where,
        orderBy: options?.orderBy
          ? { [options.orderBy.field as string]: options.orderBy.direction }
          : undefined,
        skip: options?.skip,
        take: options?.take,
      }) as any;
    },

    findUnique: async (id: ID): Promise<User | null> => {
      return this.prisma.user.findUnique({ where: { id } }) as any;
    },

    findByEmail: async (email: string): Promise<User | null> => {
      return this.prisma.user.findUnique({ where: { email } }) as any;
    },

    update: async (id: ID, data: UserUpdate): Promise<User> => {
      return this.prisma.user.update({ where: { id }, data }) as any;
    },

    delete: async (id: ID): Promise<void> => {
      await this.prisma.user.delete({ where: { id } });
    },
  };

  // ============================================================================
  // Carousel Operations
  // ============================================================================

  carousel = {
    create: async (data: CarouselCreate): Promise<Carousel> => {
      return this.prisma.carousel.create({ data }) as any;
    },

    findMany: async (options?: QueryOptions<Carousel>): Promise<Carousel[]> => {
      return this.prisma.carousel.findMany({
        where: options?.where,
        orderBy: options?.orderBy
          ? { [options.orderBy.field as string]: options.orderBy.direction }
          : undefined,
        skip: options?.skip,
        take: options?.take,
      }) as any;
    },

    findUnique: async (id: ID): Promise<Carousel | null> => {
      return this.prisma.carousel.findUnique({ where: { id } }) as any;
    },

    update: async (id: ID, data: CarouselUpdate): Promise<Carousel> => {
      return this.prisma.carousel.update({ where: { id }, data }) as any;
    },

    delete: async (id: ID): Promise<void> => {
      await this.prisma.carousel.delete({ where: { id } });
    },

    reorder: async (ids: ID[]): Promise<void> => {
      await this.prisma.$transaction(
        ids.map((id, index) =>
          this.prisma.carousel.update({
            where: { id },
            data: { order: index },
          })
        )
      );
    },
  };

  // ============================================================================
  // Project Operations
  // ============================================================================

  project = {
    create: async (data: ProjectCreate): Promise<Project> => {
      return this.prisma.project.create({ data }) as any;
    },

    findMany: async (options?: QueryOptions<Project>): Promise<Project[]> => {
      return this.prisma.project.findMany({
        where: options?.where,
        orderBy: options?.orderBy
          ? { [options.orderBy.field as string]: options.orderBy.direction }
          : undefined,
        skip: options?.skip,
        take: options?.take,
      }) as any;
    },

    findUnique: async (id: ID): Promise<Project | null> => {
      return this.prisma.project.findUnique({ where: { id } }) as any;
    },

    update: async (id: ID, data: ProjectUpdate): Promise<Project> => {
      return this.prisma.project.update({ where: { id }, data }) as any;
    },

    delete: async (id: ID): Promise<void> => {
      // Prisma handles cascade deletes automatically via schema
      await this.prisma.project.delete({ where: { id } });
    },

    reorder: async (ids: ID[]): Promise<void> => {
      await this.prisma.$transaction(
        ids.map((id, index) =>
          this.prisma.project.update({
            where: { id },
            data: { order: index },
          })
        )
      );
    },
  };

  // ============================================================================
  // ProjectImage Operations
  // ============================================================================

  projectImage = {
    create: async (data: ProjectImageCreate): Promise<ProjectImage> => {
      return this.prisma.projectImage.create({ data }) as any;
    },

    findMany: async (options?: QueryOptions<ProjectImage>): Promise<ProjectImage[]> => {
      return this.prisma.projectImage.findMany({
        where: options?.where,
        orderBy: options?.orderBy
          ? { [options.orderBy.field as string]: options.orderBy.direction }
          : undefined,
        skip: options?.skip,
        take: options?.take,
      }) as any;
    },

    findUnique: async (id: ID): Promise<ProjectImage | null> => {
      return this.prisma.projectImage.findUnique({ where: { id } }) as any;
    },

    findByProject: async (projectId: ID): Promise<ProjectImage[]> => {
      return this.prisma.projectImage.findMany({
        where: { projectId },
        orderBy: { order: 'asc' },
      }) as any;
    },

    update: async (id: ID, data: ProjectImageUpdate): Promise<ProjectImage> => {
      return this.prisma.projectImage.update({ where: { id }, data }) as any;
    },

    delete: async (id: ID): Promise<void> => {
      await this.prisma.projectImage.delete({ where: { id } });
    },

    reorder: async (projectId: ID, ids: ID[]): Promise<void> => {
      await this.prisma.$transaction(
        ids.map((id, index) =>
          this.prisma.projectImage.update({
            where: { id },
            data: { order: index },
          })
        )
      );
    },
  };

  // ============================================================================
  // Document Operations
  // ============================================================================

  document = {
    create: async (data: DocumentCreate): Promise<Document> => {
      return this.prisma.document.create({ data }) as any;
    },

    findMany: async (options?: QueryOptions<Document>): Promise<Document[]> => {
      return this.prisma.document.findMany({
        where: options?.where,
        orderBy: options?.orderBy
          ? { [options.orderBy.field as string]: options.orderBy.direction }
          : undefined,
        skip: options?.skip,
        take: options?.take,
      }) as any;
    },

    findUnique: async (id: ID): Promise<Document | null> => {
      return this.prisma.document.findUnique({ where: { id } }) as any;
    },

    findByProject: async (projectId: ID): Promise<Document[]> => {
      return this.prisma.document.findMany({
        where: { projectId },
      }) as any;
    },

    update: async (id: ID, data: DocumentUpdate): Promise<Document> => {
      return this.prisma.document.update({ where: { id }, data }) as any;
    },

    delete: async (id: ID): Promise<void> => {
      await this.prisma.document.delete({ where: { id } });
    },
  };

  // ============================================================================
  // ContactSubmission Operations
  // ============================================================================

  contactSubmission = {
    create: async (data: ContactSubmissionCreate): Promise<ContactSubmission> => {
      return this.prisma.contactSubmission.create({ data }) as any;
    },

    findMany: async (options?: QueryOptions<ContactSubmission>): Promise<ContactSubmission[]> => {
      return this.prisma.contactSubmission.findMany({
        where: options?.where,
        orderBy: options?.orderBy
          ? { [options.orderBy.field as string]: options.orderBy.direction }
          : undefined,
        skip: options?.skip,
        take: options?.take,
      }) as any;
    },

    findUnique: async (id: ID): Promise<ContactSubmission | null> => {
      return this.prisma.contactSubmission.findUnique({ where: { id } }) as any;
    },

    update: async (id: ID, data: ContactSubmissionUpdate): Promise<ContactSubmission> => {
      return this.prisma.contactSubmission.update({ where: { id }, data }) as any;
    },

    delete: async (id: ID): Promise<void> => {
      await this.prisma.contactSubmission.delete({ where: { id } });
    },
  };

  // ============================================================================
  // SiteSettings Operations
  // ============================================================================

  siteSettings = {
    create: async (data: SiteSettingsCreate): Promise<SiteSettings> => {
      return this.prisma.siteSettings.create({ data }) as any;
    },

    findMany: async (options?: QueryOptions<SiteSettings>): Promise<SiteSettings[]> => {
      return this.prisma.siteSettings.findMany({
        where: options?.where,
        orderBy: options?.orderBy
          ? { [options.orderBy.field as string]: options.orderBy.direction }
          : undefined,
        skip: options?.skip,
        take: options?.take,
      }) as any;
    },

    findUnique: async (id: ID): Promise<SiteSettings | null> => {
      return this.prisma.siteSettings.findUnique({ where: { id } }) as any;
    },

    findByTypeAndKey: async (type: string, key: string): Promise<SiteSettings | null> => {
      return this.prisma.siteSettings.findUnique({
        where: { type_key: { type, key } },
      }) as any;
    },

    update: async (id: ID, data: SiteSettingsUpdate): Promise<SiteSettings> => {
      return this.prisma.siteSettings.update({ where: { id }, data }) as any;
    },

    delete: async (id: ID): Promise<void> => {
      await this.prisma.siteSettings.delete({ where: { id } });
    },
  };

  // ============================================================================
  // Handbook Operations
  // ============================================================================

  handbook = {
    create: async (data: HandbookCreate): Promise<Handbook> => {
      return this.prisma.handbook.create({ data }) as any;
    },

    findMany: async (options?: QueryOptions<Handbook>): Promise<Handbook[]> => {
      return this.prisma.handbook.findMany({
        where: options?.where,
        orderBy: options?.orderBy
          ? { [options.orderBy.field as string]: options.orderBy.direction }
          : undefined,
        skip: options?.skip,
        take: options?.take,
      }) as any;
    },

    findUnique: async (id: ID): Promise<Handbook | null> => {
      return this.prisma.handbook.findUnique({ where: { id } }) as any;
    },

    findByProject: async (projectId: ID): Promise<Handbook[]> => {
      return this.prisma.handbook.findMany({
        where: { projectId },
        orderBy: { order: 'asc' },
      }) as any;
    },

    update: async (id: ID, data: HandbookUpdate): Promise<Handbook> => {
      return this.prisma.handbook.update({ where: { id }, data }) as any;
    },

    delete: async (id: ID): Promise<void> => {
      // Prisma handles cascade deletes automatically via schema
      await this.prisma.handbook.delete({ where: { id } });
    },

    reorder: async (ids: ID[]): Promise<void> => {
      await this.prisma.$transaction(
        ids.map((id, index) =>
          this.prisma.handbook.update({
            where: { id },
            data: { order: index },
          })
        )
      );
    },
  };

  // ============================================================================
  // HandbookFile Operations
  // ============================================================================

  handbookFile = {
    create: async (data: HandbookFileCreate): Promise<HandbookFile> => {
      return this.prisma.handbookFile.create({ data }) as any;
    },

    findMany: async (options?: QueryOptions<HandbookFile>): Promise<HandbookFile[]> => {
      return this.prisma.handbookFile.findMany({
        where: options?.where,
        orderBy: options?.orderBy
          ? { [options.orderBy.field as string]: options.orderBy.direction }
          : undefined,
        skip: options?.skip,
        take: options?.take,
      }) as any;
    },

    findUnique: async (id: ID): Promise<HandbookFile | null> => {
      return this.prisma.handbookFile.findUnique({ where: { id } }) as any;
    },

    findByHandbook: async (handbookId: ID): Promise<HandbookFile[]> => {
      return this.prisma.handbookFile.findMany({
        where: { handbookId },
        orderBy: { order: 'asc' },
      }) as any;
    },

    update: async (id: ID, data: HandbookFileUpdate): Promise<HandbookFile> => {
      return this.prisma.handbookFile.update({ where: { id }, data }) as any;
    },

    delete: async (id: ID): Promise<void> => {
      await this.prisma.handbookFile.delete({ where: { id } });
    },

    reorder: async (handbookId: ID, ids: ID[]): Promise<void> => {
      await this.prisma.$transaction(
        ids.map((id, index) =>
          this.prisma.handbookFile.update({
            where: { id },
            data: { order: index },
          })
        )
      );
    },
  };

  // ============================================================================
  // Health Check
  // ============================================================================

  async health(): Promise<{ status: 'ok' | 'error'; message?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}
