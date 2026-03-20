import { useState, useEffect } from 'react';
import { PrototypingHeader } from './PrototypingHeader';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Package, Search, ChevronRight, Settings, Shield, Clock, Loader2, MapPin } from 'lucide-react';

interface OrderSummary {
  id: string;
  orderRef: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
}

export default function PrototypingAccount() {
  const [lastOrder, setLastOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('prototypingUser') || 'null'));

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    streetAddress: user?.streetAddress || '',
    apartment: user?.apartment || '',
    city: user?.city || '',
    state: user?.state || '',
    zip: user?.zip || '',
    country: user?.country || 'IN',
  });

  useEffect(() => {
    if (!user) {
      navigate('/prototyping/auth');
      return;
    }

    const fetchLastOrder = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('prototypingUser') || '{}').token;
        const res = await fetch(`http://localhost:3001/api/prototyping-orders/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        if (data && data.length > 0) {
          setLastOrder(data[0]); // Most recent
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLastOrder();
  }, [user?.id, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('prototypingUser') || '{}');
      const token = storedUser.token;

      const res = await fetch('http://localhost:3001/api/prototyping-auth/update-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)  // No userId - backend reads from JWT
      });

      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      
      // Preserve existing token when updating localStorage - critical!
      const updatedUser = { ...data.user, token: storedUser.token };
      localStorage.setItem('prototypingUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary selection:bg-[#00cc55]/30 flex flex-col">
      <PrototypingHeader />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 lg:py-20 w-full">
        {/* Profile Header */}
        <div className="bg-glass-bg border border-border-glass rounded-[2.5rem] p-8 md:p-12 mb-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00cc55]/5 blur-[100px] -mr-32 -mt-32" />
          
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-[#00cc55]/20 to-black border border-[#00cc55]/30 flex items-center justify-center shadow-[0_0_40px_rgba(0,204,85,0.15)]">
                <User className="w-16 h-16 md:w-20 md:h-20 text-[#00cc55]" />
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-[#00cc55] rounded-full border-4 border-[#080c09] flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-black" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="space-y-4 max-w-md mx-auto md:mx-0">
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-3 text-2xl font-bold text-text-primary focus:outline-none focus:border-[#00cc55] transition-all"
                    placeholder="Your Name"
                  />
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 bg-surface-100 px-4 py-2 rounded-xl border border-border-glass">
                      <Mail className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-zinc-300">{user.email}</span>
                    </div>
                    <input 
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-[#00cc55] transition-all"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{user.name}</h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-text-secondary">
                    <div className="flex items-center gap-2 bg-surface-100 px-4 py-2 rounded-full border border-border-glass">
                      <Mail className="w-4 h-4 text-[#00cc55]" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-100 px-4 py-2 rounded-full border border-border-glass">
                      <Phone className="w-4 h-4 text-[#00cc55]" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-xl border border-border-glass hover:bg-surface-100 transition-all text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-[#00cc55] text-black rounded-xl font-bold hover:bg-[#00cc55]/90 transition-all text-sm flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-4 bg-surface-100 border border-border-glass rounded-2xl hover:bg-surface-100 transition-all text-text-secondary hover:text-text-primary"
                >
                  <Settings className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            {/* Address Section */}
            <div className="bg-glass-bg border border-border-glass rounded-[2rem] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#00cc55]" /> Shipping Address
                </h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-[#00cc55] text-xs font-bold hover:underline">Edit</button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <input 
                    type="text"
                    value={formData.streetAddress}
                    onChange={e => setFormData({...formData, streetAddress: e.target.value})}
                    placeholder="Street Address"
                    className="w-full bg-bg-primary/60 border border-border-glass rounded-xl px-4 py-2 text-sm focus:border-[#00cc55] focus:outline-none"
                  />
                  <input 
                    type="text"
                    value={formData.apartment}
                    onChange={e => setFormData({...formData, apartment: e.target.value})}
                    placeholder="Apartment (Optional)"
                    className="w-full bg-bg-primary/60 border border-border-glass rounded-xl px-4 py-2 text-sm focus:border-[#00cc55] focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      placeholder="City"
                      className="w-full bg-bg-primary/60 border border-border-glass rounded-xl px-4 py-2 text-sm focus:border-[#00cc55] focus:outline-none"
                    />
                    <input 
                      type="text"
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                      placeholder="State"
                      className="w-full bg-bg-primary/60 border border-border-glass rounded-xl px-4 py-2 text-sm focus:border-[#00cc55] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text"
                      value={formData.zip}
                      onChange={e => setFormData({...formData, zip: e.target.value})}
                      placeholder="ZIP"
                      className="w-full bg-bg-primary/60 border border-border-glass rounded-xl px-4 py-2 text-sm focus:border-[#00cc55] focus:outline-none"
                    />
                    <input 
                      type="text"
                      value={formData.country}
                      onChange={e => setFormData({...formData, country: e.target.value})}
                      placeholder="Country"
                      className="w-full bg-bg-primary/60 border border-border-glass rounded-xl px-4 py-2 text-sm focus:border-[#00cc55] focus:outline-none"
                    />
                  </div>
                </div>
              ) : user.streetAddress ? (
                <div className="space-y-1 text-text-secondary text-sm">
                  <p className="text-text-primary font-medium">{user.streetAddress}</p>
                  {user.apartment && <p>{user.apartment}</p>}
                  <p>{user.city}, {user.state} {user.zip}</p>
                  <p className="text-text-muted uppercase tracking-widest text-[10px] pt-1">{user.country}</p>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border-glass rounded-2xl">
                  <p className="text-text-muted text-xs mb-3">No address saved yet</p>
                  <button onClick={() => setIsEditing(true)} className="text-[#00cc55] text-xs font-black uppercase tracking-wider">Add Address</button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold px-2">Quick Access</h2>
              <div className="grid grid-cols-1 gap-4">
                <Link 
                  to="/prototyping/orders"
                  className="group flex items-center justify-between p-6 bg-glass-bg border border-border-glass hover:border-[#00cc55]/30 rounded-[2rem] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#00cc55]/10 rounded-xl flex items-center justify-center border border-[#00cc55]/20">
                      <Package className="w-5 h-5 text-[#00cc55]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">My Orders</h3>
                      <p className="text-[10px] text-text-muted">History & Invoices</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-[#00cc55] group-hover:translate-x-1 transition-all" />
                </Link>

                <Link 
                  to="/prototyping/track"
                  className="group flex items-center justify-between p-6 bg-glass-bg border border-border-glass hover:border-[#00cc55]/30 rounded-[2rem] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#00cc55]/10 rounded-xl flex items-center justify-center border border-[#00cc55]/20">
                      <Search className="w-5 h-5 text-[#00cc55]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Track Order</h3>
                      <p className="text-[10px] text-text-muted">Real-time status</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-[#00cc55] group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity / Last Order */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold px-2">Latest Project</h2>
            
            {loading ? (
              <div className="h-64 bg-glass-bg border border-border-glass rounded-[2rem] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-[#00cc55] animate-spin" />
                <p className="text-text-muted text-sm">Synchronizing your data...</p>
              </div>
            ) : lastOrder ? (
              <div 
                onClick={() => navigate(`/prototyping/track?ref=${lastOrder.orderRef}`)}
                className="group p-8 bg-glass-bg border border-border-glass hover:border-[#00cc55]/30 rounded-[2.5rem] transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#00cc55]/5 blur-[60px] -mb-16 -mr-16" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="px-3 py-1 bg-[#00cc55]/10 border border-[#00cc55]/20 text-[#00cc55] text-[10px] font-black uppercase tracking-widest rounded-full">Active</span>
                       <span className="font-mono text-xs text-text-muted">Ref: {lastOrder.orderRef}</span>
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Order Summary</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Status</p>
                    <p className="text-[#00cc55] font-black text-2xl italic tracking-tight">{lastOrder.orderStatus.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 pt-8 border-t border-border-glass">
                  <div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Total Paid</p>
                    <p className="text-xl font-bold">₹{lastOrder.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Placed On</p>
                    <p className="text-xl font-bold">{new Date(lastOrder.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Updates</p>
                    <p className="text-text-secondary flex items-center gap-2"><Clock className="w-4 h-4" /> Real-time</p>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                  <div className="w-[60%] h-full bg-[#00cc55] shadow-[0_0_10px_rgba(0,204,85,0.5)]" />
                </div>
                <div className="flex justify-between mt-2">
                   <p className="text-[10px] text-zinc-600 font-bold">PROVISIONING</p>
                   <p className="text-[10px] text-[#00cc55] font-black">IN PROGRESS</p>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] py-12 bg-glass-bg border border-border-glass rounded-[2.5rem] flex flex-col items-center justify-center text-center px-6 border-dashed">
                <div className="w-20 h-20 bg-surface-100 rounded-full flex items-center justify-center mb-6">
                  <Package className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 uppercase italic tracking-tighter">No Active Projects</h3>
                <p className="text-text-muted max-w-sm mb-8">You haven't placed any prototyping orders yet. Ready to start your next big thing?</p>
                <Link 
                  to="/prototyping"
                  className="px-10 py-4 bg-[#00cc55] text-black font-black uppercase tracking-wider rounded-2xl hover:bg-[#00cc55]/90 transition-all shadow-[0_0_25px_rgba(0,204,85,0.3)]"
                >
                  Create New Order
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
