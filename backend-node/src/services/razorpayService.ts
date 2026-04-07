import Razorpay from 'razorpay';
import crypto from 'crypto';

// ⚠️  NO singleton — always create a fresh instance so that keys are read
// directly from process.env every time.  This means a server restart after
// updating the .env file on Hostinger is sufficient to pick up new keys.
export const getRazorpayInstance = () => {
  return new Razorpay({
    key_id:     (process.env.RAZORPAY_KEY_ID     || 'rzp_test_placeholder').trim(),
    key_secret: (process.env.RAZORPAY_KEY_SECRET || 'placeholder').trim(),
  });
};

export const createRazorpayOrder = async (amountInPaise: number, receiptId: string) => {
  return await getRazorpayInstance().orders.create({
    amount:   amountInPaise,
    currency: 'INR',
    receipt:  receiptId,
  });
};

export const verifyPaymentSignature = (
  razorpayOrderId:  string,
  razorpayPaymentId: string,
  signature:        string
): boolean => {
  const rawSecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder';
  const secret    = rawSecret.trim();
  const body      = razorpayOrderId + '|' + razorpayPaymentId;
  const expected  = crypto
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

    console.error(
      `[Razorpay] Signature mismatch.\n` +
      `  KEY_ID   = ${(process.env.RAZORPAY_KEY_ID || '(not set)').trim()}\n` +
      `  SECRET   = ${trimLen} chars (starts with ${secret.slice(0, 4)}...)${warning}\n` +
      `  order_id = ${razorpayOrderId}`
    );
  }
  return expected === signature;
};
