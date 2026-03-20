export const initiateRazorpayPayment = async (
  totalAmountInPaise: number,
  orderIds: string[],
  orderType: string,
  userDetails: { name: string; email: string; phone: string }
): Promise<void> => {
  const token = JSON.parse(localStorage.getItem('prototypingUser') || '{}').token;
  
  const res = await fetch('http://localhost:3001/api/payments/create-order', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ totalAmountInPaise, orderIds, orderType }),
  });
  
  if (!res.ok) throw new Error('Failed to create Razorpay Order');
  const order = await res.json();

  return new Promise((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: order.amount,
      currency: order.currency,
      name: 'Antigravity',
      description: 'Order Payment',
      order_id: order.razorpayOrderId,
      prefill: { 
        name: userDetails.name, 
        email: userDetails.email, 
        contact: userDetails.phone 
      },
      theme: { color: '#00cc55' }, // Match emerald theme
      handler: async (response: any) => {
        const verify = await fetch('http://localhost:3001/api/payments/verify', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderType,
            orderIds,
          }),
        });
        const result = await verify.json();
        if (result.success) resolve();
        else reject(new Error('Verification failed'));
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled by user')) },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  });
};
