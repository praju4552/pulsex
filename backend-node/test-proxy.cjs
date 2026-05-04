const { PrismaClient } = require('@prisma/client');

let prismaInstance = null;

const prisma = new Proxy({}, {
  get: (target, prop) => {
    if (!prismaInstance) {
      prismaInstance = new PrismaClient();
    }
    const val = prismaInstance[prop];
    return typeof val === 'function' ? val.bind(prismaInstance) : val;
  }
});

async function run() {
  try {
    console.log("Creating...");
    const r = await prisma.threeDFile.findFirst();
    console.log("Success:", !!r);
  } catch (e) {
    console.error("Error:", e);
  } finally {
     prismaInstance.$disconnect();
  }
}
run();
