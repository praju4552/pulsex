
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting history cleanup...");

    try {
        const deletedSearches = await prisma.userSearchHistory.deleteMany({});
        console.log(`Deleted ${deletedSearches.count} search history records.`);

        const deletedActivity = await prisma.userProjectActivity.deleteMany({});
        console.log(`Deleted ${deletedActivity.count} project activity records.`);

        console.log("All history cleared successfully.");
    } catch (error) {
        console.error("Error clearing history:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
