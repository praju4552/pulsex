import prisma from '../db';

async function check() {
  const users = await prisma.prototypingUser.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: { email: true, role: true, password: true }
  });
  users.forEach(u => console.log(u.email, u.role, u.password ? u.password.substring(0, 10) + '...' : 'NO_PASSWORD'));
  await prisma.$disconnect();
}
check().catch(console.error);
