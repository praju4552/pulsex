import { useState, useEffect } from 'react';
import { Package, Search, ChevronRight, Clock, CheckCircle2, Truck, AlertCircle, Loader2, FileDown, FileText, Download } from 'lucide-react';
import { PrototypingHeader } from './PrototypingHeader';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../api/config';

interface Order {
  id: string;
  orderRef: string;
  salesOrderId?: string;
  invoiceId?: string;
  projectId?: string;
  jobId?: string;
  serviceType: string;
  specSummary: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
}

export default function PrototypingOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('prototypingUser') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/prototyping/auth');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/prototyping-orders/my-orders`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id, navigate]);

  const statusIcons: Record<string, any> = {
    PENDING: <Clock className="w-4 h-4" />,
    CONFIRMED: <CheckCircle2 className="w-4 h-4" />,
    IN_PRODUCTION: <Loader2 className="w-4 h-4 animate-spin" />,
    QUALITY_CONTROL: <Search className="w-4 h-4" />,
    SHIPPED: <Truck className="w-4 h-4" />,
    DELIVERED: <CheckCircle2 className="w-4 h-4" />,
    CANCELLED: <AlertCircle className="w-4 h-4" />,
  };

  const statusColors: Record<string, string> = {
    PENDING: 'text-text-secondary bg-zinc-500/10 border-zinc-500/20',
    CONFIRMED: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    IN_PRODUCTION: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    QUALITY_CONTROL: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    SHIPPED: 'text-[#00cc55] bg-[#00cc55]/10 border-[#00cc55]/20',
    DELIVERED: 'text-[#00cc55] bg-[#00cc55]/20 border-[#00cc55]/40',
    CANCELLED: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary selection:bg-[#00cc55]/30">
      <PrototypingHeader />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-12 lg:py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">My Orders</h1>
            <p className="text-text-secondary">Track and manage your manufacturing projects</p>
          </div>
          <button 
            onClick={() => navigate('/prototyping')}
            className="px-6 py-3 bg-[#00cc55]/10 hover:bg-[#00cc55]/20 text-[#00cc55] rounded-xl font-bold transition-all border border-[#00cc55]/20 flex items-center gap-2"
          >
            New Project <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-[#00cc55] animate-spin" />
            <p className="text-text-muted font-medium">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-32 bg-glass-bg border border-border-glass rounded-3xl flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No orders yet</h3>
            <p className="text-text-muted max-w-sm mb-8">You haven't placed any prototyping orders. Start your first project today!</p>
            <button 
              onClick={() => navigate('/prototyping')}
              className="px-8 py-4 bg-[#00cc55] text-black font-black uppercase tracking-wider rounded-2xl hover:bg-[#00cc55]/90 transition-all shadow-[0_0_20px_rgba(0,204,85,0.3)]"
            >
              Start Prototyping
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="group p-6 md:p-8 bg-glass-bg border border-border-glass hover:border-[#00cc55]/30 rounded-3xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 cursor-pointer"
                onClick={() => navigate(`/prototyping/track?ref=${order.orderRef}`)}
              >
                <div className="flex gap-6 items-center">
                  <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center border border-border-glass group-hover:bg-[#00cc55]/10 group-hover:border-[#00cc55]/20 transition-all">
                    <Package className="w-8 h-8 text-text-muted group-hover:text-[#00cc55] transition-colors" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold group-hover:text-[#00cc55] transition-colors">{order.serviceType}</h3>
                      <span className="font-mono text-[10px] text-text-muted px-2 py-0.5 bg-bg-primary/60 rounded border border-border-glass">{order.orderRef}</span>
                    </div>
                    <p className="text-sm text-text-muted mb-2 max-w-md line-clamp-1">{order.specSummary}</p>
                    <div className="flex items-center gap-4 text-xs text-zinc-600">
                      <span>{new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                      <span>Total: ₹{order.totalAmount / 100}</span>
                      {order.projectId && (
                        <>
                          <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                          <span className="text-text-muted">PID: {order.projectId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border-glass">
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest ${statusColors[order.orderStatus] || statusColors.PENDING}`}>
                      {statusIcons[order.orderStatus] || statusIcons.PENDING}
                      {order.orderStatus.replace('_', ' ')}
                    </div>
                    
                    <div className="flex gap-2">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`${API_BASE_URL}/prototyping-orders/${order.id}/download?type=SALES_ORDER&token=${user.token}`, '_blank');
                        }}
                        className="p-2 bg-surface-100 hover:bg-surface-200 text-text-secondary rounded-lg border border-border-glass transition-all flex items-center gap-1.5 text-[10px] font-bold"
                        title="Download Sales Order"
                      >
                        <FileText className="w-3 h-3" /> SO
                      </button>
                      <button 
                         onClick={(e) => {
                          e.stopPropagation();
                          window.open(`${API_BASE_URL}/prototyping-orders/${order.id}/download?type=INVOICE&token=${user.token}`, '_blank');
                        }}
                        className="p-2 bg-surface-100 hover:bg-surface-200 text-[#00cc55] rounded-lg border border-[#00cc55]/20 transition-all flex items-center gap-1.5 text-[10px] font-bold"
                        title="Download Tax Invoice"
                      >
                        <FileDown className="w-3 h-3" /> INV
                      </button>
                      {order.serviceType === '3D Printing' && (order as any).specifications?.fileId && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const fileId = (order as any).specifications.fileId;
                            window.open(`${API_BASE_URL}/three-d-printing/download/${fileId}?token=${user.token}`, '_blank');
                          }}
                          className="p-2 bg-[#00cc55]/10 hover:bg-[#00cc55]/20 text-[#00cc55] rounded-lg border border-[#00cc55]/20 transition-all flex items-center gap-1.5 text-[10px] font-bold"
                          title="Download 3D Model"
                        >
                          <Download className="w-3 h-3" /> 3D
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#00cc55] text-sm font-bold group-hover:translate-x-1 transition-transform self-end">
                    View Details <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
