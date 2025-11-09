/**
 * Export Prisma PostgreSQL data to JSON files
 *
 * This script exports all data from the current Prisma database
 * to JSON files that can be uploaded to S3.
 *
 * Usage:
 *   npx tsx scripts/export-to-json.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface Collection<T> {
  items: Record<string, T>;
  metadata: {
    count: number;
    lastUpdated: string;
  };
}

function createCollection<T extends { id: string }>(items: T[]): Collection<T> {
  const itemsMap: Record<string, T> = {};
  for (const item of items) {
    itemsMap[item.id] = item;
  }

  return {
    items: itemsMap,
    metadata: {
      count: items.length,
      lastUpdated: new Date().toISOString(),
    },
  };
}

async function exportData() {
  console.log('🚀 Starting data export from PostgreSQL...\n');

  const outputDir = path.join(process.cwd(), 'data-export');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Export Users
    console.log('📤 Exporting users...');
    const users = await prisma.user.findMany();
    fs.writeFileSync(
      path.join(outputDir, 'users.json'),
      JSON.stringify(createCollection(users), null, 2)
    );
    console.log(`   ✅ Exported ${users.length} users`);

    // Export Carousels
    console.log('📤 Exporting carousels...');
    const carousels = await prisma.carousel.findMany({ orderBy: { order: 'asc' } });
    fs.writeFileSync(
      path.join(outputDir, 'carousels.json'),
      JSON.stringify(createCollection(carousels), null, 2)
    );
    console.log(`   ✅ Exported ${carousels.length} carousels`);

    // Export Projects
    console.log('📤 Exporting projects...');
    const projects = await prisma.project.findMany({ orderBy: { order: 'asc' } });
    fs.writeFileSync(
      path.join(outputDir, 'projects.json'),
      JSON.stringify(createCollection(projects), null, 2)
    );
    console.log(`   ✅ Exported ${projects.length} projects`);

    // Export Project Images
    console.log('📤 Exporting project images...');
    const projectImages = await prisma.projectImage.findMany({ orderBy: { order: 'asc' } });
    fs.writeFileSync(
      path.join(outputDir, 'project-images.json'),
      JSON.stringify(createCollection(projectImages), null, 2)
    );
    console.log(`   ✅ Exported ${projectImages.length} project images`);

    // Export Documents
    console.log('📤 Exporting documents...');
    const documents = await prisma.document.findMany();
    fs.writeFileSync(
      path.join(outputDir, 'documents.json'),
      JSON.stringify(createCollection(documents), null, 2)
    );
    console.log(`   ✅ Exported ${documents.length} documents`);

    // Export Contact Submissions
    console.log('📤 Exporting contact submissions...');
    const contactSubmissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    fs.writeFileSync(
      path.join(outputDir, 'contact-submissions.json'),
      JSON.stringify(createCollection(contactSubmissions), null, 2)
    );
    console.log(`   ✅ Exported ${contactSubmissions.length} contact submissions`);

    // Export Site Settings
    console.log('📤 Exporting site settings...');
    const siteSettings = await prisma.siteSettings.findMany();
    fs.writeFileSync(
      path.join(outputDir, 'site-settings.json'),
      JSON.stringify(createCollection(siteSettings), null, 2)
    );
    console.log(`   ✅ Exported ${siteSettings.length} site settings`);

    // Export Handbooks
    console.log('📤 Exporting handbooks...');
    const handbooks = await prisma.handbook.findMany({ orderBy: { order: 'asc' } });
    fs.writeFileSync(
      path.join(outputDir, 'handbooks.json'),
      JSON.stringify(createCollection(handbooks), null, 2)
    );
    console.log(`   ✅ Exported ${handbooks.length} handbooks`);

    // Export Handbook Files
    console.log('📤 Exporting handbook files...');
    const handbookFiles = await prisma.handbookFile.findMany({ orderBy: { order: 'asc' } });
    fs.writeFileSync(
      path.join(outputDir, 'handbook-files.json'),
      JSON.stringify(createCollection(handbookFiles), null, 2)
    );
    console.log(`   ✅ Exported ${handbookFiles.length} handbook files`);

    console.log('\n✨ Export complete!');
    console.log(`📁 Files saved to: ${outputDir}`);

    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Carousels: ${carousels.length}`);
    console.log(`   Projects: ${projects.length}`);
    console.log(`   Project Images: ${projectImages.length}`);
    console.log(`   Documents: ${documents.length}`);
    console.log(`   Contact Submissions: ${contactSubmissions.length}`);
    console.log(`   Site Settings: ${siteSettings.length}`);
    console.log(`   Handbooks: ${handbooks.length}`);
    console.log(`   Handbook Files: ${handbookFiles.length}`);
    console.log(
      `   Total Records: ${
        users.length +
        carousels.length +
        projects.length +
        projectImages.length +
        documents.length +
        contactSubmissions.length +
        siteSettings.length +
        handbooks.length +
        handbookFiles.length
      }`
    );
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run export
exportData().catch((error) => {
  console.error(error);
  process.exit(1);
});
