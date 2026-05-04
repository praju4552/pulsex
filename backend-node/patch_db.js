const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const record = await prisma.pricingConfig.findUnique({ where: { key: 'pcb_pricing' } });
  if (record && record.value) {
    const val = record.value;
    if (!val.materialMult['Proto FR-4']) {
      val.materialMult['Proto FR-4'] = 1.0;
      await prisma.pricingConfig.update({
        where: { key: 'pcb_pricing' },
        data: { value: val }
      });
      console.log('Successfully added Proto FR-4 to DB!');
    } else {
      console.log('Already exists in DB.');
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error(err);
    prisma.$disconnect();
  });
