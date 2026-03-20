import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Create User
    await prisma.$executeRawUnsafe(`CREATE USER 'antigravity_app'@'localhost' IDENTIFIED BY 'EdmalaB@2025_db';`);
    // 2. Grant Privileges (Scoped to project DB)
    await prisma.$executeRawUnsafe(`GRANT ALL PRIVILEGES ON \`pulsex_db\`.* TO 'antigravity_app'@'localhost';`);
    // 3. Flush 
    await prisma.$executeRawUnsafe(`FLUSH PRIVILEGES;`);
    
    console.log("✅ MySQL user item 'antigravity_app' created successfully.");
  } catch (e: any) {
    if (e.message && e.message.includes("already exists")) {
         console.log("⚠️ User 'antigravity_app' already exists, continuing.");
    } else {
         console.error("❌ DB Ops Error:", e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
