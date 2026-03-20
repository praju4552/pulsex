import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, AlertTriangle, Cpu, Box, Zap } from 'lucide-react';

const BACKEND_URL = '';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'3d' | 'pcb' | 'laser'>('3d');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pricing3d, setPricing3d] = useState<any>(null);
  const [pricingPcb, setPricingPcb] = useState<any>(null);
  const [pricingLaser, setPricingLaser] = useState<any>(null);

  useEffect(() => { fetchPricing(); }, []);

  const fetchPricing = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('cms_token');
      const res = await fetch(`${BACKEND_URL}/api/cms-admin/pricing`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.pricing) {
        setPricing3d(data.pricing['3d_pricing']);
        setPricingPcb(data.pricing['pcb_pricing']);
        setPricingLaser(data.pricing['laser_pricing']);
      } else { setError(data.error || 'Failed to load pricing.'); }
    } catch (err) { setError('Network error loading pricing.'); }
    finally { setLoading(false); }
  };

  const saveConfig = async (key: string, value: any) => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const token = sessionStorage.getItem('cms_token');
      const res = await fetch(`${BACKEND_URL}/api/cms-admin/pricing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      if (data.success) { setSuccess('Pricing updated.'); setTimeout(() => setSuccess(null), 3000); }
      else { setError(data.error || 'Failed to save.'); }
    } catch (err) { setError('Network error saving.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="w-8 h-8 text-[#00cc55] animate-spin" />
      <span className="text-sm text-gray-400">Loading configurations...</span>
    </div>
  );

  const btnCls = "flex items-center gap-2 px-4 py-2.5 bg-[#00cc55] hover:bg-[#00ba4d] text-black font-bold rounded-xl text-sm transition-all disabled:opacity-50 mt-4";
  const inputCls = "bg-[#222] border border-[#333] rounded-lg px-2 py-1 text-xs text-white text-right outline-none focus:border-[#00cc55] w-24";

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Pricing Configurations</h1>
        <p className="text-sm text-gray-400 mt-1">Manage dynamically fetched rate cards for estimation steps.</p>
      </div>

      {error && <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4" /> {error}</div>}
      {success && <div className="p-4 mb-4 rounded-xl bg-[#00cc55]/10 border border-[#00cc55]/30 text-[#00cc55] flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4" /> {success}</div>}

      <div className="flex gap-2 mb-6 border-b border-[#222]">
        <TabButton active={activeTab === '3d'} onClick={() => setActiveTab('3d')} icon={Box} label="3D Printing" />
        <TabButton active={activeTab === 'laser'} onClick={() => setActiveTab('laser')} icon={Zap} label="Laser Cutting" />
        <TabButton active={activeTab === 'pcb'} onClick={() => setActiveTab('pcb')} icon={Cpu} label="PCB Fabrication" />
      </div>

      <div className="p-6 bg-[#161616] border border-[#222] rounded-2xl">
        {activeTab === '3d' && pricing3d && (
          <div className="space-y-6">
            <Section title="Materials" value={pricing3d.materials} onChange={(v) => setPricing3d({ ...pricing3d, materials: v })} inputCls={inputCls} />
            <Section title="Qualities" value={pricing3d.qualities} onChange={(v) => setPricing3d({ ...pricing3d, qualities: v })} inputCls={inputCls} />
            <Section title="Finishes" value={pricing3d.finishes} onChange={(v) => setPricing3d({ ...pricing3d, finishes: v })} inputCls={inputCls} />
            <button onClick={() => saveConfig('3d_pricing', pricing3d)} disabled={saving} className={btnCls}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save 3D Pricing
            </button>
          </div>
        )}

        {activeTab === 'laser' && pricingLaser && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-white mb-4">Material Rates</h3>
            <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden divide-y divide-[#222]">
              {Object.entries(pricingLaser).map(([key, val]: any) => (
                <div key={key} className="p-3 grid grid-cols-3 gap-4 items-center">
                  <span className="text-sm font-medium text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-gray-500">Base/cm²</span>
                    <input type="number" step="0.01" value={val.basePer_cm2} onChange={(e) => { const n = { ...pricingLaser }; n[key].basePer_cm2 = parseFloat(e.target.value); setPricingLaser(n); }} className={inputCls} />
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[10px] text-gray-500">Engrave% Increase</span>
                    <input type="number" step="0.01" value={val.engravingSurcharge} onChange={(e) => { const n = { ...pricingLaser }; n[key].engravingSurcharge = parseFloat(e.target.value); setPricingLaser(n); }} className={inputCls} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => saveConfig('laser_pricing', pricingLaser)} disabled={saving} className={btnCls}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Laser Pricing
            </button>
          </div>
        )}

        {activeTab === 'pcb' && pricingPcb && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <InputRow label="Base For 5 Pcs" value={pricingPcb.baseFor5} onChange={(v) => setPricingPcb({ ...pricingPcb, baseFor5: parseFloat(v) })} inputCls={inputCls} />
              <InputRow label="Setup Fee" value={pricingPcb.setupFee} onChange={(v) => setPricingPcb({ ...pricingPcb, setupFee: parseFloat(v) })} inputCls={inputCls} />
              <InputRow label="Area Multiplier" value={pricingPcb.areaMult} onChange={(v) => setPricingPcb({ ...pricingPcb, areaMult: parseFloat(v) })} inputCls={inputCls} />
              <InputRow label="Extra DRC" value={pricingPcb.extraDrc} onChange={(v) => setPricingPcb({ ...pricingPcb, extraDrc: parseFloat(v) })} inputCls={inputCls} />
            </div>
            <button onClick={() => saveConfig('pcb_pricing', pricingPcb)} disabled={saving} className={btnCls}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save PCB Pricing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, value, onChange, inputCls }: { title: string; value: any[]; onChange: (v: any[]) => void; inputCls: string }) {
  if (!value) return null;
  return (
    <div>
      <h3 className="text-base font-bold text-white mb-3">{title}</h3>
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden divide-y divide-[#222]">
        {value.map((item, idx) => (
          <div key={item.id || idx} className="p-3 grid grid-cols-4 gap-4 items-center">
            <span className="text-sm text-gray-300 font-medium capitalize">{item.name || item.id}</span>
            {item.density !== undefined && <Input inputLabel="Density" value={item.density} onChange={(v) => { const n = [...value]; n[idx].density = parseFloat(v); onChange(n); }} inputCls={inputCls} />}
            {item.baseCost !== undefined && <Input inputLabel="Cost/g" value={item.baseCost} onChange={(v) => { const n = [...value]; n[idx].baseCost = parseFloat(v); onChange(n); }} inputCls={inputCls} />}
            {item.costMult !== undefined && <Input inputLabel="Multiplier" value={item.costMult} onChange={(v) => { const n = [...value]; n[idx].costMult = parseFloat(v); onChange(n); }} inputCls={inputCls} />}
            {item.cost !== undefined && <Input inputLabel="Cost" value={item.cost} onChange={(v) => { const n = [...value]; n[idx].cost = parseFloat(v); onChange(n); }} inputCls={inputCls} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({ inputLabel, value, onChange, inputCls }: { inputLabel: string; value: any; onChange: (v: string) => void; inputCls: string }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="text-[10px] text-gray-500 w-14 text-right">{inputLabel}</span>
      <input type="number" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

function InputRow({ label, value, onChange, inputCls }: { label: string; value: any; onChange: (v: string) => void; inputCls: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input type="number" step="0.01" value={value || 0} onChange={(e) => onChange(e.target.value)} className={`${inputCls} w-full text-left`} />
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${active ? 'border-[#00cc55] text-[#00cc55]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
