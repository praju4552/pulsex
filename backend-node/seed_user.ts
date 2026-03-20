import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    const email = 'prajwalshetty4552@gmail.com';
    const password = 'prajju4552';
    const role = 'SUPER_ADMIN' as const;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log(`User ${email} already exists. Updating to SUPER_ADMIN...`);
        await prisma.user.update({
            where: { email },
            data: { role }
        });
        console.log('User updated to SUPER_ADMIN.');
    } else {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
            }
        });
        console.log(`Created SUPER_ADMIN user: ${email}`);
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
