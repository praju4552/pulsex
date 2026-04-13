import { Request, Response } from 'express';
import prisma from '../db';
import { generateId } from '../utils/idGenerator';
import { generateOrderPDF } from '../utils/pdfGenerator';

// POST /api/prototyping-orders — create new order
export async function createPrototypingOrder(req: Request, res: Response) {
  try {
    const {
      firstName, lastName, email, phone,
      streetAddress, apartment, city, state, zip, country,
      serviceType, specifications, specSummary,
      shippingMethod, shippingCost,
      pcbPrice, totalAmount,
      userId,
    } = req.body;

    // Basic validation
    const required = { firstName, lastName, email, phone, streetAddress, city, state, zip, country };
    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // 1. Generate formatted IDs
    const salesOrderId = await generateId('SO');
    const invoiceId = await generateId('INV');
    const projectId = await generateId('PID');
    
    // Dynamic job ID based on service type
    const jobType = serviceType === '3D Printing' ? '3D' : 'PCB';
    const jobId = await generateId(jobType);

    const order = await prisma.prototypingOrder.create({
      data: {
        firstName, lastName, email, phone,
        streetAddress, apartment: apartment || null,
        city, state, zip, country,
        serviceType: serviceType || 'PCB Printing',
        specifications: specifications || {},
        specSummary: specSummary || '',
        shippingMethod: shippingMethod || 'Standard',
        shippingCost: Math.round(shippingCost || 0),
        pcbPrice: Math.round(pcbPrice || 0),
        totalAmount: Math.round(totalAmount || 0),
        userId: userId || null,
        orderStatus: 'PENDING',
        paymentStatus: 'UNPAID',
        salesOrderId,
        invoiceId,
        projectId,
        jobId,
      },
    });

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        orderRef: order.orderRef,
        orderStatus: order.orderStatus,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error('[createPrototypingOrder]', err);
    return res.status(500).json({ error: 'Failed to create order.' });
  }
}

// GET /api/prototyping-orders — admin: list all orders
export async function listPrototypingOrders(req: Request, res: Response) {
  try {
    const { status, payment, search, page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageInt = parseInt(page) || 1;
    const limitInt = Math.min(parseInt(limit) || 50, 100);

    const where: any = {};
    if (status && status !== 'all') where.orderStatus = status.toUpperCase();
    if (payment && payment !== 'all') where.paymentStatus = payment.toUpperCase();
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { orderRef: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.prototypingOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageInt - 1) * limitInt,
        take: limitInt,
      }),
      prisma.prototypingOrder.count({ where }),
    ]);

    return res.json({ orders, total, page: pageInt, totalPages: Math.ceil(total / limitInt) });
  } catch (err) {
    console.error('[listPrototypingOrders]', err);
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
}

// GET /api/prototyping-orders/:id — admin: get single order detail
export async function getPrototypingOrder(req: Request, res: Response) {
  try {
    const order = await prisma.prototypingOrder.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch order.' });
  }
}

