import { useState, useEffect } from 'react';
import { PrototypingHeader } from './PrototypingHeader';
import { Trash2, AlertCircle, CheckCircle2, Package, MapPin, Mail, Phone, User, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { initiateRazorpayPayment } from '../../../services/paymentService';
import { API_BASE_URL } from '../../../api/config';
import { usePrototypingAuth } from '../../../context/PrototypingAuthContext';

export default function PrototypingCart() {
  const navigate = useNavigate();
  const { user, token } = usePrototypingAuth();
  const [items, setItems] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('prototyping_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shipping, setShipping] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  useEffect(() => {
    if (user) {
      const nameParts = user.name.split(' ');
      setShipping(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.streetAddress || '',
        apartment: user.apartment || '',
        city: user.city || '',
        state: user.state || '',
        zip: user.zip || '',
        country: user.country || 'IN',
      }));
    }
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [placedOrderRefs, setPlacedOrderRefs] = useState<string[]>([]);

  // Subtotal is sum of pcbPrice across all items
  const subtotal = items.reduce((acc, item) => acc + (item.pcbPrice || 0), 0);
  // Shipping cost: in reality we might combine shipping, but let's take max or sum. We'll take max shipping cost for simplicity.
  const shippingCost = items.length > 0 ? Math.max(...items.map(i => i.shippingCost || 0)) : 0;
  // Tax 18% GST (standard Indian tax)
  const tax = subtotal * 0.18;
  const total = subtotal + shippingCost + tax;

  const removeItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    localStorage.setItem('prototyping_cart', JSON.stringify(newItems));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Your cart is empty.');
    
    const reqFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
    const missing = reqFields.filter(k => !(shipping as any)[k]);
    if (missing.length > 0) return alert('Please fill in all required shipping details.');

    setIsSubmitting(true);
    const createdOrderIds: string[] = [];

    try {
      for (const item of items) {
        let orderId = null;
        let orderRef = null;

        if (item.type === '3D Printing') {
          const threeDPayload = {
            userId: user?.id || null,
            fileId: item.fullSpec.fileId,
            config: item.fullSpec.config,
            price: item.pcbPrice,
            quantity: item.qty,
            customerInfo: { 
              firstName: shipping.firstName, 
              lastName: shipping.lastName, 
              email: shipping.email, 
              phone: shipping.phone 
            },
            shippingInfo: { 
              streetAddress: shipping.address, 
              apartment: shipping.apartment, 
              city: shipping.city, 
              state: shipping.state, 
              zip: shipping.zip, 
              country: shipping.country,
              method: item.shippingMethod || 'Standard', 
              cost: item.shippingCost || 0
            }
          };

          const res = await fetch(`${API_BASE_URL}/three-d-printing/order`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(threeDPayload)
          });

          if (!res.ok) {
            let errMsg = 'Failed to submit 3D Printing order';
            try { const data = await res.json(); if (data.error) errMsg = data.error; } catch(e){}
            throw new Error('Order Creation Error: ' + errMsg);
          }
          const data = await res.json();
          orderId = data.orderId;
          orderRef = data.orderRef;
        } else {
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
            userId: user?.id || null
          };

          const res = await fetch(`${API_BASE_URL}/prototyping-orders`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error('Failed to submit order');
          const data = await res.json();
          orderId = data.order?.id;
          orderRef = data.order?.orderRef;
        }

        if (orderId) {
          createdOrderIds.push(orderId);
        }
        if (orderRef) {
          setPlacedOrderRefs(prev => [...prev, orderRef]);
        }
      }

      // 🛒 Fire RazorPay Modal Payment 
      // Multiplied by 100 for Paise triggers
      await initiateRazorpayPayment(
        Math.round(total * 100),
        createdOrderIds,
        'PROTOTYPING',
        token || '',
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
         alert('Payment verification failed: ' + (err.message || 'Unknown network error. Please check your internet connection.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary selection:bg-[#00cc55]/30">
      <PrototypingHeader />

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-bg-primary border border-[#00cc55]/40 p-10 rounded-[2.5rem] max-w-md w-full text-center flex flex-col items-center shadow-[0_0_80px_rgba(0,204,85,0.15)]">
            {/* Icon */}
            <div className="w-20 h-20 bg-[#00cc55] rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,204,85,0.5)]">
              <CheckCircle2 className="w-10 h-10 text-black" />
            </div>
            
            <h2 className="text-3xl font-black text-text-primary mb-2 tracking-tight">Order Placed!</h2>
            <p className="text-text-secondary text-sm mb-6 max-w-xs">
              Your {placedOrderRefs.length > 1 ? `${placedOrderRefs.length} orders have` : 'order has'} been successfully submitted and will be reviewed by our team shortly.
            </p>
            
            {/* Order Refs */}
            {placedOrderRefs.length > 0 && (
              <div className="w-full bg-black/50 rounded-2xl p-4 mb-6 border border-border-glass">
                <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2 font-bold">Order Reference{placedOrderRefs.length > 1 ? 's' : ''}</p>
                {placedOrderRefs.map(ref => (
                  <p key={ref} className="font-mono text-[#00cc55] text-sm font-bold">{ref}</p>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate('/prototyping/orders')}
                className="w-full py-4 bg-[#00cc55] text-black font-black uppercase tracking-wider rounded-2xl hover:bg-[#00cc55]/90 transition-all shadow-[0_0_20px_rgba(0,204,85,0.3)]"
              >
                View My Orders
              </button>
              <button
                onClick={() => navigate('/prototyping')}
                className="w-full py-3 text-text-secondary hover:text-text-primary font-bold text-sm transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 lg:py-20">
        <h1 className="text-3xl md:text-5xl font-black mb-12 tracking-tight">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Shipping & Profile Details Form */}
          <div className="lg:col-span-7 space-y-10">
            {/* Shipping Profile Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#00cc55]/10 flex items-center justify-center border border-[#00cc55]/20">
                  <User className="w-5 h-5 text-[#00cc55]" />
                </div>
                <h2 className="text-2xl font-bold">Contact Details</h2>
              </div>
              
              <div className="p-6 rounded-2xl border border-border-glass bg-glass-bg backdrop-blur-md space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                      <User className="w-4 h-4" /> First Name
                    </label>
                    <input 
                      type="text" 
                      value={shipping.firstName}
                      onChange={e => setShipping({...shipping, firstName: e.target.value})}
                      className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Last Name</label>
                    <input 
                      type="text" 
                      value={shipping.lastName}
                      onChange={e => setShipping({...shipping, lastName: e.target.value})}
                      className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email Address
                    </label>
                    <input 
                      type="email" 
                      value={shipping.email}
                      onChange={e => setShipping({...shipping, email: e.target.value})}
                      className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={shipping.phone}
                      onChange={e => setShipping({...shipping, phone: e.target.value})}
                      className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Address Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#00cc55]/10 flex items-center justify-center border border-[#00cc55]/20">
                  <MapPin className="w-5 h-5 text-[#00cc55]" />
                </div>
                <h2 className="text-2xl font-bold">Shipping Address</h2>
              </div>
              
              <div className="p-6 rounded-2xl border border-border-glass bg-glass-bg backdrop-blur-md space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Street Address</label>
                  <input 
                    type="text" 
                    value={shipping.address}
                    onChange={e => setShipping({...shipping, address: e.target.value})}
                    className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
                    placeholder="123 Innovation Drive"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Apartment, suite, etc. (optional)</label>
                  <input 
                    type="text" 
                    value={shipping.apartment}
                    onChange={e => setShipping({...shipping, apartment: e.target.value})}
                    className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
                    placeholder="Suite 400"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-text-secondary">City</label>
                    <input 
                      type="text" 
                      value={shipping.city}
                      onChange={e => setShipping({...shipping, city: e.target.value})}
                      className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
                      placeholder="San Francisco"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">State</label>
                    <input 
                      type="text" 
                      value={shipping.state}
                      onChange={e => setShipping({...shipping, state: e.target.value})}
                      className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
                      placeholder="CA"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">ZIP Code</label>
                    <input 
                      type="text" 
                      value={shipping.zip}
                      onChange={e => setShipping({...shipping, zip: e.target.value})}
                      className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
                      placeholder="94103"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Country</label>
                  <select 
                    value={shipping.country}
                    onChange={e => setShipping({...shipping, country: e.target.value})}
                    className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all appearance-none"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="EU">European Union</option>
                    <option value="IN">India</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary & Cart Items */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#00cc55]/10 flex items-center justify-center border border-[#00cc55]/20">
                  <Package className="w-5 h-5 text-[#00cc55]" />
                </div>
                <h2 className="text-2xl font-bold">Order Summary</h2>
              </div>
              
              <div className="p-6 rounded-2xl border border-border-glass bg-glass-bg backdrop-blur-md flex flex-col h-full">
                
                {/* Cart Items List */}
                <div className="space-y-6 mb-8 flex-grow">
                  {items.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center">
                      <AlertCircle className="w-12 h-12 text-text-muted mb-4" />
                      <p className="text-text-secondary mb-4">Your cart is empty.</p>
                      <button onClick={() => navigate('/prototyping')} className="px-6 py-2 bg-[#00cc55]/20 text-[#00cc55] rounded-full text-sm font-semibold hover:bg-[#00cc55]/30 transition-colors">
                        Browse Services
                      </button>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="flex gap-4 group">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/50 flex-shrink-0 border border-border-glass relative">
                          <img src={item.image} alt={item.type} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                        <div className="flex-grow flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-bold text-text-primary leading-tight">{item.type}</h3>
                            <button onClick={() => removeItem(item.id)} className="text-text-muted hover:text-red-400 transition-colors p-1 -mr-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-text-secondary mb-3 truncate max-w-[180px]" title={item.spec}>{item.spec}</p>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 bg-bg-primary/60 rounded-lg px-2 py-0.5 border border-border-glass">
                              <span className="text-xs font-medium text-text-secondary">Qty: {item.qty}</span>
                            </div>
                            <span className="font-semibold text-[#00cc55]">₹{item.pcbPrice.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                {items.length > 0 && (
                  <div className="pt-6 border-t border-border-glass space-y-4">
                    <div className="flex justify-between text-sm text-text-secondary">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-text-secondary">
                      <span>Shipping</span>
                      <span>₹{shippingCost.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-text-secondary">
                      <span>Estimated Tax (18% GST)</span>
                      <span>₹{tax.toFixed(0)}</span>
                    </div>
                    <div className="pt-4 border-t border-border-glass flex justify-between items-end">
                      <div>
                        <p className="text-sm text-text-secondary">Total Due</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00cc55] to-emerald-400">₹{total.toFixed(0)}</span>
                        <p className="text-xs text-text-muted mt-1">INR</p>
                      </div>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                      className="w-full py-4 mt-6 bg-[#00cc55] hover:bg-[#00cc55]/90 disabled:bg-[#00cc55]/50 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(0,204,85,0.3)] hover:shadow-[0_0_30px_rgba(0,204,85,0.5)] flex justify-center items-center gap-2 group"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Order'}
                      {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-text-muted mt-4">
                      <CheckCircle2 className="w-4 h-4 text-[#00cc55]" />
                      <span>Secure SSL Checkout</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
