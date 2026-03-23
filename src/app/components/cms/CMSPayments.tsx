import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../api/config';
import { Search, Loader2, AlertCircle, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CMSPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const token = sessionStorage.getItem('cms_token') || '';

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`${API_BASE_URL}/cms-admin/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, token]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const payBadge = (s: string) => {
    const m: Record<string, string> = {
      CREATED: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
      AUTHORIZED: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
      CAPTURED: 'bg-green-500/15 text-green-400 border-green-500/25',
      FAILED: 'bg-red-500/15 text-red-400 border-red-500/25',
    };
    return m[s] || 'bg-gray-500/15 text-gray-400 border-gray-500/25';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-[#00cc55]" /> Live Payments Log
        </h1>
        <p className="text-gray-500 text-sm">{total} transactions tracked</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by Razorpay ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] rounded-xl text-sm text-white focus:outline-none focus:border-[#00cc55] transition-colors"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-[#111] border border-[#333] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00cc55] appearance-none">
          <option value="all">All Statuses</option>
          {['CREATED','AUTHORIZED','CAPTURED','FAILED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00cc55]" /></div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0a0a] border-b border-[#222]">
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Internal ID</th>
                  <th className="px-4 py-3 text-left">Razorpay Order ID</th>
                  <th className="px-4 py-3 text-left">Razorpay Payment ID</th>
                  <th className="px-4 py-3 text-right">Amount (Paise)</th>
                  <th className="px-4 py-3 text-center">API Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-white">{p.razorpayOrderId}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">{p.razorpayPaymentId || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-white text-xs">{p.currency} {p.amount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${payBadge(p.status)}`}>{p.status}</span>
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
    </div>
  );
}
