import { useState } from 'react';
import { X, Loader2, Save, Download, CreditCard } from 'lucide-react';
import { API_BASE_URL } from '../../../api/config';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CONTROL', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUNDED'];

interface Props {
  order: any;
  onClose: () => void;
  onUpdated: (order: any) => void;
}

export default function OrderDetailModal({ order, onClose, onUpdated }: Props) {
  const [orderStatus, setOrderStatus] = useState(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
  const [saving, setSaving] = useState(false);

  const token = sessionStorage.getItem('cms_token') || '';

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/prototyping-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderStatus, paymentStatus, adminNotes }),
      });
      const data = await res.json();
      if (data.success) onUpdated(data.order);
    } catch (err) {
      alert('Failed to save. Check console.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (type: string) => {
    window.open(`${API_BASE_URL}/prototyping-orders/${order.id}/download?type=${type}&token=${token}`, '_blank');
  };

  const statusColor = (s: string) => {
    const m: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      IN_PRODUCTION: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      QUALITY_CONTROL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      SHIPPED: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return m[s] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const payColor = (s: string) => {
    const m: Record<string, string> = {
      UNPAID: 'bg-red-500/20 text-red-400 border-red-500/30',
      PAID: 'bg-green-500/20 text-green-400 border-green-500/30',
      REFUNDED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return m[s] || '';
  };

  const specs = typeof order.specifications === 'object' ? order.specifications : {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-[#111] px-6 py-4 border-b border-[#222] flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-lg">Order: <span className="text-[#00cc55] font-mono">{order.orderRef}</span></h2>
            <p className="text-gray-500 text-xs mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <section>
            <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Customer</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Name</span><p className="font-semibold">{order.firstName} {order.lastName}</p></div>
              <div><span className="text-gray-500">Email</span><p className="font-semibold">{order.email}</p></div>
              <div><span className="text-gray-500">Phone</span><p className="font-semibold">{order.phone}</p></div>
              <div><span className="text-gray-500">Address</span><p className="font-semibold text-xs leading-tight">{order.streetAddress}{order.apartment ? `, ${order.apartment}` : ''}, {order.city}, {order.state} {order.zip}, {order.country}</p></div>
            </div>
          </section>

          {/* Order Info */}
          <section>
            <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Order Details</h4>
            <div className="bg-[#0a0a0a] rounded-xl border border-[#222] p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-bold">{order.serviceType}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Summary</span><span className="font-semibold text-right max-w-[60%]">{order.specSummary}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Item Price</span><span className="font-bold">₹{order.pcbPrice?.toFixed(0) || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-bold">₹{order.shippingCost?.toFixed(0) || 0}</span></div>
              <div className="flex justify-between border-t border-[#222] pt-2"><span className="text-gray-500">Total</span><span className="font-black text-[#00cc55]">₹{order.totalAmount?.toFixed(0) || 0}</span></div>
            </div>
            {Object.keys(specs).length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-white">View Full Specifications</summary>
                <pre className="mt-2 bg-[#0a0a0a] border border-[#222] rounded-lg p-3 text-xs text-gray-400 overflow-x-auto">{JSON.stringify(specs, null, 2)}</pre>
              </details>
            )}
          </section>

          {/* IDs */}
          <section>
            <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Reference IDs</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[['Sales Order', order.salesOrderId], ['Invoice', order.invoiceId], ['Project', order.projectId], ['Job', order.jobId]].map(([l, v]) => (
                <div key={l} className="bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2">
                  <span className="text-gray-500 block text-[10px]">{l}</span>
                  <span className="text-white">{v || 'N/A'}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Status Updaters */}
          <section>
            <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Update Status</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Order Status</label>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map(s => (
                    <button key={s} onClick={() => setOrderStatus(s)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${orderStatus === s ? statusColor(s) : 'border-[#333] text-gray-500 hover:border-[#555]'}`}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Payment Status</label>
                <div className="flex gap-2">
                  {PAYMENT_STATUSES.map(s => (
                    <button key={s} onClick={() => setPaymentStatus(s)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${paymentStatus === s ? payColor(s) : 'border-[#333] text-gray-500 hover:border-[#555]'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-400">
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Razorpay payment integration will be added soon.</span>
              </div>
            </div>
          </section>

          {/* Admin Notes */}
          <section>
            <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Admin Notes</h4>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              rows={4}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00cc55] transition-colors resize-none"
              placeholder="Internal notes about this order..."
            />
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#00cc55] text-black font-bold rounded-xl text-sm hover:bg-[#00cc55]/90 disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
            <button onClick={() => handleDownload('INVOICE')} className="flex items-center gap-2 px-4 py-2.5 border border-[#333] text-gray-300 font-semibold rounded-xl text-sm hover:border-[#555] transition-all">
              <Download className="w-4 h-4" /> Invoice PDF
            </button>
            <button onClick={() => handleDownload('SALES_ORDER')} className="flex items-center gap-2 px-4 py-2.5 border border-[#333] text-gray-300 font-semibold rounded-xl text-sm hover:border-[#555] transition-all">
              <Download className="w-4 h-4" /> Sales Order PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
