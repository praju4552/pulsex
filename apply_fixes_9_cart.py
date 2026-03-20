import os

def fix_cart():
    path = r"d:\pulsex(prototyping)\src\app\components\prototyping\PrototypingCart.tsx"
    if not os.path.exists(path): return False
    with open(path, 'r', encoding='utf-8') as f:
         content = f.read()

    # 1. Add import
    import_stmt = "import { useNavigate } from 'react-router-dom';"
    new_import = "import { useNavigate } from 'react-router-dom';\nimport { initiateRazorpayPayment } from '../../../services/paymentService';"
    if import_stmt in content and "initiateRazorpayPayment" not in content:
         content = content.replace(import_stmt, new_import)

    # 2. Locate handleCheckout and replace its content
    old_handle = """  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Your cart is empty.');
    
    // Validate shipping info
    const reqFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
    const missing = reqFields.filter(k => !(shipping as any)[k]);
    if (missing.length > 0) return alert('Please fill in all required shipping details.');

    setIsSubmitting(true);

    try {
      for (const item of items) {
        const payload = {
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          email: shipping.email,
          phone: shipping.phone,
          streetAddress: shipping.address,
          apartment: shipping.apartment,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.zip,
          country: shipping.country,
          serviceType: item.type,
          specifications: item.fullSpec || {},
          specSummary: item.spec,
          shippingMethod: item.shippingMethod,
          shippingCost: item.shippingCost,
          pcbPrice: item.pcbPrice,
          totalAmount: Math.round(item.pcbPrice + item.shippingCost + (item.pcbPrice * 0.18)),
          userId: JSON.parse(localStorage.getItem('prototypingUser') || '{}').id || null
        };

        const res = await fetch('http://localhost:3001/api/prototyping-orders', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('prototypingUser') || '{}').token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to submit order');
        const data = await res.json();
        if (data.order?.orderRef) {
          setPlacedOrderRefs(prev => [...prev, data.order.orderRef]);
        }
      }

      // Clear cart
      localStorage.removeItem('prototyping_cart');
      setItems([]);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };"""

    # We multiply total by 100 because Razorpay expects Paise.
    new_handle = """  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Your cart is empty.');
    
    const reqFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
    const missing = reqFields.filter(k => !(shipping as any)[k]);
    if (missing.length > 0) return alert('Please fill in all required shipping details.');

    setIsSubmitting(true);
    const createdOrderIds: string[] = [];

    try {
      for (const item of items) {
        const payload = {
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          email: shipping.email,
          phone: shipping.phone,
          streetAddress: shipping.address,
          apartment: shipping.apartment,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.zip,
          country: shipping.country,
          serviceType: item.type,
          specifications: item.fullSpec || {},
          specSummary: item.spec,
          shippingMethod: item.shippingMethod,
          shippingCost: item.shippingCost,
          pcbPrice: item.pcbPrice,
          totalAmount: Math.round(item.pcbPrice + item.shippingCost + (item.pcbPrice * 0.18)),
          userId: JSON.parse(localStorage.getItem('prototypingUser') || '{}').id || null
        };

        const res = await fetch('http://localhost:3001/api/prototyping-orders', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('prototypingUser') || '{}').token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to submit order');
        const data = await res.json();
        if (data.order?.id) {
          createdOrderIds.push(data.order.id);
        }
        if (data.order?.orderRef) {
          setPlacedOrderRefs(prev => [...prev, data.order.orderRef]);
        }
      }

      // 🛒 Fire RazorPay Modal Payment 
      // Multiplied by 100 for Paise triggers
      await initiateRazorpayPayment(
        Math.round(total * 100), 
        createdOrderIds,
        'PROTOTYPING',
        { 
          name: `${shipping.firstName} ${shipping.lastName}`, 
          email: shipping.email, 
          phone: shipping.phone 
        }
      );

      localStorage.removeItem('prototyping_cart');
      setItems([]);
      navigate('/payment/success');
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Payment cancelled by user') {
         alert('Payment was cancelled. Your order is submittted — you can pay from your orders panel.');
      } else {
         alert('Payment verification failed or timed out. Please retry.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };"""

    if old_handle.replace('\r', '') in content.replace('\r', ''):
         content = content.replace('\r', '').replace(old_handle.replace('\r', ''), new_handle)
         with open(path, 'w', encoding='utf-8') as f:
              f.write(content)
         print("✅ PrototypingCart.tsx updated with Razorpay triggers")
         return True
    print("❌ Failed to match handleCheckout strictly in PrototypingCart")
    return False

fix_cart()
