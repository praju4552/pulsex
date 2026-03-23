import Razorpay from 'razorpay';
import crypto from 'crypto';

let _razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = () => {
  if (!_razorpayInstance) {
    _razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
    });
  }
  return _razorpayInstance;
};

export const createRazorpayOrder = async (amountInPaise: number, receiptId: string) => {
  return await getRazorpayInstance().orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptId,
  });
};

export const verifyPaymentSignature = (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean => {
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};
