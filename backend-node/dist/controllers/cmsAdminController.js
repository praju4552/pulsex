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
exports.getPublicPriceConfig = exports.updatePricingConfig = exports.getPricingConfigs = exports.getUserDetail = exports.listUsers = exports.getAllPayments = exports.getAllOrders = exports.getDashboardStats = void 0;
const db_1 = __importDefault(require("../db"));
// GET /api/cms-admin/stats — dashboard overview
const getDashboardStats = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalProto, pendingProto, inProgressProto, completedProto, cancelledProto, revenueProto, total3D, pending3D, inProgress3D, completed3D, cancelled3D, revenue3D, totalLaser, pendingLaser, inProgressLaser, completedLaser, cancelledLaser, revenueLaser, totalUsers, totalInquiries, recentProto, recentInquiries] = yield Promise.all([
            // Prototyping
            db_1.default.prototypingOrder.count(),
            db_1.default.prototypingOrder.count({ where: { orderStatus: 'PENDING' } }),
            db_1.default.prototypingOrder.count({ where: { orderStatus: 'IN_PRODUCTION' } }),
            db_1.default.prototypingOrder.count({ where: { orderStatus: 'DELIVERED' } }),
            db_1.default.prototypingOrder.count({ where: { orderStatus: 'CANCELLED' } }),
            db_1.default.prototypingOrder.aggregate({ _sum: { totalAmount: true } }),
            // 3D
            db_1.default.threeDOrder.count(),
            db_1.default.threeDOrder.count({ where: { status: 'PENDING' } }),
            db_1.default.threeDOrder.count({ where: { status: 'IN_PRODUCTION' } }),
            db_1.default.threeDOrder.count({ where: { status: 'DELIVERED' } }),
            db_1.default.threeDOrder.count({ where: { status: 'CANCELLED' } }),
            db_1.default.threeDOrder.aggregate({ _sum: { price: true } }),
            // Laser
            db_1.default.laserCuttingOrder.count(),
            db_1.default.laserCuttingOrder.count({ where: { status: 'PENDING' } }),
            db_1.default.laserCuttingOrder.count({ where: { status: 'IN_PRODUCTION' } }),
            db_1.default.laserCuttingOrder.count({ where: { status: 'DELIVERED' } }),
            db_1.default.laserCuttingOrder.count({ where: { status: 'CANCELLED' } }),
            db_1.default.laserCuttingOrder.aggregate({ _sum: { price: true } }),
            // Users & Inquiries
            db_1.default.prototypingUser.count(),
            db_1.default.serviceInquiry.count(),
            db_1.default.prototypingOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
            db_1.default.serviceInquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
        ]);
        const totalOrders = totalProto + total3D + totalLaser;
        const pendingOrders = pendingProto + pending3D + pendingLaser;
        const inProgressOrders = inProgressProto + inProgress3D + inProgressLaser;
        const completedOrders = completedProto + completed3D + completedLaser;
        const cancelledOrders = cancelledProto + cancelled3D + cancelledLaser;
        const totalRevenueCents = (revenueProto._sum.totalAmount || 0) + (revenue3D._sum.price || 0) + (revenueLaser._sum.price || 0);
        return res.json({
            success: true,
            stats: {
                totalOrders,
                pendingOrders,
                inProgressOrders,
                completedOrders,
                cancelledOrders,
                totalRevenue: totalRevenueCents,
                totalUsers,
                totalInquiries,
            },
            recentOrders: recentProto,
            recentInquiries,
        });
    }
    catch (error) {
        console.error('[getDashboardStats]', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch stats.' });
    }
});
exports.getDashboardStats = getDashboardStats;
// GET /api/cms-admin/orders — list all aggregated orders
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, status, payment, page = '1', limit = '25' } = req.query;
        const pageInt = parseInt(page) || 1;
        const limitInt = Math.min(parseInt(limit) || 25, 100);
        const [protoOrders, threeDOrders, laserOrders] = yield Promise.all([
            db_1.default.prototypingOrder.findMany({
                orderBy: { createdAt: 'desc' }
            }),
            db_1.default.threeDOrder.findMany({
                include: { user: true, file: { include: { config: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            db_1.default.laserCuttingOrder.findMany({
                include: { user: true, file: { include: { config: true } } },
                orderBy: { createdAt: 'desc' }
            })
        ]);
        const formattedProto = protoOrders.map(o => (Object.assign(Object.assign({}, o), { firstName: o.firstName, lastName: o.lastName, orderStatus: o.orderStatus, totalAmount: o.totalAmount, serviceType: o.serviceType === 'PCB' ? 'PCB Printing' : 'Custom Prototyping' })));
        const formatted3D = threeDOrders.map(o => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return ({
                id: o.id, orderRef: `3D-${o.id.substring(0, 6).toUpperCase()}`,
                firstName: ((_b = (_a = o.user) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.split(' ')[0]) || 'Unknown', lastName: ((_d = (_c = o.user) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.split(' ').slice(1).join(' ')) || '', email: ((_e = o.user) === null || _e === void 0 ? void 0 : _e.email) || '', phone: ((_f = o.user) === null || _f === void 0 ? void 0 : _f.phone) || '',
                createdAt: o.createdAt, specSummary: `3D Print: ${(_h = (_g = o.file) === null || _g === void 0 ? void 0 : _g.config) === null || _h === void 0 ? void 0 : _h.material} (${(_k = (_j = o.file) === null || _j === void 0 ? void 0 : _j.config) === null || _k === void 0 ? void 0 : _k.finish})`,
                totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID', // Modify if tracking payment status in 3D order natively
                serviceType: '3D Printing'
            });
        });
        const formattedLaser = laserOrders.map(o => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return ({
                id: o.id, orderRef: `LC-${o.id.substring(0, 6).toUpperCase()}`,
                firstName: ((_b = (_a = o.user) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.split(' ')[0]) || 'Unknown', lastName: ((_d = (_c = o.user) === null || _c === void 0 ? void 0 : _c.name) === null || _d === void 0 ? void 0 : _d.split(' ').slice(1).join(' ')) || '', email: ((_e = o.user) === null || _e === void 0 ? void 0 : _e.email) || '', phone: ((_f = o.user) === null || _f === void 0 ? void 0 : _f.phone) || '',
                createdAt: o.createdAt, specSummary: `Laser: ${(_h = (_g = o.file) === null || _g === void 0 ? void 0 : _g.config) === null || _h === void 0 ? void 0 : _h.material} (${(_k = (_j = o.file) === null || _j === void 0 ? void 0 : _j.config) === null || _k === void 0 ? void 0 : _k.serviceType})`,
                totalAmount: o.price, orderStatus: o.status, paymentStatus: 'PAID',
                serviceType: 'Laser Cutting'
            });
        });
        let allOrders = [...formattedProto, ...formatted3D, ...formattedLaser].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (search) {
            const s = search.toLowerCase();
            allOrders = allOrders.filter(o => {
                var _a, _b, _c, _d;
                return ((_a = o.orderRef) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(s)) ||
                    ((_b = o.firstName) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(s)) ||
                    ((_c = o.lastName) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(s)) ||
                    ((_d = o.email) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(s));
            });
        }
        if (status && status !== 'all')
            allOrders = allOrders.filter(o => o.orderStatus === status);
        if (payment && payment !== 'all')
            allOrders = allOrders.filter(o => o.paymentStatus === payment);
        const total = allOrders.length;
        const paginated = allOrders.slice((pageInt - 1) * limitInt, pageInt * limitInt);
        return res.json({ success: true, orders: paginated, total, page: pageInt, totalPages: Math.ceil(total / limitInt) });
    }
    catch (error) {
        console.error('[getAllOrders]', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch all orders.' });
    }
});
exports.getAllOrders = getAllOrders;
// GET /api/cms-admin/payments — list raw Razorpay records
const getAllPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, status, page = '1', limit = '50' } = req.query;
        const pageInt = parseInt(page) || 1;
        const limitInt = Math.min(parseInt(limit) || 50, 100);
        const where = {};
        if (search) {
            where.OR = [
                { razorpayOrderId: { contains: search, mode: 'insensitive' } },
                { razorpayPaymentId: { contains: search, mode: 'insensitive' } },
                { orderType: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status && status !== 'all') {
            where.status = status;
        }
        const [payments, total] = yield Promise.all([
            db_1.default.payment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (pageInt - 1) * limitInt,
                take: limitInt,
            }),
            db_1.default.payment.count({ where }),
        ]);
        return res.json({ success: true, payments, total, page: pageInt, totalPages: Math.ceil(total / limitInt) });
    }
    catch (error) {
        console.error('[getAllPayments]', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch payments.' });
    }
});
exports.getAllPayments = getAllPayments;
// GET /api/cms-admin/users — list all users
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, page = '1', limit = '50' } = req.query;
        const pageInt = parseInt(page) || 1;
        const limitInt = Math.min(parseInt(limit) || 50, 100);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = yield Promise.all([
            db_1.default.prototypingUser.findMany({
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
            db_1.default.prototypingUser.count({ where }),
        ]);
        return res.json({ success: true, users, total, page: pageInt, totalPages: Math.ceil(total / limitInt) });
    }
    catch (error) {
        console.error('[listUsers]', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch users.' });
    }
});
exports.listUsers = listUsers;
// GET /api/cms-admin/users/:id — get user + their orders
const getUserDetail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield db_1.default.prototypingUser.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, email: true, phone: true, role: true, credits: true, createdAt: true,
            },
        });
        if (!user)
            return res.status(404).json({ success: false, error: 'User not found.' });
        const orders = yield db_1.default.prototypingOrder.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        });
        return res.json({ success: true, user, orders });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Failed to fetch user.' });
    }
});
exports.getUserDetail = getUserDetail;
// Default structures modeled after the hardcoded values for fallback initialization
const DEFAULT_PRICING = {
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
const getPricingConfigs = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const configs = yield db_1.default.pricingConfig.findMany();
        const result = {};
        // Map existing
        configs.forEach(c => { result[c.key] = c.value; });
        // Seed/Fallback defaults if missing
        for (const key of Object.keys(DEFAULT_PRICING)) {
            if (!result[key]) {
                // Initialize in DB so fully manageable going forward
                const created = yield db_1.default.pricingConfig.create({
                    data: { key, value: DEFAULT_PRICING[key] }
                });
                result[key] = created.value;
            }
        }
        return res.json({ success: true, pricing: result });
    }
    catch (error) {
        console.error('[getPricingConfigs]', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch pricing configs.' });
    }
});
exports.getPricingConfigs = getPricingConfigs;
// PATCH /api/cms-admin/pricing
const updatePricingConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key, value } = req.body;
        if (!key || !value)
            return res.status(400).json({ success: false, error: 'Key and Value are required.' });
        const updated = yield db_1.default.pricingConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        return res.json({ success: true, message: 'Pricing config updated.', config: updated });
    }
    catch (error) {
        console.error('[updatePricingConfig]', error);
        return res.status(500).json({ success: false, error: 'Failed to update pricing config.' });
    }
});
exports.updatePricingConfig = updatePricingConfig;
// GET /api/pricing/:key — Public fetching for calculator fallback/hydration
const getPublicPriceConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.params;
        const config = yield db_1.default.pricingConfig.findUnique({ where: { key } });
        if (!config) {
            if (DEFAULT_PRICING[key]) {
                return res.json({ success: true, value: DEFAULT_PRICING[key] });
            }
            return res.status(404).json({ success: false, error: 'Pricing config not found.' });
        }
        return res.json({ success: true, value: config.value });
    }
    catch (error) {
        console.error('[getPublicPriceConfig]', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch pricing config.' });
    }
});
exports.getPublicPriceConfig = getPublicPriceConfig;
