import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'prajwalshetty4552@gmail.com';
    console.log(`Promoting ${email} to SUPER_ADMIN...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'SUPER_ADMIN' }
        });
        console.log('User promoted:', user);
    } catch (error) {
        console.error('Failed to promote user (maybe not found):', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
