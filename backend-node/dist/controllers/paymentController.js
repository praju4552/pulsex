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
    var _a;
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
        res.status(500).json({ error: 'Could not initiate payment' });
    }
});
exports.initiatePayment = initiatePayment;
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderType, orderIds } = req.body;
        const isValid = (0, razorpayService_1.verifyPaymentSignature)(razorpayOrderId, razorpayPaymentId, razorpaySignature);
        if (!isValid)
            return res.status(400).json({ error: 'Invalid payment signature' });
        yield db_1.default.payment.update({
            where: { razorpayOrderId },
            data: { razorpayPaymentId, razorpaySignature, status: 'PAID' },
        });
        const updateData = { paymentStatus: 'PAID', orderStatus: 'CONFIRMED' };
        const ids = orderIds;
        if (orderType === 'PROTOTYPING' || orderType === 'PCB') {
            yield db_1.default.prototypingOrder.updateMany({ where: { id: { in: ids } }, data: updateData });
        }
        else if (orderType === 'THREE_D') {
            yield db_1.default.threeDOrder.updateMany({ where: { id: { in: ids } }, data: updateData });
        }
        else if (orderType === 'LASER') {
            yield db_1.default.laserCuttingOrder.updateMany({ where: { id: { in: ids } }, data: updateData });
        }
        // 📱 Step 11: WhatsApp Receipt trigger simulation (Matches auth logic)
        try {
            const paymentRecord = yield db_1.default.payment.findUnique({ where: { razorpayOrderId } });
            const targetUserId = paymentRecord === null || paymentRecord === void 0 ? void 0 : paymentRecord.userId;
            if (targetUserId) {
                const user = yield db_1.default.prototypingUser.findUnique({ where: { id: targetUserId } });
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
        res.status(500).json({ error: 'Verification failed' });
    }
});
exports.verifyPayment = verifyPayment;
