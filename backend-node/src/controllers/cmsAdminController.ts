import { Request, Response } from 'express';
import prisma from '../db';

// GET /api/cms-admin/stats — dashboard overview
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      totalUsers,
      totalInquiries,
      recentOrders,
      recentInquiries,
    ] = await Promise.all([
      prisma.prototypingOrder.count(),
      prisma.prototypingOrder.count({ where: { orderStatus: 'PENDING' } }),
      prisma.prototypingOrder.count({ where: { orderStatus: 'IN_PRODUCTION' } }),
      prisma.prototypingOrder.count({ where: { orderStatus: 'DELIVERED' } }),
      prisma.prototypingOrder.count({ where: { orderStatus: 'CANCELLED' } }),
      prisma.prototypingOrder.aggregate({ _sum: { totalAmount: true } }),
      prisma.prototypingUser.count(),
      prisma.serviceInquiry.count(),
      prisma.prototypingOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.serviceInquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalUsers,
        totalInquiries,
      },
      recentOrders,
      recentInquiries,
    });
  } catch (error: any) {
    console.error('[getDashboardStats]', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats.' });
  }
};

// GET /api/cms-admin/users — list all users
export const listUsers = async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageInt = parseInt(page) || 1;
    const limitInt = Math.min(parseInt(limit) || 50, 100);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.prototypingUser.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageInt - 1) * limitInt,
        take: limitInt,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          credits: true,
          createdAt: true,
        },
      }),
      prisma.prototypingUser.count({ where }),
    ]);

    return res.json({ success: true, users, total, page: pageInt, totalPages: Math.ceil(total / limitInt) });
  } catch (error: any) {
    console.error('[listUsers]', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
};

// GET /api/cms-admin/users/:id — get user + their orders
export const getUserDetail = async (req: Request, res: Response) => {
  try {
    const user = await prisma.prototypingUser.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true, credits: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    const orders = await prisma.prototypingOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, user, orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch user.' });
  }
};

// Default structures modeled after the hardcoded values for fallback initialization
const DEFAULT_PRICING: Record<string, any> = {
  "3d_pricing": {
    "materials": [
      { "id": "pla", "name": "PLA", "density": 1.24, "baseCost": 1.5, "desc": "Eco-friendly, easy to print" },
      { "id": "abs", "name": "ABS", "density": 1.04, "baseCost": 1.8, "desc": "Tough, heat resistant" },
      { "id": "petg", "name": "PETG", "density": 1.27, "baseCost": 2.0, "desc": "Strong, chemically resistant" },
      { "id": "resin", "name": "Resin", "density": 1.15, "baseCost": 5.0, "desc": "Ultra high detail" }
    ],
    "qualities": [
      { "id": "draft", "name": "Draft", "layerHeight": 0.3, "costMult": 0.8 },
      { "id": "standard", "name": "Standard", "layerHeight": 0.2, "costMult": 1.0 },
      { "id": "high", "name": "High Precision", "layerHeight": 0.1, "costMult": 1.5 }
    ],
    "finishes": [
      { "id": "raw", "name": "Raw", "cost": 0 },
      { "id": "sanded", "name": "Sanded", "cost": 50 },
      { "id": "polished", "name": "Polished", "cost": 100 },
      { "id": "painted", "name": "Painted", "cost": 150 }
    ]
  },
  "laser_pricing": {
    "wood_mdf": { "basePer_cm2": 0.12, "engravingSurcharge": 0.15 },
    "wood_plywood": { "basePer_cm2": 0.15, "engravingSurcharge": 0.15 },
    "hardwood": { "basePer_cm2": 0.25, "engravingSurcharge": 0.20 },
    "acrylic_cast": { "basePer_cm2": 0.30, "engravingSurcharge": 0.10 },
    "acrylic_extruded": { "basePer_cm2": 0.22, "engravingSurcharge": 0.10 }
  },
  "pcb_pricing": {
    "baseFor5": 744,
    "setupFee": 600,
    "areaMult": 0.11624,
    "extraDrc": 75,
    "layerMult": { "1": 1, "2": 1, "4": 2.8, "6": 4.5, "8": 7, "10": 11, "12": 16, "14": 22, "16": 30 },
    "materialMult": { "Rogers": 3.5, "Aluminum": 1.6, "Copper Core": 2.0, "Flex": 1.8, "PTFE Teflon": 4.0 },
    "surcharges": {
      "thickness_0.4mm": 640,
      "thickness_0.6mm": 320,
      "color_not_green": 1260,
      "finish_ENIG": 400,
      "finish_LeadFree HASL": 160,
      "copper_2oz": 800,
      "copper_2.5oz": 1440,
      "copper_3.5oz": 2240,
      "copper_4.5oz": 3200
    }
  }
};

// GET /api/cms-admin/pricing
export const getPricingConfigs = async (_req: Request, res: Response) => {
  try {
    const configs = await prisma.pricingConfig.findMany();
    const result: Record<string, any> = {};
    
    // Map existing
    configs.forEach(c => { result[c.key] = c.value; });

    // Seed/Fallback defaults if missing
    for (const key of Object.keys(DEFAULT_PRICING)) {
      if (!result[key]) {
        // Initialize in DB so fully manageable going forward
        const created = await prisma.pricingConfig.create({
          data: { key, value: DEFAULT_PRICING[key] }
        });
        result[key] = created.value;
      }
    }

    return res.json({ success: true, pricing: result });
  } catch (error: any) {
    console.error('[getPricingConfigs]', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch pricing configs.' });
  }
};

// PATCH /api/cms-admin/pricing
export const updatePricingConfig = async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || !value) return res.status(400).json({ success: false, error: 'Key and Value are required.' });

    const updated = await prisma.pricingConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    return res.json({ success: true, message: 'Pricing config updated.', config: updated });
  } catch (error: any) {
    console.error('[updatePricingConfig]', error);
    return res.status(500).json({ success: false, error: 'Failed to update pricing config.' });
  }
};

// GET /api/pricing/:key — Public fetching for calculator fallback/hydration
export const getPublicPriceConfig = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const config = await prisma.pricingConfig.findUnique({ where: { key } });
    
    if (!config) {
      if (DEFAULT_PRICING[key]) {
        return res.json({ success: true, value: DEFAULT_PRICING[key] });
      }
      return res.status(404).json({ success: false, error: 'Pricing config not found.' });
    }

    return res.json({ success: true, value: config.value });
  } catch (error: any) {
    console.error('[getPublicPriceConfig]', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch pricing config.' });
  }
};

