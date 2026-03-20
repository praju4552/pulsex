import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function seedGlobalUsers() {
    try {
        console.log('Seeding root admin credentials...');

        const superAdminEmail = 'prajwalshetty4552@gmail.com';
        const defaultPassword = '4552'; 

        const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

        // Upsert Super Admin
        const superAdmin = await prisma.user.upsert({
            where: { email: superAdminEmail },
            update: {
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                name: 'Prajwal (Super Admin)'
            },
            create: {
                email: superAdminEmail,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                name: 'Prajwal (Super Admin)',
                credits: 9999
            }
        });

        console.log(`✅ Super Admin seeded/updated: ${superAdmin.email}`);
        console.log(`   Password set to: ${defaultPassword}`);

        // Seed a regular tester user
        const testUserEmail = 'user@example.com';
        const testUser = await prisma.user.upsert({
            where: { email: testUserEmail },
            update: {
                password: hashedPassword,
                role: 'USER',
                name: 'Test Regular User'
            },
            create: {
                email: testUserEmail,
                password: hashedPassword,
                role: 'USER',
                name: 'Test Regular User',
                credits: 100
            }
        });

        console.log(`✅ Regular User seeded/updated: ${testUser.email}`);
        console.log(`   Password set to: ${defaultPassword}`);

    } catch (e) {
        console.error('Error seeding global credentials:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedGlobalUsers();
