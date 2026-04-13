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
exports.createPrototypingOrder = createPrototypingOrder;
exports.listPrototypingOrders = listPrototypingOrders;
exports.getPrototypingOrder = getPrototypingOrder;
exports.updatePrototypingOrder = updatePrototypingOrder;
exports.listUserPrototypingOrders = listUserPrototypingOrders;
exports.getMyOrders = getMyOrders;
exports.trackPrototypingOrder = trackPrototypingOrder;
exports.downloadPrototypingDocument = downloadPrototypingDocument;
const db_1 = __importDefault(require("../db"));
const idGenerator_1 = require("../utils/idGenerator");
const pdfGenerator_1 = require("../utils/pdfGenerator");
// POST /api/prototyping-orders — create new order
function createPrototypingOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { firstName, lastName, email, phone, streetAddress, apartment, city, state, zip, country, serviceType, specifications, specSummary, shippingMethod, shippingCost, pcbPrice, totalAmount, userId, } = req.body;
            // Basic validation
            const required = { firstName, lastName, email, phone, streetAddress, city, state, zip, country };
            const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
            if (missing.length > 0) {
                return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
            }
            // 1. Generate formatted IDs
            const salesOrderId = yield (0, idGenerator_1.generateId)('SO');
            const invoiceId = yield (0, idGenerator_1.generateId)('INV');
            const projectId = yield (0, idGenerator_1.generateId)('PID');
            // Dynamic job ID based on service type
            const jobType = serviceType === '3D Printing' ? '3D' : 'PCB';
            const jobId = yield (0, idGenerator_1.generateId)(jobType);
            const order = yield db_1.default.prototypingOrder.create({
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
        }
        catch (err) {
            console.error('[createPrototypingOrder]', err);
            return res.status(500).json({ error: 'Failed to create order.' });
        }
    });
}
// GET /api/prototyping-orders — admin: list all orders
function listPrototypingOrders(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { status, payment, search, page = '1', limit = '50' } = req.query;
            const pageInt = parseInt(page) || 1;
            const limitInt = Math.min(parseInt(limit) || 50, 100);
            const where = {};
            if (status && status !== 'all')
                where.orderStatus = status.toUpperCase();
            if (payment && payment !== 'all')
                where.paymentStatus = payment.toUpperCase();
            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { orderRef: { contains: search, mode: 'insensitive' } },
                ];
            }
            const [orders, total] = yield Promise.all([
                db_1.default.prototypingOrder.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (pageInt - 1) * limitInt,
                    take: limitInt,
                }),
                db_1.default.prototypingOrder.count({ where }),
            ]);
            return res.json({ orders, total, page: pageInt, totalPages: Math.ceil(total / limitInt) });
        }
        catch (err) {
            console.error('[listPrototypingOrders]', err);
            return res.status(500).json({ error: 'Failed to fetch orders.' });
        }
    });
}
// GET /api/prototyping-orders/:id — admin: get single order detail
function getPrototypingOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const order = yield db_1.default.prototypingOrder.findUnique({ where: { id: req.params.id } });
            if (!order)
                return res.status(404).json({ error: 'Order not found.' });
            return res.json(order);
        }
        catch (err) {
            return res.status(500).json({ error: 'Failed to fetch order.' });
        }
    });
}
// PATCH /api/prototyping-orders/:id — admin: update status / notes / payment
function updatePrototypingOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { orderStatus, paymentStatus, adminNotes } = req.body;
            const updated = yield db_1.default.prototypingOrder.update({
                where: { id: req.params.id },
                data: Object.assign(Object.assign(Object.assign({}, (orderStatus ? { orderStatus } : {})), (paymentStatus ? { paymentStatus } : {})), (adminNotes !== undefined ? { adminNotes } : {})),
            });
            return res.json({ success: true, order: updated });
        }
        catch (err) {
            console.error('[updatePrototypingOrder]', err);
            return res.status(500).json({ error: 'Failed to update order.' });
        }
    });
}
// GET /api/prototyping-orders/user/:userId — customer: list my orders
function listUserPrototypingOrders(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { userId } = req.params;
            const requestingUser = req.user;
            let targetUserId = userId;
            // Security: Force target ID to be the authenticated user's token ID unless SUPER_ADMIN
            if ((requestingUser === null || requestingUser === void 0 ? void 0 : requestingUser.role) !== 'SUPER_ADMIN') {
                if (!(requestingUser === null || requestingUser === void 0 ? void 0 : requestingUser.id)) {
                    return res.status(401).json({ error: 'Invalid token payload missing user ID' });
                }
                targetUserId = requestingUser.id; // Override path parameter forcibly
            }
            const [protoOrders, threeDOrders, laserOrders] = yield Promise.all([
                db_1.default.prototypingOrder.findMany({
                    where: { userId: targetUserId },
                    orderBy: { createdAt: 'desc' },
                }),
                db_1.default.threeDOrder.findMany({
                    where: { userId: targetUserId },
                    include: { file: { include: { config: true } } },
                    orderBy: { createdAt: 'desc' },
                }),
                db_1.default.laserCuttingOrder.findMany({
                    where: { userId: targetUserId },
                    include: { file: { include: { config: true } } },
                    orderBy: { createdAt: 'desc' },
                })
            ]);
            const formattedProto = protoOrders.map(o => (Object.assign(Object.assign({}, o), { serviceType: o.serviceType === 'PCB' ? 'PCB Printing' : 'Custom Prototyping' })));
            const formatted3D = threeDOrders.map(o => {
                var _a, _b, _c, _d;
                return ({
                    id: o.id, orderRef: `3D-${o.id.substring(0, 6).toUpperCase()}`,
                    createdAt: o.createdAt, specSummary: `3D Print: ${(_b = (_a = o.file) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.material} (${(_d = (_c = o.file) === null || _c === void 0 ? void 0 : _c.config) === null || _d === void 0 ? void 0 : _d.finish})`,
                    totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID',
                    serviceType: '3D Printing'
                });
            });
            const formattedLaser = laserOrders.map(o => {
                var _a, _b, _c, _d;
                return ({
                    id: o.id, orderRef: `LC-${o.id.substring(0, 6).toUpperCase()}`,
                    createdAt: o.createdAt, specSummary: `Laser: ${(_b = (_a = o.file) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.material} (${(_d = (_c = o.file) === null || _c === void 0 ? void 0 : _c.config) === null || _d === void 0 ? void 0 : _d.serviceType})`,
                    totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID',
                    serviceType: 'Laser Cutting'
                });
            });
            const allOrders = [...formattedProto, ...formatted3D, ...formattedLaser].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return res.json(allOrders);
        }
        catch (err) {
            console.error('[listUserPrototypingOrders]', err);
            return res.status(500).json({ error: 'Failed to fetch your orders.' });
        }
    });
}
// GET /api/prototyping-orders/my-orders — secure endpoint pulling ID strictly from JWT
function getMyOrders(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            if (!user || !user.id) {
                return res.status(401).json({ error: 'Unauthorized: Missing user payload in token' });
            }
            const [protoOrders, threeDOrders, laserOrders] = yield Promise.all([
                db_1.default.prototypingOrder.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' },
                }),
                db_1.default.threeDOrder.findMany({
                    where: { userId: user.id },
                    include: { file: { include: { config: true } } },
                    orderBy: { createdAt: 'desc' },
                }),
                db_1.default.laserCuttingOrder.findMany({
                    where: { userId: user.id },
                    include: { file: { include: { config: true } } },
                    orderBy: { createdAt: 'desc' },
                })
            ]);
            const formattedProto = protoOrders.map(o => (Object.assign(Object.assign({}, o), { serviceType: o.serviceType === 'PCB' ? 'PCB Printing' : 'Custom Prototyping' })));
            const formatted3D = threeDOrders.map(o => {
                var _a, _b, _c, _d;
                return ({
                    id: o.id, orderRef: `3D-${o.id.substring(0, 6).toUpperCase()}`,
                    createdAt: o.createdAt, specSummary: `3D Print: ${(_b = (_a = o.file) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.material} (${(_d = (_c = o.file) === null || _c === void 0 ? void 0 : _c.config) === null || _d === void 0 ? void 0 : _d.finish})`,
                    totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID',
                    serviceType: '3D Printing',
                    specifications: { fileId: o.fileId }
                });
            });
            const formattedLaser = laserOrders.map(o => {
                var _a, _b, _c, _d;
                return ({
                    id: o.id, orderRef: `LC-${o.id.substring(0, 6).toUpperCase()}`,
                    createdAt: o.createdAt, specSummary: `Laser: ${(_b = (_a = o.file) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.material} (${(_d = (_c = o.file) === null || _c === void 0 ? void 0 : _c.config) === null || _d === void 0 ? void 0 : _d.serviceType})`,
                    totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID',
                    serviceType: 'Laser Cutting'
                });
            });
            const allOrders = [...formattedProto, ...formatted3D, ...formattedLaser].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return res.json(allOrders);
        }
        catch (err) {
            console.error('[getMyOrders]', err);
            return res.status(500).json({ error: 'Failed to fetch personal orders.' });
        }
    });
}
// GET /api/prototyping-orders/track/:orderRef — public: track order by ref
function trackPrototypingOrder(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { orderRef } = req.params;
            const order = yield db_1.default.prototypingOrder.findUnique({
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
            if (!order)
                return res.status(404).json({ error: 'Order not found.' });
            return res.json(order);
        }
        catch (err) {
            console.error('[trackPrototypingOrder]', err);
            return res.status(500).json({ error: 'Failed to track order.' });
        }
    });
}
// GET /api/prototyping-orders/:id/download — secure download endpoints
function downloadPrototypingDocument(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const { id } = req.params;
            const { type } = req.query; // 'INVOICE' or 'SALES_ORDER'
            const order = yield db_1.default.prototypingOrder.findUnique({ where: { id } });
            if (!order)
                return res.status(404).json({ error: 'Order not found.' });
            // ── IDOR Guard ────────────────────────────────────────────────────────────
            // Verify the requesting user owns this order.
            // SUPER_ADMIN may download any order for support / admin purposes.
            const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.userId);
            const userRole = (_c = req.user) === null || _c === void 0 ? void 0 : _c.role;
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
            yield (0, pdfGenerator_1.generateOrderPDF)(res, {
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
            }, type);
        }
        catch (err) {
            console.error('[downloadPrototypingDocument]', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to generate PDF.' });
            }
        }
    });
}
