import { Request, Response } from 'express';
import prisma from '../db';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpayService';

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { totalAmountInPaise, orderIds, orderType } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const receipt = `rcpt_${Date.now()}`;
    const rzpOrder = await createRazorpayOrder(totalAmountInPaise, receipt);

    await prisma.payment.create({
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
  } catch (err) {
    console.error('Payment initiation error:', err);
    res.status(500).json({ error: 'Could not initiate payment' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderType, orderIds } = req.body;

    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) return res.status(400).json({ error: 'Invalid payment signature' });

    await prisma.payment.update({
      where: { razorpayOrderId },
      data: { razorpayPaymentId, razorpaySignature, status: 'PAID' },
    });

    const updateData = { paymentStatus: 'PAID' as any, orderStatus: 'CONFIRMED' as any };
    const ids: string[] = orderIds;

    if (orderType === 'PROTOTYPING' || orderType === 'PCB') {
      await prisma.prototypingOrder.updateMany({ where: { id: { in: ids } }, data: updateData });
    } else if (orderType === 'THREE_D') {
      await prisma.threeDOrder.updateMany({ where: { id: { in: ids } }, data: updateData });
    } else if (orderType === 'LASER') {
      await prisma.laserCuttingOrder.updateMany({ where: { id: { in: ids } }, data: updateData });
    }

    // 📱 Step 11: WhatsApp Receipt trigger simulation (Matches auth logic)
    try {
        const paymentRecord = await prisma.payment.findUnique({ where: { razorpayOrderId } });
        const targetUserId = paymentRecord?.userId;
        if (targetUserId) {
             const user = await prisma.prototypingUser.findUnique({ where: { id: targetUserId } });
             if (user && user.phone) {
                  console.log(`[WhatsApp Receipt] Send trigger initiated for ${user.phone} at ${new Date().toISOString()}`);
                  console.log(`Message: Hi ${user.name}, your Antigravity order has been confirmed! Payment ID: ${razorpayPaymentId}.`);
             }
        }
    } catch (err) {
        console.error('[WhatsApp Trigger] Failed to send receipt log:', err);
    }

    res.json({ success: true, message: 'Payment verified and orders confirmed' });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};
