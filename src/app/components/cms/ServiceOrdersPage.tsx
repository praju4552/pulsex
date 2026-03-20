import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../api/config';
import { Search, Filter, Loader2, AlertCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import OrderDetailModal from './OrderDetailModal';

interface Props {
  serviceFilter: string;
  title: string;
}

export default function ServiceOrdersPage({ serviceFilter, title }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payFilter, setPayFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const token = sessionStorage.getItem('cms_token') || '';

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (payFilter !== 'all') params.set('payment', payFilter);
      if (search) params.set('search', search);

      const res = await fetch(`${API_BASE_URL}/prototyping-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Filter client-side by serviceType
      const filtered = serviceFilter === 'all'
        ? data.orders
        : (data.orders || []).filter((o: any) => o.serviceType === serviceFilter);
      setOrders(filtered);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, payFilter, search, serviceFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleOrderUpdated = (updated: any) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    setSelectedOrder(null);
  };

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
      CONFIRMED: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
      IN_PRODUCTION: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
      QUALITY_CONTROL: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
      SHIPPED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
      DELIVERED: 'bg-green-500/15 text-green-400 border-green-500/25',
      CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/25',
    };
    return m[s] || 'bg-gray-500/15 text-gray-400 border-gray-500/25';
  };

  const payBadge = (s: string) => {
    const m: Record<string, string> = {
      UNPAID: 'bg-red-500/15 text-red-400 border-red-500/25',
      PAID: 'bg-green-500/15 text-green-400 border-green-500/25',
      REFUNDED: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    };
    return m[s] || '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        <p className="text-gray-500 text-sm">{total} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, order ref..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] rounded-xl text-sm text-white focus:outline-none focus:border-[#00cc55] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-[#111] border border-[#333] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00cc55] appearance-none">
            <option value="all">All Status</option>
            {['PENDING','CONFIRMED','IN_PRODUCTION','QUALITY_CONTROL','SHIPPED','DELIVERED','CANCELLED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <select value={payFilter} onChange={e => { setPayFilter(e.target.value); setPage(1); }} className="bg-[#111] border border-[#333] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00cc55] appearance-none">
            <option value="all">All Payment</option>
            {['UNPAID','PAID','REFUNDED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00cc55]" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0a0a] border-b border-[#222]">
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Order Ref</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Spec</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Payment</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#00cc55] font-bold whitespace-nowrap">{o.orderRef}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white text-xs">{o.firstName} {o.lastName}</p>
                      <p className="text-gray-500 text-xs truncate max-w-[140px]">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[160px]" title={o.specSummary}>{o.specSummary || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-white text-xs">₹{(o.totalAmount / 100).toFixed(0)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusBadge(o.orderStatus)}`}>{o.orderStatus.replace(/_/g,' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${payBadge(o.paymentStatus)}`}>{o.paymentStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedOrder(o)} className="text-gray-400 hover:text-[#00cc55] transition-colors p-1.5 rounded-lg hover:bg-[#00cc55]/10">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border border-[#333] text-gray-400 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      {/* Modal */}
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={handleOrderUpdated} />}
    </div>
  );
}
