import { Request, Response } from 'express';
import prisma from '../db';
import path from 'path';
import { generateId } from '../utils/idGenerator';

// ── Pricing engine ─────────────────────────────────────────────────────────────

const MATERIAL_RATES: Record<string, { basePer_cm2: number; engravingSurcharge: number }> = {
  // Legacy IDs
  wood_mdf:          { basePer_cm2: 2.5,  engravingSurcharge: 0.50 },
  wood_plywood:      { basePer_cm2: 2.5,  engravingSurcharge: 0.50 },
  hardwood:          { basePer_cm2: 4.0,  engravingSurcharge: 0.50 },
  acrylic_cast:      { basePer_cm2: 5.0,  engravingSurcharge: 0.30 },
  acrylic_extruded:  { basePer_cm2: 4.0,  engravingSurcharge: 0.30 },
  leather:           { basePer_cm2: 6.0,  engravingSurcharge: 0.40 },
  fabric:            { basePer_cm2: 3.0,  engravingSurcharge: 0.60 },
  cork:              { basePer_cm2: 3.0,  engravingSurcharge: 0.60 },
  felt:              { basePer_cm2: 3.0,  engravingSurcharge: 0.60 },
  rubber:            { basePer_cm2: 3.5,  engravingSurcharge: 0.50 },

  // New material picker IDs
  abs_textured:      { basePer_cm2: 4.0,  engravingSurcharge: 0.30 },
  acrylic_2mm:       { basePer_cm2: 3.5,  engravingSurcharge: 0.30 },
  acrylic_3mm:       { basePer_cm2: 4.0,  engravingSurcharge: 0.30 },
  acrylic_4mm:       { basePer_cm2: 4.5,  engravingSurcharge: 0.30 },
  acrylic_5mm:       { basePer_cm2: 5.0,  engravingSurcharge: 0.30 },
  acrylic_6mm:       { basePer_cm2: 5.5,  engravingSurcharge: 0.30 },
  mdf:               { basePer_cm2: 2.5,  engravingSurcharge: 0.50 },
  mirror_acrylic:    { basePer_cm2: 6.0,  engravingSurcharge: 0.25 },
  polycarbonate:     { basePer_cm2: 5.5,  engravingSurcharge: 0.35 },
};


async function calculateLaserPrice(params: {
  serviceType: string;
  material: string;
  thickness: number;
  width: number;
  height: number;
  quantity: number;
  urgency: string;
}) {
  const config = await prisma.pricingConfig.findUnique({ where: { key: 'laser_pricing' } });
  const rates = (config?.value as any) || MATERIAL_RATES;
  
  const rate = rates[params.material];
  if (!rate) throw new Error(`Unknown material: ${params.material}`);

  const areaCm2 = (params.width / 10) * (params.height / 10); // mm → cm
  let unitPrice = rate.basePer_cm2 * areaCm2;

  // Engraving surcharge
  if (params.serviceType === 'engraving' || params.serviceType === 'both') {
    unitPrice *= (1 + rate.engravingSurcharge);
  }

  // Thickness surcharge (>10mm)
  if (params.thickness > 10) {
    unitPrice *= 1.5;
  }

  // Minimum order price
  unitPrice = Math.max(unitPrice, 50); // ₹50 minimum per unit

  const subtotal = unitPrice * params.quantity;

  // Rush surcharge
  const rushMultiplier = params.urgency === 'rush_24h' ? 2.0 : 1.0;
  const total = subtotal * rushMultiplier;

  return {
    unitPrice: Math.round(unitPrice * 100), // paise
    subtotal: Math.round(subtotal * 100),
    rushMultiplier,
    total: Math.round(total * 100),
    breakdown: {
      areaCm2: Math.round(areaCm2 * 100) / 100,
      baseRate: rate.basePer_cm2,
      engravingSurcharge: (params.serviceType === 'engraving' || params.serviceType === 'both') ? rate.engravingSurcharge : 0,
      thicknessSurcharge: params.thickness > 10 ? 0.5 : 0,
      rush: params.urgency === 'rush_24h',
    },
  };
}

// ── Upload design file ─────────────────────────────────────────────────────────

