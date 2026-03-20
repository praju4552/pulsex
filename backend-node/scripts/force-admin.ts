import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function forceReset() {
    const email = 'prajwalshetty4552@gmail.com';
    const hashedPassword = await bcrypt.hash('4552', SALT_ROUNDS);

    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword, role: 'SUPER_ADMIN' }
    });
    console.log(`Password for ${email} forced back to original.`);
}

forceReset().catch(console.error).finally(() => prisma.$disconnect());
