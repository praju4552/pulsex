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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrders = exports.confirmCart = exports.placeOrder = exports.saveShippingDetails = exports.getShippingDetails = exports.syncCart = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ─── Sync Cart ────────────────────────────────────────────────────────────────
const syncCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { items } = req.body;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items array' });
        }
        // Find existing PENDING order (the active cart)
        let order = yield prisma.shopOrder.findFirst({
            where: { userId, status: 'PENDING' },
            orderBy: { updatedAt: 'desc' }
        });
        if (!order) {
            // Create a new one if it doesn't exist
            order = yield prisma.shopOrder.create({
                data: {
                    userId,
                    status: 'PENDING',
                    totalItems: 0,
                }
            });
        }
        // Overwrite the items atomically
        yield prisma.$transaction([
            prisma.orderItem.deleteMany({ where: { orderId: order.id } }),
            prisma.orderItem.createMany({
                data: items.map((item) => ({
                    orderId: order.id,
                    productName: item.productName || item.name || 'Unknown Product',
                    category: item.category || 'General',
                    quantity: item.quantity || 1,
                }))
            })
        ]);
        const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
        const updatedOrder = yield prisma.shopOrder.update({
            where: { id: order.id },
            data: { totalItems },
            include: { items: true }
        });
        res.json({ message: 'Cart synced successfully', cart: updatedOrder });
    }
    catch (err) {
        console.error("Sync Cart Error:", err);
        res.status(500).json({ error: 'Failed to sync cart' });
    }
});
exports.syncCart = syncCart;
// ─── Get Shipping Details ─────────────────────────────────────────────────────
const getShippingDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const details = yield prisma.shippingDetails.findUnique({ where: { userId } });
        res.json({ details });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch shipping details' });
    }
});
exports.getShippingDetails = getShippingDetails;
// ─── Save/Update Shipping Details ─────────────────────────────────────────────
const saveShippingDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { fullName, phone, altPhone, email, addressLine1, addressLine2, state, country } = req.body;
        const details = yield prisma.shippingDetails.upsert({
            where: { userId },
            update: { fullName, phone, altPhone, email, addressLine1, addressLine2, state, country },
            create: { userId, fullName, phone, altPhone, email, addressLine1, addressLine2, state, country },
        });
        res.json({ message: 'Shipping details saved', details });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to save shipping details' });
    }
});
exports.saveShippingDetails = saveShippingDetails;
// ─── Place Order ──────────────────────────────────────────────────────────────
const placeOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { items, notes } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }
        const order = yield prisma.shopOrder.create({
            data: {
                userId,
                notes,
                totalItems: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
                items: {
                    create: items.map((item) => ({
                        productName: item.productName,
                        category: item.category || 'General',
                        quantity: item.quantity || 1,
                    })),
                },
            },
            include: { items: true },
        });
        res.json({ message: 'Order placed successfully', order });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to place order' });
    }
});
exports.placeOrder = placeOrder;
// ─── Confirm Cart (Place Order) ──────────────────────────────────────────────
const confirmCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const pendingOrder = yield prisma.shopOrder.findFirst({
            where: { userId, status: 'PENDING' },
            include: { items: true },
            orderBy: { updatedAt: 'desc' }
        });
        if (!pendingOrder) {
            return res.status(404).json({ error: 'No active cart found' });
        }
        // Promote it to CONFIRMED
        const updatedOrder = yield prisma.shopOrder.update({
            where: { id: pendingOrder.id },
            data: { status: 'CONFIRMED' },
            include: { items: true }
        });
        res.json({ message: 'Order confirmed successfully', order: updatedOrder });
    }
    catch (err) {
        console.error("Confirm Cart Error:", err);
        res.status(500).json({ error: 'Failed to confirm order' });
    }
});
exports.confirmCart = confirmCart;
// ─── Get My Orders ────────────────────────────────────────────────────────────
const getMyOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const orders = yield prisma.shopOrder.findMany({
            where: { userId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ orders });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
exports.getMyOrders = getMyOrders;
