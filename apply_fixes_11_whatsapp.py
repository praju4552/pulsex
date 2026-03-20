import os

def fix_payment_controller():
    path = r"d:\pulsex(prototyping)\backend-node\src\controllers\paymentController.ts"
    if not os.path.exists(path): return False
    
    with open(path, 'r', encoding='utf-8') as f:
         content = f.read()

    # Locate the verifyPayment function inside update block
    target_pattern = """    const updateData = { paymentStatus: 'PAID' as any, orderStatus: 'CONFIRMED' as any };
    const ids: string[] = orderIds;

    if (orderType === 'PROTOTYPING' || orderType === 'PCB') {
      await prisma.prototypingOrder.updateMany({ where: { id: { in: ids } }, data: updateData });
    } else if (orderType === 'THREE_D') {
      await prisma.threeDOrder.updateMany({ where: { id: { in: ids } }, data: updateData });
    } else if (orderType === 'LASER') {
      await prisma.laserCuttingOrder.updateMany({ where: { id: { in: ids } }, data: updateData });
    }"""

    inject_logic = """    const updateData = { paymentStatus: 'PAID' as any, orderStatus: 'CONFIRMED' as any };
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
        const targetUserId = userId || paymentRecord?.userId;
        if (targetUserId) {
             const user = await prisma.prototypingUser.findUnique({ where: { id: targetUserId } });
             if (user && user.phone) {
                  console.log(`[WhatsApp Receipt] Send trigger initiated for ${user.phone} at ${new Date().toISOString()}`);
                  console.log(`Message: Hi ${user.name}, your Antigravity order has been confirmed! Payment ID: ${razorpayPaymentId}.`);
             }
        }
    } catch (err) {
        console.error('[WhatsApp Trigger] Failed to send receipt log:', err);
    }"""

    if target_pattern in content:
         content = content.replace(target_pattern, inject_logic)
         with open(path, 'w', encoding='utf-8') as f:
              f.write(content)
         print("✅ paymentController.ts updated with WhatsApp simulate hook")
         return True
    print("❌ Failed to match order create indices in paymentController")
    return False

fix_payment_controller()
