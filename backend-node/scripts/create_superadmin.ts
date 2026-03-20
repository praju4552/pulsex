import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Get the source admin details
    const sourceEmail = 'prajwalshetty4552@gmail.com';
    const sourceUser = await prisma.user.findUnique({ where: { email: sourceEmail } });

    if (!sourceUser) {
        console.error(`Source user ${sourceEmail} not found!`);
        process.exit(1);
    }

    console.log(`Syncing with source admin: ${sourceEmail} (Inst: ${sourceUser.institutionId})`);

    // 2. Define the target admin
    const targetEmail = 'pulsewritexsolutions@gmail.com';
    const targetPassword = 'EdmalaB@2025';
    const targetHashedPassword = await bcrypt.hash(targetPassword, 10);

    // 3. Sync target to match source (same institution, same credits, etc.)
    const updatedTarget = await prisma.user.upsert({
        where: { email: targetEmail },
        update: {
            password: targetHashedPassword,
            rawPassword: targetPassword,
            role: 'SUPER_ADMIN',
            name: 'Pulse WriteX SuperAdmin',
            institutionId: sourceUser.institutionId,
            credits: sourceUser.credits
        },
        create: {
            email: targetEmail,
            password: targetHashedPassword,
            rawPassword: targetPassword,
            role: 'SUPER_ADMIN',
            name: 'Pulse WriteX SuperAdmin',
            institutionId: sourceUser.institutionId,
            credits: sourceUser.credits
        }
    });

    // 4. Update source if needed (ensure its password is set correctly as requested earlier)
    const sourcePassword = 'K@16el2939';
    const sourceHashedPassword = await bcrypt.hash(sourcePassword, 10);
    
    await prisma.user.update({
        where: { email: sourceEmail },
        data: {
            password: sourceHashedPassword,
            rawPassword: sourcePassword,
            role: 'SUPER_ADMIN'
        }
    });

    console.log(`✅ Successfully linked and synced: ${targetEmail}`);
    console.log(`   Both admins are now tied to Institution: ${sourceUser.institutionId}`);
}

main()
    .catch(e => {
        console.error('Error syncing superadmins:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
