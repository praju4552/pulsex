import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteDefaults() {
    console.log("Deleting default robotics projects...");

    // The seeded category slug is 'robotics'
    const roboticsCategory = await prisma.category.findUnique({
        where: { slug: 'robotics' }
    });

    if (!roboticsCategory) {
        console.log("Robotics category not found. Nothing to delete.");
        return;
    }

    const projects = await prisma.project.findMany({
        where: { categoryId: roboticsCategory.id }
    });

    console.log(`Found ${projects.length} projects to delete.`);

    for (const p of projects) {
        // Delete related versions and skills first (Prisma might cascade if configured, but safe to be explicit)
        await prisma.projectVersion.deleteMany({ where: { projectId: p.id } });
        await prisma.projectSkill.deleteMany({ where: { projectId: p.id } });
    }

    // Now delete the projects themselves
    const deleteResult = await prisma.project.deleteMany({
        where: { categoryId: roboticsCategory.id }
    });

    console.log(`Successfully deleted ${deleteResult.count} default projects.`);

    // Optionally delete the category if it shouldn't exist either
    // await prisma.category.delete({ where: { id: roboticsCategory.id } });
}

deleteDefaults()
    .catch((e) => {
        console.error("Error deleting defaults:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
