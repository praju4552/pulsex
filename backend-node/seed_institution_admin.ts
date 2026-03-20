import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    const email = 'inst-admin@example.com';
    const password = 'admin123';
    const role = 'INSTITUTION_ADMIN' as const;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        await prisma.user.update({
            where: { email },
            data: { role }
        });
        console.log(`Updated user ${email} to ${role}`);
    } else {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
            }
        });
        console.log(`Created user: ${email} with role ${role}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
