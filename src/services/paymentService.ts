import { API_BASE_URL } from '../api/config';

export const initiateRazorpayPayment = async (
  totalAmountInPaise: number,
  orderIds: string[],
  orderType: string,
  token: string,
  userDetails: { name: string; email: string; phone: string }
): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ totalAmountInPaise, orderIds, orderType }),
  });
  
  if (!res.ok) {
    let errMsg = 'Failed to create Razorpay Order';
    try {
      const errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch (e) {}
    throw new Error(errMsg);
  }
  const order = await res.json();

  return new Promise((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: order.amount,
      currency: order.currency,
      name: 'PulseWriteX',
      description: 'Order Payment',
      order_id: order.razorpayOrderId,
      prefill: { 
        name: userDetails.name, 
        email: userDetails.email, 
        contact: userDetails.phone 
      },
      theme: { color: '#00cc55' },
      handler: async (response: any) => {
        const verify = await fetch(`${API_BASE_URL}/payments/verify`, {
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
