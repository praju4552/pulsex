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
exports.verifyPayment = exports.initiatePayment = void 0;
const db_1 = __importDefault(require("../db"));
const razorpayService_1 = require("../services/razorpayService");
const initiatePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { totalAmountInPaise, orderIds, orderType } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const receipt = `rcpt_${Date.now()}`;
        const rzpOrder = yield (0, razorpayService_1.createRazorpayOrder)(totalAmountInPaise, receipt);
        yield db_1.default.payment.create({
            data: {
                razorpayOrderId: rzpOrder.id,
                amount: totalAmountInPaise,
                status: 'CREATED',
                orderType: orderType || 'PROTOTYPING',
                orderIds: orderIds || [],
                userId,
            },
        });
        res.json({
            razorpayOrderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        });
    }
    catch (err) {
        console.error('Payment initiation error:', err);
        const apiError = ((_b = err === null || err === void 0 ? void 0 : err.error) === null || _b === void 0 ? void 0 : _b.description) || err.message || JSON.stringify(err);
        res.status(500).json({ error: `Razorpay Error: ${apiError}` });
    }
});
exports.initiatePayment = initiatePayment;
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderIds } = req.body;
        // ── 1. Fetch payment record ───────────────────────────────────────────────
        // Must exist in DB — created by initiatePayment before Razorpay modal opened.
        const existingPayment = yield db_1.default.payment.findUnique({
            where: { razorpayOrderId }
        });
        if (!existingPayment) {
            return res.status(404).json({ error: 'Payment record not found' });
        }
        // ── 2. Idempotency: skip if already processed ─────────────────────────────
        // Handles network retries and double-click submissions safely.
        if (existingPayment.status === 'PAID') {
            return res.status(200).json({
                success: true,
                message: 'Payment already processed'
            });
        }
        // ── 3. Ownership: payment must belong to the authenticated user ───────────
        // JWT payload always uses 'userId' (see auth middleware). Using ?.id too
        // was causing undefined !== existingPayment.userId → spurious 403.
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId || existingPayment.userId !== userId) {
            return res.status(403).json({
                error: 'Forbidden: This payment does not belong to you'
            });
        }
        // ── 4. Signature verification (HMAC-SHA256) ───────────────────────────────
        const isValid = (0, razorpayService_1.verifyPaymentSignature)(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isValid) {
            console.error(`Signature mismatch. Order: ${razorpayOrderId}, Secret length: ${((_b = process.env.RAZORPAY_KEY_SECRET) === null || _b === void 0 ? void 0 : _b.length) || 0}`);
            return res.status(400).json({ error: `Signature mismatch. Secret key length in memory: ${((_c = process.env.RAZORPAY_KEY_SECRET) === null || _c === void 0 ? void 0 : _c.length) || 0} chars. Did you restart the server?` });
        }
        yield db_1.default.payment.update({
            where: { razorpayOrderId },
            data: { razorpayPaymentId, razorpaySignature, status: 'PAID' },
        });
        let ids = [];
        if (existingPayment.orderIds && Array.isArray(existingPayment.orderIds)) {
            ids = existingPayment.orderIds;
        }
        else if (orderIds && Array.isArray(orderIds)) {
            ids = orderIds;
        }
        console.log(`[Payment Verified] Processing ${ids.length} orders to mark as PAID: ${JSON.stringify(ids)}`);
        // Unified checkout: update all possible order types present in the cart
        if (ids.length > 0) {
            // Prototyping (PCB included) uses paymentStatus & orderStatus
            const pcbUpdated = yield db_1.default.prototypingOrder.updateMany({
                where: { id: { in: ids } },
                data: { paymentStatus: 'PAID', orderStatus: 'CONFIRMED' }
            });
            console.log(`[Payment] Updated ${pcbUpdated.count} Prototyping Orders`);
            // 3D Printing uses only 'status'
            const threedUpdated = yield db_1.default.threeDOrder.updateMany({
                where: { id: { in: ids } },
                data: { status: 'CONFIRMED' }
            });
            console.log(`[Payment] Updated ${threedUpdated.count} 3D Orders`);
            // Laser Cutting uses only 'status'
            const laserUpdated = yield db_1.default.laserCuttingOrder.updateMany({
                where: { id: { in: ids } },
                data: { status: 'CONFIRMED' }
            });
            console.log(`[Payment] Updated ${laserUpdated.count} Laser Orders`);
        }
        // 📱 WhatsApp Receipt trigger simulation (Matches auth logic)
        try {
            if (userId) {
                const user = yield db_1.default.prototypingUser.findUnique({ where: { id: userId } });
                if (user && user.phone) {
                    console.log(`[WhatsApp Receipt] Send trigger initiated for ${user.phone} at ${new Date().toISOString()}`);
                    console.log(`Message: Hi ${user.name}, your Antigravity order has been confirmed! Payment ID: ${razorpayPaymentId}.`);
                }
            }
        }
        catch (err) {
            console.error('[WhatsApp Trigger] Failed to send receipt log:', err);
        }
        res.json({ success: true, message: 'Payment verified and orders confirmed' });
    }
    catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ error: `Server Error: ${err.message || 'Verification failed internally'}` });
    }
});
exports.verifyPayment = verifyPayment;
