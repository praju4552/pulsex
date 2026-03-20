import { Request, Response } from 'express';
import path from 'path';
import prisma from '../db';

// ── Create a service inquiry (SEM/TEM or Project Dev) ──────────────────────────

export const createInquiry = async (req: Request, res: Response) => {
  try {
    const { serviceType, inquiryType, name, email, phone, requirements } = req.body;
    const file = req.file;

    // Validate required fields
    const missing: string[] = [];
    if (!serviceType) missing.push('serviceType');
    if (!inquiryType) missing.push('inquiryType');
    if (!name) missing.push('name');
    if (!email) missing.push('email');
    if (!phone) missing.push('phone');
    if (!requirements) missing.push('requirements');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    // Validate enums
    if (!['SEM_TEM', 'PROJECT_DEV', 'PCB_DESIGN'].includes(serviceType)) {
      return res.status(400).json({ success: false, error: 'serviceType must be SEM_TEM, PROJECT_DEV, or PCB_DESIGN' });
    }
    if (!['REQUEST_CALLBACK', 'GET_QUOTE'].includes(inquiryType)) {
      return res.status(400).json({ success: false, error: 'inquiryType must be REQUEST_CALLBACK or GET_QUOTE' });
    }

    const inquiry = await prisma.serviceInquiry.create({
      data: {
        serviceType,
        inquiryType,
        name,
        email,
        phone,
        requirements,
        filePath: file?.path || null,
        fileName: file?.originalname || null,
        status: 'NEW',
      },
    });

    return res.status(201).json({
      success: true,
      message: inquiryType === 'REQUEST_CALLBACK'
        ? 'Your callback request has been submitted. Our team will reach out shortly!'
        : 'Your quote request has been submitted. You will receive a detailed quote via email.',
      inquiryId: inquiry.id,
    });
  } catch (error: any) {
    console.error('[ServiceInquiry createInquiry]', error);
    return res.status(500).json({ success: false, error: 'Failed to submit inquiry.' });
  }
};

// ── List all inquiries (admin) ─────────────────────────────────────────────────

export const listInquiries = async (req: Request, res: Response) => {
  try {
    const { serviceType, status, page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageInt = parseInt(page) || 1;
    const limitInt = Math.min(parseInt(limit) || 50, 100);

    const where: any = {};
    if (serviceType && serviceType !== 'all') where.serviceType = serviceType;
    if (status && status !== 'all') where.status = status;

    const [inquiries, total] = await Promise.all([
      prisma.serviceInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageInt - 1) * limitInt,
        take: limitInt,
      }),
      prisma.serviceInquiry.count({ where }),
    ]);

    return res.json({
      success: true,
      inquiries,
      total,
      page: pageInt,
      totalPages: Math.ceil(total / limitInt),
    });
  } catch (error: any) {
    console.error('[ServiceInquiry listInquiries]', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch inquiries.' });
  }
};

// ── Get single inquiry (admin) ─────────────────────────────────────────────────

export const getInquiry = async (req: Request, res: Response) => {
  try {
    const inquiry = await prisma.serviceInquiry.findUnique({ where: { id: req.params.id } });
    if (!inquiry) return res.status(404).json({ success: false, error: 'Inquiry not found.' });
    return res.json({ success: true, inquiry });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch inquiry.' });
  }
};

// ── Update inquiry status (admin) ──────────────────────────────────────────────

export const updateInquiryStatus = async (req: Request, res: Response) => {
  try {
    const { status, adminNotes } = req.body;

    if (status && !['NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value.' });
    }

    const updated = await prisma.serviceInquiry.update({
      where: { id: req.params.id },
      data: {
        ...(status ? { status } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });

    return res.json({ success: true, inquiry: updated });
  } catch (error: any) {
    console.error('[ServiceInquiry updateInquiryStatus]', error);
    return res.status(500).json({ success: false, error: 'Failed to update inquiry.' });
  }
};

export const downloadAttachment = async (req: Request, res: Response) => {
  try {
    const inquiry = await prisma.serviceInquiry.findUnique({
      where: { id: req.params.id }
    });
    if (!inquiry || !inquiry.filePath) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }
    const absPath = path.resolve(inquiry.filePath);
    return res.sendFile(absPath);
  } catch (error: any) {
    console.error('[ServiceInquiry downloadAttachment]', error);
    return res.status(500).json({ success: false, error: 'Failed to download file.' });
  }
};
