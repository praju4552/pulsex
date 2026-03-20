import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    const users = [
        { email: 'prajwalshetty4552@gmail.com', password: '4552', role: 'USER' as const },
        { email: 'eng22ec0084@dsu.edu.in', password: 'ka14p4552', role: 'INSTITUTION_ADMIN' as const }
    ];

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
        
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                password: hashedPassword,
                role: u.role
            },
            create: {
                email: u.email,
                password: hashedPassword,
                role: u.role,
                name: u.email.split('@')[0],
                credits: 20
            }
        });
        console.log(`Updated/Created user: ${u.email} with role ${u.role}`);
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
