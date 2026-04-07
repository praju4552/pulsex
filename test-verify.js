import jwt from 'jsonwebtoken';

const token = jwt.sign({ userId: 'mock-user-123', role: 'USER' }, 'your-64-char-random-string', { expiresIn: '1h' });

fetch('https://api.pulsewritexsolutions.com/payments/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    razorpayOrderId: 'order_somefaketest1',
    razorpayPaymentId: 'pay_somefaketest1',
    razorpaySignature: 'fakesignature123',
    orderType: 'PROTOTYPING',
    orderIds: []
  })
}).then(r => r.json()).then(d => console.log('Response:', d)).catch(console.error);
