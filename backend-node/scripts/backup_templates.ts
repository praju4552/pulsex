/**
 * Template Module Database Backup Script
 * Exports all Template* model data to a timestamped JSON file.
 * Run: npx ts-node scripts/backup_templates.ts
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🔵 Starting Template module database backup...\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups');
    const backupFile = path.join(backupDir, `template_backup_${timestamp}.json`);

    // Ensure backups directory exists
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log(`📁 Created backups directory: ${backupDir}`);
    }

    console.log('📊 Querying all Template* tables...\n');

    const [
        templateProjects,
        templateSections,
        templateLessons,
        templateContentBlocks,
        templateUserProjectProgress,
        templateUserLessonProgress,
    ] = await Promise.all([
        prisma.templateProject.findMany(),
        prisma.templateSection.findMany(),
        prisma.templateLesson.findMany(),
        prisma.templateContentBlock.findMany(),
        prisma.templateUserProjectProgress.findMany(),
        prisma.templateUserLessonProgress.findMany(),
    ]);

    const backup = {
        metadata: {
            backupDate: new Date().toISOString(),
            description: 'Full backup of Template module data',
            counts: {
                templateProject: templateProjects.length,
                templateSection: templateSections.length,
                templateLesson: templateLessons.length,
                templateContentBlock: templateContentBlocks.length,
                templateUserProjectProgress: templateUserProjectProgress.length,
                templateUserLessonProgress: templateUserLessonProgress.length,
            }
        },
        data: {
            templateProject: templateProjects,
            templateSection: templateSections,
            templateLesson: templateLessons,
            templateContentBlock: templateContentBlocks,
            templateUserProjectProgress: templateUserProjectProgress,
            templateUserLessonProgress: templateUserLessonProgress,
        }
    };

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log('✅ DATABASE BACKUP COMPLETE\n');
    console.log('='.repeat(50));
    console.log(`📄 BACKUP FILE: ${backupFile}`);
    console.log('='.repeat(50));
    console.log('\n📊 RECORD COUNTS PER TABLE:');
    Object.entries(backup.metadata.counts).forEach(([table, count]) => {
        console.log(`   ${table.padEnd(35)} → ${count} records`);
    });
    console.log('\n✅ TEMPLATE DATA BACKED UP: YES');
}

main()
    .catch(e => {
        console.error('❌ Backup failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
