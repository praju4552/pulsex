import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Categories:");
    const cats = await prisma.category.findMany();
    console.dir(cats);

    console.log("Projects:");
    const projects = await prisma.project.findMany({
        select: {
            id: true,
            title: true,
            slug: true,
            categoryId: true,
            subcategory: true
        }
    });
    console.dir(projects, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