// PATCH /api/prototyping-orders/:id — admin: update status / notes / payment
export async function updatePrototypingOrder(req: Request, res: Response) {
  try {
    const { orderStatus, paymentStatus, adminNotes } = req.body;
    const updated = await prisma.prototypingOrder.update({
      where: { id: req.params.id },
      data: {
        ...(orderStatus ? { orderStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });
    return res.json({ success: true, order: updated });
  } catch (err) {
    console.error('[updatePrototypingOrder]', err);
    return res.status(500).json({ error: 'Failed to update order.' });
  }
}

// GET /api/prototyping-orders/user/:userId — customer: list my orders
export async function listUserPrototypingOrders(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const requestingUser = req.user as any;

    let targetUserId = userId;

    // Security: Force target ID to be the authenticated user's token ID unless SUPER_ADMIN
    if (requestingUser?.role !== 'SUPER_ADMIN') {
      if (!requestingUser?.id) {
        return res.status(401).json({ error: 'Invalid token payload missing user ID' });
      }
      targetUserId = requestingUser.id; // Override path parameter forcibly
    }

    const [protoOrders, threeDOrders, laserOrders] = await Promise.all([
      prisma.prototypingOrder.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.threeDOrder.findMany({
        where: { userId: targetUserId },
        include: { file: { include: { config: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.laserCuttingOrder.findMany({
        where: { userId: targetUserId },
        include: { file: { include: { config: true } } },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    const formattedProto = protoOrders.map(o => ({
      ...o,
      serviceType: o.serviceType === 'PCB' ? 'PCB Printing' : 'Custom Prototyping'
    }));

    const formatted3D = threeDOrders.map(o => ({
      id: o.id, orderRef: `3D-${o.id.substring(0, 6).toUpperCase()}`,
      createdAt: o.createdAt, specSummary: `3D Print: ${o.file?.config?.material} (${o.file?.config?.finish})`,
      totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID',
      serviceType: '3D Printing'
    }));

    const formattedLaser = laserOrders.map(o => ({
      id: o.id, orderRef: `LC-${o.id.substring(0, 6).toUpperCase()}`,
      createdAt: o.createdAt, specSummary: `Laser: ${o.file?.config?.material} (${o.file?.config?.serviceType})`,
      totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID',
      serviceType: 'Laser Cutting'
    }));

    const allOrders = [...formattedProto, ...formatted3D, ...formattedLaser].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json(allOrders);
  } catch (err) {
    console.error('[listUserPrototypingOrders]', err);
    return res.status(500).json({ error: 'Failed to fetch your orders.' });
  }
}

// GET /api/prototyping-orders/my-orders — secure endpoint pulling ID strictly from JWT
export async function getMyOrders(req: Request, res: Response) {
  try {
    const user = req.user as any;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Unauthorized: Missing user payload in token' });
    }

    const [protoOrders, threeDOrders, laserOrders] = await Promise.all([
      prisma.prototypingOrder.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.threeDOrder.findMany({
        where: { userId: user.id },
        include: { file: { include: { config: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.laserCuttingOrder.findMany({
        where: { userId: user.id },
        include: { file: { include: { config: true } } },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    const formattedProto = protoOrders.map(o => ({
      ...o,
      serviceType: o.serviceType === 'PCB' ? 'PCB Printing' : 'Custom Prototyping'
    }));

    const formatted3D = threeDOrders.map(o => ({
      id: o.id, orderRef: `3D-${o.id.substring(0, 6).toUpperCase()}`,
      createdAt: o.createdAt, specSummary: `3D Print: ${o.file?.config?.material} (${o.file?.config?.finish})`,
      totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID',
      serviceType: '3D Printing',
      specifications: { fileId: o.fileId }
    }));

    const formattedLaser = laserOrders.map(o => ({
      id: o.id, orderRef: `LC-${o.id.substring(0, 6).toUpperCase()}`,
      createdAt: o.createdAt, specSummary: `Laser: ${o.file?.config?.material} (${o.file?.config?.serviceType})`,
      totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID',
      serviceType: 'Laser Cutting'
    }));

    const allOrders = [...formattedProto, ...formatted3D, ...formattedLaser].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.json(allOrders);
  } catch (err) {
    console.error('[getMyOrders]', err);
    return res.status(500).json({ error: 'Failed to fetch personal orders.' });
  }
}

// GET /api/prototyping-orders/track/:orderRef — public: track order by ref
export async function trackPrototypingOrder(req: Request, res: Response) {
  try {
    const { orderRef } = req.params;
    const order = await prisma.prototypingOrder.findUnique({
      where: { orderRef },
      select: {
        id: true,
        orderRef: true,
        orderStatus: true,
        paymentStatus: true,
        createdAt: true,
        updatedAt: true,
        serviceType: true,
        specSummary: true,
        totalAmount: true,
        firstName: true,
        lastName: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    return res.json(order);
  } catch (err) {
    console.error('[trackPrototypingOrder]', err);
    return res.status(500).json({ error: 'Failed to track order.' });
  }
}

// GET /api/prototyping-orders/:id/download — secure download endpoints
export async function downloadPrototypingDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { type } = req.query; // 'INVOICE' or 'SALES_ORDER'

    const order = await prisma.prototypingOrder.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // ── IDOR Guard ────────────────────────────────────────────────────────────
    // Verify the requesting user owns this order.
    // SUPER_ADMIN may download any order for support / admin purposes.
    const userId   = (req as any).user?.id || (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    if (order.userId !== userId && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Forbidden: You do not have access to this document.'
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const filename = type === 'SALES_ORDER' 
      ? `SalesOrder_${order.salesOrderId}.pdf` 
      : `Invoice_${order.invoiceId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await generateOrderPDF(res, {
      salesOrderId: order.salesOrderId || 'N/A',
      invoiceId: order.invoiceId || 'N/A',
      projectId: order.projectId || 'N/A',
      jobId: order.jobId || 'N/A',
      createdAt: order.createdAt,
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      phone: order.phone,
      streetAddress: order.streetAddress,
      apartment: order.apartment || undefined,
      city: order.city,
      state: order.state,
      zip: order.zip,
      country: order.country,
      serviceType: order.serviceType,
      specSummary: order.specSummary,
      totalAmount: order.totalAmount,
      shippingCost: order.shippingCost,
      pcbPrice: order.pcbPrice,
      status: order.orderStatus,
    }, (type as any));

  } catch (err) {
    console.error('[downloadPrototypingDocument]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF.' });
    }
  }
}

