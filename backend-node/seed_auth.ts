import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    const users = [
        { email: 'admin@example.com', password: 'admin123', role: 'SUPER_ADMIN' as const },
        { email: 'user@example.com', password: 'user123', role: 'USER' as const },
        { email: 'prajwalshetty4552@gmail.com', password: '4552', role: 'USER' as const },
        { email: 'eng22ec0084@dsu.edu.in', password: 'ka14p4552', role: 'INSTITUTION_ADMIN' as const }
    ];

    for (const u of users) {
        const existing = await prisma.user.findUnique({ where: { email: u.email } });
        if (existing) {
            console.log(`User ${u.email} already exists.`);
            continue;
        }

        const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
        await prisma.user.create({
            data: {
                email: u.email,
                password: hashedPassword,
                role: u.role,
            }
        });
        console.log(`Created user: ${u.email}`);
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
