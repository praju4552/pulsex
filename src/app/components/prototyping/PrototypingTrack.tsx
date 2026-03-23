import React, { useState, useEffect } from 'react';
import { PrototypingHeader } from './PrototypingHeader';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Loader2, Clock, CheckCircle2, Truck, AlertCircle, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../../../api/config';

interface TrackedOrder {
  orderRef: string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  serviceType: string;
  specSummary: string;
  totalAmount: number;
  firstName: string;
  lastName: string;
}

export default function PrototypingTrack() {
  const [searchParams] = useSearchParams();
  const [orderRef, setOrderRef] = useState(searchParams.get('ref') || '');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderRef.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`${API_BASE_URL}/prototyping-orders/track/${orderRef}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Order not found. Please check your reference ID.');
        throw new Error('Failed to fetch tracking details.');
      }
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('ref')) {
      handleTrack();
    }
  }, []);

  const steps = [
    { key: 'PENDING', label: 'Order Placed', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'IN_PRODUCTION', label: 'In Production', icon: Loader2 },
    { key: 'QUALITY_CONTROL', label: 'Quality Check', icon: Search },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getStatusIndex = (currentStatus: string) => {
    return steps.findIndex(s => s.key === currentStatus);
  };

  const statusIdx = order ? getStatusIndex(order.orderStatus) : -1;

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary selection:bg-[#00cc55]/30 flex flex-col">
      <PrototypingHeader />

      <div className="flex-1 max-w-5xl mx-auto px-6 py-12 lg:py-20 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Track Your Project</h1>
          <p className="text-text-secondary">Enter your order reference ID to see real-time manufacturing status</p>
        </div>

        <form onSubmit={handleTrack} className="max-w-2xl mx-auto mb-16">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Enter Reference ID (e.g. clx...)"
                value={orderRef}
                onChange={e => setOrderRef(e.target.value)}
                className="w-full bg-glass-bg-hover border border-border-glass rounded-2xl pl-12 pr-4 py-4 text-text-primary focus:outline-none focus:border-[#00cc55] focus:ring-1 focus:ring-[#00cc55] transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-[#00cc55] text-black font-black uppercase tracking-wider rounded-2xl hover:bg-[#00cc55]/90 transition-all shadow-[0_0_20px_rgba(0,204,85,0.3)] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Track Order'}
            </button>
          </div>
        </form>

        {error && (
          <div className="max-w-md mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center flex items-center justify-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {order && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Visual Progress Steps */}
            <div className="bg-glass-bg border border-border-glass rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{order.serviceType}</h2>
                  <p className="text-text-muted text-sm font-mono uppercase tracking-widest">{order.orderRef}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Status</p>
                  <p className="text-[#00cc55] font-black text-xl italic">{order.orderStatus.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="relative">
                {/* Desktop Progress Line */}
                <div className="hidden md:block absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-surface-100" />
                <div 
                  className="hidden md:block absolute top-[18px] left-[5%] h-0.5 bg-[#00cc55] transition-all duration-1000"
                  style={{ width: `${Math.max(0, (statusIdx / (steps.length - 1)) * 90)}%` }}
                />

                <div className="grid grid-cols-1 md:grid-cols-6 gap-8 relative">
                  {steps.map((step, idx) => {
                    const isActive = idx <= statusIdx;
                    const isProcessing = idx === statusIdx && step.key !== 'DELIVERED';
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.key} className="flex md:flex-col items-center gap-4 md:text-center group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative z-10 ${isActive ? 'bg-[#00cc55] border-[#00cc55] text-black shadow-[0_0_15px_rgba(0,204,85,0.4)]' : 'bg-bg-secondary border-border-glass text-zinc-600'}`}>
                          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-wider mb-1 ${isActive ? 'text-white' : 'text-zinc-600'}`}>{step.label}</p>
                          {isActive && (
                            <p className="text-[10px] text-text-muted">
                              {idx === statusIdx ? 'Current Stage' : 'Completed'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-glass-bg border border-border-glass rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#00cc55]" /> Tracking Info
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Customer</span>
                    <span className="text-zinc-300 font-medium">{order.firstName} {order.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Service</span>
                    <span className="text-[#00cc55] font-bold">{order.serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Order Date</span>
                    <span className="text-zinc-300 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="pt-4 border-t border-border-glass">
                    <p className="text-xs text-text-muted uppercase tracking-widest mb-2 font-bold">Project Summary</p>
                    <p className="text-text-secondary italic text-xs leading-relaxed">{order.specSummary}</p>
                  </div>
                </div>
              </div>

              <div className="bg-glass-bg border border-border-glass rounded-3xl p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-[#00cc55]" /> Payment Info
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Payment Status</span>
                    <span className={`font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-full border ${order.paymentStatus === 'PAID' ? 'bg-[#00cc55]/10 text-[#00cc55] border-[#00cc55]/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-8">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-widest font-bold mb-1">Total Paid</p>
                      <p className="text-3xl font-black text-[#00cc55]">₹{order.totalAmount / 100}</p>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Amount incl. GST</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-8">
              <button 
                onClick={() => navigate('/prototyping/orders')}
                className="text-text-muted hover:text-text-primary transition-colors flex items-center justify-center gap-2 mx-auto font-medium"
              >
                Back to My Orders <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
