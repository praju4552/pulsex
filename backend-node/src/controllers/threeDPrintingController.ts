import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { ThreeDService } from '../services/threeDService';

const prisma = new PrismaClient();

export const uploadAndProcess = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const userId = req.body.userId; // Optional, for logged in users

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // 1. Create file record in DB
    const dbFile = await prisma.threeDFile.create({
      data: {
        userId: userId || null,
        filePath: file.path,
        fileType: path.extname(file.originalname).toLowerCase(),
        fileSize: file.size,
        uploadStatus: 'PROCESSING',
      },
    });

    // 2. Trigger asynchronous processing (to fulfill non-blocking requirement)
    // In production with Redis, this would be a BullMQ job.
    // Here we use an async wrapper that doesn't block the response.
    processMeshInBackground(dbFile.id, file.path, dbFile.fileType);

    return res.json({
      success: true,
      message: 'File uploaded and processing started',
      fileId: dbFile.id,
    });
  } catch (error: any) {
    console.error('3D Upload Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

const processMeshInBackground = async (fileId: string, filePath: string, fileType: string) => {
  try {
    const metadata = await ThreeDService.getMetadata(filePath, fileType);

    await prisma.threeDMetadata.create({
      data: {
        fileId,
        volume: metadata.volume,
        surfaceArea: metadata.surfaceArea,
        width: metadata.width,
        height: metadata.height,
        depth: metadata.depth,
        triangleCount: metadata.triangleCount,
        estimatedPrintTime: metadata.estimatedPrintTime,
      },
    });

    await prisma.threeDFile.update({
      where: { id: fileId },
      data: { uploadStatus: 'COMPLETED' },
    });

    console.log(`Processing completed for file: ${fileId}`);
  } catch (error) {
    console.error(`Background processing failed for ${fileId}:`, error);
    await prisma.threeDFile.update({
      where: { id: fileId },
      data: { uploadStatus: 'FAILED' },
    });
  }
};

export const getFileStatus = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await prisma.threeDFile.findUnique({
      where: { id: fileId },
      include: { metadata: true },
    });

    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    return res.json({ success: true, file });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId, fileId, config, price, quantity, customerInfo, shippingInfo } = req.body;

    // 1. Create Config
    const dbConfig = await prisma.threeDPrintConfig.create({
      data: {
        fileId,
        material: config.material,
        infill: config.infill,
        scale: config.scale || 1.0,
        layerHeight: config.layerHeight,
        finish: config.finish,
        color: config.color,
      },
    });

    // 2. Create 3D specific order
    const threeDOrder = await prisma.threeDOrder.create({
      data: {
        userId: userId || null,
        fileId,
        configId: dbConfig.id,
        price,
        quantity: quantity || 1,
        status: 'PENDING',
      },
    });

    // 3. Integrate with the GENERAL PrototypingOrder table (as requested: "Orders must automatically map to SuperAdmin")
    // This ensures it shows up in the existing admin dashboard which polls `prototyping-orders`
    const orderRef = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const protoOrder = await prisma.prototypingOrder.create({
      data: {
        orderRef,
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
        serviceType: '3D Printing',
        specifications: {
            threeDOrderId: threeDOrder.id,
            fileId: fileId, // Explicitly include fileId for admin download
            ...config,
            quantity: quantity || 1
        },
        specSummary: `3D Print: ${config.material}, ${config.infill}% infill, ${config.finish} finish`,
        shippingMethod: shippingInfo.method,
        shippingCost: shippingInfo.cost,
        pcbPrice: price, // Reusing field for base price
        totalAmount: price + shippingInfo.cost,
        orderStatus: 'PENDING',
        paymentStatus: 'UNPAID',
        userId: userId || null,
      },
    });

    return res.json({ success: true, orderId: protoOrder.id, orderRef: protoOrder.orderRef });
  } catch (error: any) {
    console.error('Order Creation Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await prisma.threeDFile.findUnique({
      where: { id: fileId },
    });

    if (!file || !fs.existsSync(file.filePath)) {
      return res.status(404).json({ success: false, error: 'File not found on server' });
    }

    const fileName = path.basename(file.filePath);
    res.download(file.filePath, fileName);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
