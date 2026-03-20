import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../api/config';
import {
  Package, Users, DollarSign, Clock, TrendingUp,
  AlertCircle, CheckCircle2, XCircle, Loader2,
  FileText, Microscope,
} from 'lucide-react';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalInquiries: number;
}

export default function CMSDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('cms_token') || '';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cms-admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
          setRecentInquiries(data.recentInquiries || []);
        }
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[#00cc55]" /></div>;

  const cards = [
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: Package, color: 'from-[#00cc55] to-emerald-600' },
    { label: 'Pending', value: stats?.pendingOrders || 0, icon: Clock, color: 'from-yellow-500 to-amber-600' },
    { label: 'In Production', value: stats?.inProgressOrders || 0, icon: TrendingUp, color: 'from-blue-500 to-indigo-600' },
    { label: 'Delivered', value: stats?.completedOrders || 0, icon: CheckCircle2, color: 'from-green-500 to-teal-600' },
    { label: 'Cancelled', value: stats?.cancelledOrders || 0, icon: XCircle, color: 'from-red-500 to-rose-600' },
    { label: 'Revenue (₹)', value: stats?.totalRevenue || 0, icon: DollarSign, color: 'from-purple-500 to-pink-600' },
    { label: 'Users', value: stats?.totalUsers || 0, icon: Users, color: 'from-cyan-500 to-blue-600' },
    { label: 'Inquiries', value: stats?.totalInquiries || 0, icon: Microscope, color: 'from-orange-500 to-red-600' },
  ];

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      IN_PRODUCTION: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      QUALITY_CONTROL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      SHIPPED: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      DELIVERED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
      NEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      CONTACTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      IN_PROGRESS: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      CLOSED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return m[s] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview of all prototyping services</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-[#111] border border-[#222] rounded-xl p-5 hover:border-[#333] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                <c.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{typeof c.value === 'number' && c.label.includes('Revenue') ? `₹${(c.value / 100).toLocaleString()}` : c.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders + Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders */}
        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00cc55]" />
            <h3 className="font-bold text-sm">Recent Orders</h3>
          </div>
          <div className="divide-y divide-[#222]">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                <AlertCircle className="w-5 h-5" /> No orders yet
              </div>
            ) : recentOrders.slice(0, 8).map((o: any) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between text-sm hover:bg-white/[0.02]">
                <div>
                  <p className="font-semibold text-white font-mono text-xs">{o.orderRef}</p>
                  <p className="text-gray-500 text-xs">{o.firstName} {o.lastName} · {o.serviceType}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#00cc55] text-xs">₹{(o.totalAmount / 100).toFixed(0)}</span>
                  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusBadge(o.orderStatus)}`}>
                    {o.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inquiries */}
        <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222] flex items-center gap-2">
            <Microscope className="w-4 h-4 text-[#00cc55]" />
            <h3 className="font-bold text-sm">Recent Inquiries</h3>
          </div>
          <div className="divide-y divide-[#222]">
            {recentInquiries.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                <AlertCircle className="w-5 h-5" /> No inquiries yet
              </div>
            ) : recentInquiries.map((inq: any) => (
              <div key={inq.id} className="px-5 py-3 flex items-center justify-between text-sm hover:bg-white/[0.02]">
                <div>
                  <p className="font-semibold text-white text-xs">{inq.name}</p>
                  <p className="text-gray-500 text-xs">{inq.serviceType === 'SEM_TEM' ? 'SEM/TEM' : inq.serviceType === 'PCB_DESIGN' ? 'PCB Design' : 'Project Dev'} · {inq.inquiryType.replace(/_/g, ' ')}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${statusBadge(inq.status)}`}>
                  {inq.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
