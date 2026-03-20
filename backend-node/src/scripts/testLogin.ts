import bcrypt from 'bcryptjs';
import prisma from '../db';

async function testLogin() {
  const email = 'pulsewritexsolutions@gmail.com';
  const password = 'EdmalaB@2025';

  const user = await prisma.prototypingUser.findUnique({ where: { email } });
  if (!user) { console.log('USER NOT FOUND'); return; }
  
  console.log('Found user:', user.email, user.role, 'password starts:', user.password?.substring(0,7));
  
  if (!user.password) { console.log('NO PASSWORD SET'); return; }
  
  const valid = await bcrypt.compare(password, user.password);
  console.log('Password valid:', valid);
  
  await prisma.$disconnect();
}
testLogin().catch(console.error);
