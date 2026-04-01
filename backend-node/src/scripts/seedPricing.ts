/**
 * seedPricing.ts
 * Upserts the final pricing from PulseX_Pricing_Matrix + gst(Last).xlsx into DB.
 *
 * Run: npx ts-node -P tsconfig.json src/scripts/seedPricing.ts
 *
 * GST (18%) is NOT stored — it is applied at display time only.
 */

import prisma from '../db';

const FINAL_PRICING: Record<string, any> = {

  // ────────────────────────────────────────────────────────────────────────────
  // 3D Printing
  // Formula: (baseSetupFee + vol_cm3 × costPerCm3 × materialMult × qualityMult)
  //          × infillStepMult^steps + finishFee + customColorFee
  // ────────────────────────────────────────────────────────────────────────────
  '3d_pricing': {
    baseSetupFee: 50,     // INR — Initial Setup / Printer Warmup
    costPerCm3:   5,      // INR per cm³ (PLA @ 1.0x baseline)
    materials: [
      { id: 'pla',   name: 'PLA',        costMult: 1.0, desc: 'Eco-friendly, easy to print' },
      { id: 'abs',   name: 'ABS',        costMult: 1.2, desc: 'Tough, heat resistant' },
      { id: 'petg',  name: 'PETG',       costMult: 1.3, desc: 'Strong, chemically resistant' },
      { id: 'tpu',   name: 'TPU',        costMult: 1.5, desc: 'Flexible, impact resistant' },
      { id: 'nylon', name: 'Nylon',      costMult: 1.6, desc: 'High strength, low friction' },
      { id: 'resin', name: 'Resin (SLA)',costMult: 2.0, desc: 'Ultra high detail, smooth' },
    ],
    qualities: [
      { id: 'draft',    name: 'Draft',    layerHeight: 0.30, costMult: 0.8, label: '0.3mm layer height' },
      { id: 'standard', name: 'Standard', layerHeight: 0.20, costMult: 1.0, label: '0.2mm layer height' },
      { id: 'high',     name: 'High',     layerHeight: 0.12, costMult: 1.5, label: '0.12mm layer height' },
      { id: 'ultra',    name: 'Ultra',    layerHeight: 0.08, costMult: 2.0, label: '0.08mm layer height' },
    ],
    infillStepMult: 1.05,   // per 10% step above 20% baseline
    finishes: [
      { id: 'raw',     name: 'Standard (Raw)', cost: 0   },
      { id: 'sanded',  name: 'Sanded',         cost: 100 },
      { id: 'primed',  name: 'Primed',         cost: 200 },
      { id: 'painted', name: 'Painted',        cost: 400 },
    ],
    customColorFee: 100,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // Laser Cutting (unchanged — not in the Excel)
  // ────────────────────────────────────────────────────────────────────────────
  'laser_pricing': {
    wood_mdf:         { basePer_cm2: 0.12, engravingSurcharge: 0.15 },
    wood_plywood:     { basePer_cm2: 0.15, engravingSurcharge: 0.15 },
    hardwood:         { basePer_cm2: 0.25, engravingSurcharge: 0.20 },
    acrylic_cast:     { basePer_cm2: 0.30, engravingSurcharge: 0.10 },
    acrylic_extruded: { basePer_cm2: 0.22, engravingSurcharge: 0.10 },
  },

  // ────────────────────────────────────────────────────────────────────────────
  // PCB Printing
  // Formula per board:
  //   (baseCost + areaCm2 × costPerCm2)
  //   × layerMult × materialMult × thicknessMult
  //   × colorMult × finishMult × copperMult
  //   × qty + advancedFlatFees
  //   then × 1.18 (GST 18%) at display time
  // ────────────────────────────────────────────────────────────────────────────
  'pcb_pricing': {
    baseCost:   700,   // INR — Initial Base Cost / Setup Fee
    costPerCm2: 12,    // INR per sq. cm

    layerMult: {
      '1':  0.8,
      '2':  1.0,
      '4':  2.0,
      '6':  3.0,
      '8':  3.8,
      '10': 4.5,   // 10+ layers = 4.5x
      '12': 4.5,
      '14': 4.5,
      '16': 4.5,
    },

    materialMult: {
      'FR-4':        1.0,
      'Flex':        2.5,
      'Aluminum':    2.0,
      'Copper Core': 2.2,
      'Rogers':      3.5,
      'PTFE Teflon': 4.0,
    },

    thicknessMult: {
      '0.4mm': 1.30,
      '0.6mm': 1.20,
      '0.8mm': 1.10,
      '1.0mm': 1.05,
      '1.2mm': 1.02,
      '1.6mm': 1.00,
      '2.0mm': 1.20,
    },

    colorMult: {
      'Green':       1.0,
      'Red':         1.1,
      'Yellow':      1.1,
      'Blue':        1.1,
      'White':       1.1,
      'Black':       1.1,
      'Purple':      1.1,
      'Matte Black': 1.2,
    },

    finishMult: {
      'HASL(with lead)': 1.0,
      'LeadFree HASL':   1.1,
      'ENIG':            1.4,
      'OSP':             1.5,
      'Hard Gold':       1.5,
      'Silver':          1.5,
      'Tin':             1.5,
    },

    copperMult: {
      '1 oz': 1.0,
      '2 oz': 1.3,
      '3 oz': 1.6,
    },

    advancedFees: {
      castellated: 300,   // Castellated Holes
      goldFingers:  500,  // Edge Connector (Gold Fingers)
      viaEpoxy:     400,  // Via Process (Epoxy Filled)
    },
  },
};

async function main() {
  console.log('\n🌱  Seeding pricing — PulseX_Pricing_Matrix + gst(Last).xlsx\n');
  console.log('   GST (18%) is applied at display time. Not stored here.\n');

  for (const [key, value] of Object.entries(FINAL_PRICING)) {
    const result = await prisma.pricingConfig.upsert({
      where:  { key },
      update: { value: value as any },
      create: { key,   value: value as any },
    });
    console.log(`   ✅  [${key}] → upserted (id: ${result.id})`);
  }

  console.log('\n✔  Done. Admin pricing panel and calculators are now live.\n');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('\n❌  Seed failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
