import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../api/config';
import { Search, Loader2, AlertCircle, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const token = sessionStorage.getItem('cms_token') || '';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) params.set('search', search);

      const res = await fetch(`${API_BASE_URL}/cms-admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const viewUser = async (user: any) => {
    setSelectedUser(user);
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/cms-admin/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUserOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Users</h1>
        <p className="text-gray-500 text-sm">{total} registered users</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, phone..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#333] rounded-xl text-sm text-white focus:outline-none focus:border-[#00cc55] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#00cc55]" /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0a0a0a] border-b border-[#222]">
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-center">Role</th>
                  <th className="px-4 py-3 text-center">Credits</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-semibold text-white text-xs">{u.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.phone || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${u.role === 'SUPER_ADMIN' ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-blue-500/15 text-blue-400 border-blue-500/25'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[#00cc55] text-xs font-bold">{u.credits}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => viewUser(u)} className="text-gray-400 hover:text-[#00cc55] transition-colors p-1.5 rounded-lg hover:bg-[#00cc55]/10">
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-[#111] border border-[#333] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#111] px-6 py-4 border-b border-[#222] flex items-center justify-between z-10">
              <h2 className="font-bold text-lg">{selectedUser.name}</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500 text-xs">Email</span><p className="font-semibold">{selectedUser.email}</p></div>
                <div><span className="text-gray-500 text-xs">Phone</span><p className="font-semibold">{selectedUser.phone || '—'}</p></div>
                <div><span className="text-gray-500 text-xs">Role</span><p className="font-semibold">{selectedUser.role}</p></div>
                <div><span className="text-gray-500 text-xs">Credits</span><p className="font-semibold text-[#00cc55]">{selectedUser.credits}</p></div>
                <div><span className="text-gray-500 text-xs">Joined</span><p className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</p></div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">Order History</h4>
                {loadingDetail ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#00cc55]" /></div>
                ) : userOrders.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No orders yet.</p>
                ) : (
                  <div className="space-y-2">
                    {userOrders.map(o => (
                      <div key={o.id} className="bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-mono text-[#00cc55] font-bold">{o.orderRef}</p>
                          <p className="text-gray-500">{o.serviceType} · {new Date(o.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">₹{(o.totalAmount / 100).toFixed(0)}</p>
                          <p className="text-gray-500">{o.orderStatus.replace(/_/g,' ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