export const uploadDesign = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const userId = req.body.userId;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const dbFile = await prisma.laserCuttingFile.create({
      data: {
        userId: userId || null,
        filePath: file.path,
        fileName: file.originalname,
        fileType: path.extname(file.originalname).toLowerCase().replace('.', ''),
        fileSize: file.size,
        uploadStatus: 'UPLOADED',
      },
    });

    return res.json({
      success: true,
      message: 'Design file uploaded successfully',
      fileId: dbFile.id,
      fileName: dbFile.fileName,
    });
  } catch (error: any) {
    console.error('[LaserCutting uploadDesign]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get file status ────────────────────────────────────────────────────────────

export const getFileStatus = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await prisma.laserCuttingFile.findUnique({
      where: { id: fileId },
      include: { config: true },
    });

    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    return res.json({ success: true, file });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── Calculate price ────────────────────────────────────────────────────────────

export const calculatePriceEndpoint = async (req: Request, res: Response) => {
  try {
    const { serviceType, material, thickness, width, height, quantity, urgency } = req.body;

    if (!serviceType || !material || !thickness || !width || !height) {
      return res.status(400).json({ success: false, error: 'Missing required fields: serviceType, material, thickness, width, height' });
    }

    const pricing = await calculateLaserPrice({
      serviceType,
      material,
      thickness: parseFloat(thickness),
      width: parseFloat(width),
      height: parseFloat(height),
      quantity: parseInt(quantity) || 1,
      urgency: urgency || 'standard',
    });

    return res.json({ success: true, pricing, materials: Object.keys(MATERIAL_RATES) });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

// ── Create order ───────────────────────────────────────────────────────────────

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId, fileId, config, price, quantity, customerInfo, shippingInfo } = req.body;

    // Validate
    if (!fileId || !config || !customerInfo || !shippingInfo) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // 1. Create config
    const dbConfig = await prisma.laserCuttingConfig.create({
      data: {
        fileId,
        serviceType: config.serviceType,
        material: config.material,
        thickness: parseFloat(config.thickness),
        width: parseFloat(config.width),
        height: parseFloat(config.height),
        quantity: parseInt(config.quantity) || 1,
        finish: config.finish || 'standard',
        urgency: config.urgency || 'standard',
      },
    });

    // 2. Create laser-specific order
    const laserOrder = await prisma.laserCuttingOrder.create({
      data: {
        userId: userId || null,
        fileId,
        configId: dbConfig.id,
        price,
        quantity: quantity || 1,
        status: 'PENDING',
      },
    });

    // 3. Generate IDs for unified order
    const salesOrderId = await generateId('SO');
    const invoiceId = await generateId('INV');
    const projectId = await generateId('PID');
    const jobId = await generateId('LC');

    // 4. Create unified PrototypingOrder entry (visible in admin dashboard)
    const protoOrder = await prisma.prototypingOrder.create({
      data: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        streetAddress: shippingInfo.streetAddress,
        apartment: shippingInfo.apartment,
        city: shippingInfo.city,
        state: shippingInfo.state,
        zip: shippingInfo.zip,
        country: shippingInfo.country,
        serviceType: 'Laser Cutting',
        specifications: {
          laserOrderId: laserOrder.id,
          fileId,
          ...config,
          quantity: quantity || 1,
        },
        specSummary: `Laser ${config.serviceType}: ${config.material}, ${config.width}×${config.height}mm, ${config.thickness}mm thick`,
        shippingMethod: shippingInfo.method || 'Standard',
        shippingCost: Math.round(shippingInfo.cost || 0),
        pcbPrice: price,
        totalAmount: price + Math.round(shippingInfo.cost || 0),
        orderStatus: 'PENDING',
        paymentStatus: 'UNPAID',
        userId: userId || null,
        salesOrderId,
        invoiceId,
        projectId,
        jobId,
      },
    });

    return res.json({
      success: true,
      orderId: protoOrder.id,
      orderRef: protoOrder.orderRef,
      laserOrderId: laserOrder.id,
    });
  } catch (error: any) {
    console.error('[LaserCutting createOrder]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ── Get available materials (for frontend dropdown) ────────────────────────────

export const getMaterials = async (_req: Request, res: Response) => {
  try {
    const config = await prisma.pricingConfig.findUnique({ where: { key: 'laser_pricing' } });
    const rates = (config?.value as any) || MATERIAL_RATES;

    const materials = Object.entries(rates).map(([key, val]: any) => ({
      id: key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      basePer_cm2: val.basePer_cm2,
      engravingSurcharge: val.engravingSurcharge,
    }));
    return res.json({ success: true, materials });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch materials.' });
  }
};
