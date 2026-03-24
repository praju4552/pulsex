"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadAttachment = exports.updateInquiryStatus = exports.getInquiry = exports.listInquiries = exports.createInquiry = void 0;
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("../db"));
// ── Create a service inquiry (SEM/TEM or Project Dev) ──────────────────────────
const createInquiry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceType, inquiryType, name, email, phone, requirements } = req.body;
        const file = req.file;
        // Validate required fields
        const missing = [];
        if (!serviceType)
            missing.push('serviceType');
        if (!inquiryType)
            missing.push('inquiryType');
        if (!name)
            missing.push('name');
        if (!email)
            missing.push('email');
        if (!phone)
            missing.push('phone');
        if (!requirements)
            missing.push('requirements');
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${missing.join(', ')}`,
            });
        }
        // Validate enums
        if (!['SEM_TEM', 'PROJECT_DEV', 'PCB_DESIGN', 'SUPPORT'].includes(serviceType)) {
            return res.status(400).json({ success: false, error: 'Invalid serviceType' });
        }
        if (!['REQUEST_CALLBACK', 'GET_QUOTE', 'SUPPORT_REQUEST'].includes(inquiryType)) {
            return res.status(400).json({ success: false, error: 'Invalid inquiryType' });
        }
        const inquiry = yield db_1.default.serviceInquiry.create({
            data: {
                serviceType,
                inquiryType,
                name,
                email,
                phone,
                requirements,
                filePath: (file === null || file === void 0 ? void 0 : file.path) || null,
                fileName: (file === null || file === void 0 ? void 0 : file.originalname) || null,
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
    }
    catch (error) {
        console.error('[ServiceInquiry createInquiry]', error);
        return res.status(500).json({ success: false, error: 'Failed to submit inquiry.' });
    }
});
exports.createInquiry = createInquiry;
// ── List all inquiries (admin) ─────────────────────────────────────────────────
const listInquiries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serviceType, status, page = '1', limit = '50' } = req.query;
        const pageInt = parseInt(page) || 1;
        const limitInt = Math.min(parseInt(limit) || 50, 100);
        const where = {};
        if (serviceType && serviceType !== 'all')
            where.serviceType = serviceType;
        if (status && status !== 'all')
            where.status = status;
        const [inquiries, total] = yield Promise.all([
            db_1.default.serviceInquiry.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (pageInt - 1) * limitInt,
                take: limitInt,
            }),
            db_1.default.serviceInquiry.count({ where }),
        ]);
        return res.json({
            success: true,
            inquiries,
            total,
            page: pageInt,
            totalPages: Math.ceil(total / limitInt),
        });
    }
    catch (error) {
        console.error('[ServiceInquiry listInquiries]', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch inquiries.' });
    }
});
exports.listInquiries = listInquiries;
// ── Get single inquiry (admin) ─────────────────────────────────────────────────
const getInquiry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inquiry = yield db_1.default.serviceInquiry.findUnique({ where: { id: req.params.id } });
        if (!inquiry)
            return res.status(404).json({ success: false, error: 'Inquiry not found.' });
        return res.json({ success: true, inquiry });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch inquiry.' });
    }
});
exports.getInquiry = getInquiry;
// ── Update inquiry status (admin) ──────────────────────────────────────────────
const updateInquiryStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, adminNotes } = req.body;
        if (status && !['NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status value.' });
        }
        const updated = yield db_1.default.serviceInquiry.update({
            where: { id: req.params.id },
            data: Object.assign(Object.assign({}, (status ? { status } : {})), (adminNotes !== undefined ? { adminNotes } : {})),
        });
        return res.json({ success: true, inquiry: updated });
    }
    catch (error) {
        console.error('[ServiceInquiry updateInquiryStatus]', error);
        return res.status(500).json({ success: false, error: 'Failed to update inquiry.' });
    }
});
exports.updateInquiryStatus = updateInquiryStatus;
const downloadAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const inquiry = yield db_1.default.serviceInquiry.findUnique({
            where: { id: req.params.id }
        });
        if (!inquiry || !inquiry.filePath) {
            return res.status(404).json({ success: false, error: 'File not found.' });
        }
        const absPath = path_1.default.resolve(inquiry.filePath);
        return res.sendFile(absPath);
    }
    catch (error) {
        console.error('[ServiceInquiry downloadAttachment]', error);
        return res.status(500).json({ success: false, error: 'Failed to download file.' });
    }
});
exports.downloadAttachment = downloadAttachment;
