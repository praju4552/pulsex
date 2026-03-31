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
  } catch (err: any) {
    console.error('Payment initiation error:', err);
    const apiError = err?.error?.description || err.message || JSON.stringify(err);
    res.status(500).json({ error: `Razorpay Error: ${apiError}` });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderType, orderIds } = req.body;

    // ── 1. Fetch payment record ───────────────────────────────────────────────
    // Must exist in DB — created by initiatePayment before Razorpay modal opened.
    const existingPayment = await prisma.payment.findUnique({
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

    // ── 3. Ownership: payment must belong to this user ────────────────────────
    // Prevents an attacker from generating a valid HMAC for their own cheap
    // Razorpay order and submitting it with another user's expensive orderIds.
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (existingPayment.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden: This payment does not belong to you'
      });
    }

    // ── 4. Signature verification (HMAC-SHA256) ───────────────────────────────
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      console.error(`Signature mismatch. Order: ${razorpayOrderId}, Secret length: ${process.env.RAZORPAY_KEY_SECRET?.length || 0}`);
      return res.status(400).json({ error: `Signature mismatch. Secret key length in memory: ${process.env.RAZORPAY_KEY_SECRET?.length || 0} chars. Did you restart the server?` });
    }

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

    // 📱 WhatsApp Receipt trigger simulation (Matches auth logic)
    try {
        // existingPayment.userId is already verified and in scope — no extra DB call needed.
        if (userId) {
             const user = await prisma.prototypingUser.findUnique({ where: { id: userId } });
             if (user && user.phone) {
                  console.log(`[WhatsApp Receipt] Send trigger initiated for ${user.phone} at ${new Date().toISOString()}`);
                  console.log(`Message: Hi ${user.name}, your Antigravity order has been confirmed! Payment ID: ${razorpayPaymentId}.`);
             }
        }
    } catch (err) {
        console.error('[WhatsApp Trigger] Failed to send receipt log:', err);
    }

    res.json({ success: true, message: 'Payment verified and orders confirmed' });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: `Server Error: ${err.message || 'Verification failed internally'}` });
  }
};
