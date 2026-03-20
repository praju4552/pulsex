import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Institutions...');

    // 1. Create a Test Institution
    const institution = await prisma.institution.upsert({
        where: { name: 'Echo Academy' },
        update: {},
        create: {
            name: 'Echo Academy',
            description: 'A premier engineering institution.',
            address: '123 Tech Lane, Silicon Valley',
        },
    });

    console.log('Created Institution:', institution.name);

    // 2. Link the test Institution Admin to this Institution
    const instAdminEmail = 'inst-admin@example.com';
    const updatedUser = await prisma.user.update({
        where: { email: instAdminEmail },
        data: {
            institutionId: institution.id,
            institutionName: institution.name
        }
    });

    console.log('Linked user:', updatedUser.email, 'to institution:', institution.name);

    // 3. Ensure Super Admin is NOT at an institution
    const superAdminEmail = 'prajwalshetty4552@gmail.com';
    await prisma.user.update({
        where: { email: superAdminEmail },
        data: {
            institutionId: null,
            institutionName: 'Global Administration'
        }
    });

    console.log('Verified Super Admin separation.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
