import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../api/config';
import { Filter, Loader2, AlertCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import InquiryDetailModal from './InquiryDetailModal';

interface Props {
  serviceFilter: string; // 'SEM_TEM' | 'PROJECT_DEV' | 'PCB_DESIGN'
  title: string;
}

export default function InquiriesPage({ serviceFilter, title }: Props) {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);

  const token = sessionStorage.getItem('cms_token') || '';

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25', serviceType: serviceFilter });
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`${API_BASE_URL}/service-inquiry?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInquiries(data.inquiries || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, serviceFilter]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const handleUpdated = (updated: any) => {
    setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i));
    setSelected(null);
  };

  const stBadge = (s: string) => {
    const m: Record<string, string> = {
      NEW: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
      CONTACTED: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
      IN_PROGRESS: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
      CLOSED: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
    };
    return m[s] || '';
  };

  const typeBadge = (t: string) => t === 'REQUEST_CALLBACK' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        <p className="text-gray-500 text-sm">{total} total inquiries</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-[#111] border border-[#333] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00cc55] appearance-none">
            <option value="all">All Status</option>
            {['NEW','CONTACTED','IN_PROGRESS','CLOSED'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00cc55]" /></div>
        ) : inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">No inquiries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0a0a] border-b border-[#222]">
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {inquiries.map(inq => (
                  <tr key={inq.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white text-xs">{inq.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{inq.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{inq.phone}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${typeBadge(inq.inquiryType)}`}>{inq.inquiryType === 'REQUEST_CALLBACK' ? 'Callback' : 'Quote'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(inq.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${stBadge(inq.status)}`}>{inq.status.replace(/_/g,' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelected(inq)} className="text-gray-400 hover:text-[#00cc55] transition-colors p-1.5 rounded-lg hover:bg-[#00cc55]/10">
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

      {selected && <InquiryDetailModal inquiry={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
