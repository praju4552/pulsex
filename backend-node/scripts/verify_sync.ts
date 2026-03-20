import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const u1 = await prisma.user.findUnique({ where: { email: 'prajwalshetty4552@gmail.com' } });
    const u2 = await prisma.user.findUnique({ where: { email: 'pulsewritexsolutions@gmail.com' } });
    console.log('--- ADMIN SYNC STATUS ---');
    console.log(`Admin 1: ${u1?.email} | Inst: ${u1?.institutionId} | Credits: ${u1?.credits}`);
    console.log(`Admin 2: ${u2?.email} | Inst: ${u2?.institutionId} | Credits: ${u2?.credits}`);
    console.log('-------------------------');
}

main().finally(() => prisma.$disconnect());
