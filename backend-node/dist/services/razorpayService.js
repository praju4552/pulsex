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
exports.verifyPaymentSignature = exports.createRazorpayOrder = exports.getRazorpayInstance = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
// ⚠️  NO singleton — always create a fresh instance so that keys are read
// directly from process.env every time.  This means a server restart after
// updating the .env file on Hostinger is sufficient to pick up new keys.
const getRazorpayInstance = () => {
    return new razorpay_1.default({
        key_id: (process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder').trim(),
        key_secret: (process.env.RAZORPAY_KEY_SECRET || 'placeholder').trim(),
    });
};
exports.getRazorpayInstance = getRazorpayInstance;
const createRazorpayOrder = (amountInPaise, receiptId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, exports.getRazorpayInstance)().orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
    });
});
exports.createRazorpayOrder = createRazorpayOrder;
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, signature) => {
    const rawSecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder';
    const secret = rawSecret.trim();
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expected = crypto_1.default
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    // Debug log — visible in PM2 logs on Hostinger
    if (expected !== signature) {
        const rawLen = rawSecret.length;
        const trimLen = secret.length;
        let warning = '';
        if (rawLen !== trimLen) {
            warning = `\n  ⚠️ WHITESPACE DETECTED: Secret had ${rawLen - trimLen} trailing/leading spaces or line breaks!`;
        }
        console.error(`[Razorpay] Signature mismatch.\n` +
            `  KEY_ID   = ${(process.env.RAZORPAY_KEY_ID || '(not set)').trim()}\n` +
            `  SECRET   = ${trimLen} chars (starts with ${secret.slice(0, 4)}...)${warning}\n` +
            `  order_id = ${razorpayOrderId}`);
    }
    return expected === signature;
};
exports.verifyPaymentSignature = verifyPaymentSignature;
