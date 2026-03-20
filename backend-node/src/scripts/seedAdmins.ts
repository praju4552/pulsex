import bcrypt from 'bcryptjs';
import prisma from '../db';

const SALT_ROUNDS = 10;

const ADMINS = [
  { email: 'pulsewritexsolutions@gmail.com', password: 'EdmalaB@2025', name: 'Pulse X Admin' },
  { email: 'pulsewritex@gmail.com', password: 'prototyping@2026', name: 'Pulse X Admin 2' },
];

async function seedAdmins() {
  console.log('Seeding admin users...');

  for (const admin of ADMINS) {
    const hashed = await bcrypt.hash(admin.password, SALT_ROUNDS);

    const existing = await prisma.prototypingUser.findUnique({ where: { email: admin.email } });

    if (existing) {
      await prisma.prototypingUser.update({
        where: { email: admin.email },
        data: { role: 'SUPER_ADMIN', password: hashed, name: admin.name },
      });
      console.log(`  Updated: ${admin.email} → SUPER_ADMIN`);
    } else {
      await prisma.prototypingUser.create({
        data: {
          email: admin.email,
          name: admin.name,
          password: hashed,
          role: 'SUPER_ADMIN',
        },
      });
      console.log(`  Created: ${admin.email} → SUPER_ADMIN`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

seedAdmins().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
