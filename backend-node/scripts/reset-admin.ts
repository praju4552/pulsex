import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
    const email = 'prajwalshetty4552@gmail.com';
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('User not found. Creating super admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                name: 'Super Admin'
            }
        });
        console.log('Super admin user created successfully.');
    } else {
        console.log('User found. Resetting password to admin123...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword, role: 'SUPER_ADMIN' }
        });
        console.log('Password reset successfully.');
    }
}

checkAdmin().catch(console.error).finally(() => prisma.$disconnect());
