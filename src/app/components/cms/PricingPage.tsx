import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, AlertTriangle, Cpu, Box, Zap, RotateCcw } from 'lucide-react';
import { API_BASE_URL } from '../../../api/config';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'3d' | 'pcb' | 'laser'>('pcb');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pricing3d, setPricing3d] = useState<any>(null);
  const [pricingPcb, setPricingPcb] = useState<any>(null);
  const [pricingLaser, setPricingLaser] = useState<any>(null);

  useEffect(() => { fetchPricing(); }, []);

  const fetchPricing = async () => {
    setLoading(true); setError(null);
    try {
      const token = sessionStorage.getItem('cms_token');
      const res = await fetch(`${API_BASE_URL}/cms-admin/pricing`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.pricing) {
        setPricing3d(data.pricing['3d_pricing']);
        setPricingPcb(data.pricing['pcb_pricing']);
        setPricingLaser(data.pricing['laser_pricing']);
      } else { setError(data.error || 'Failed to load pricing.'); }
    } catch { setError('Network error loading pricing.'); }
    finally { setLoading(false); }
  };

  const saveConfig = async (key: string, value: any) => {
    setSaving(key); setError(null); setSuccess(null);
    try {
      const token = sessionStorage.getItem('cms_token');
      const res = await fetch(`${API_BASE_URL}/cms-admin/pricing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (data.success) { setSuccess(`${key} pricing saved successfully.`); setTimeout(() => setSuccess(null), 4000); }
      else { setError(data.error || 'Failed to save.'); }
    } catch { setError('Network error saving.'); }
    finally { setSaving(null); }
  };

  const isSaving = (key: string) => saving === key;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="w-8 h-8 text-[#00cc55] animate-spin" />
      <span className="text-sm text-gray-400">Loading configurations...</span>
    </div>
  );

  const btnCls = (_key: string) => `flex items-center gap-2 px-4 py-2.5 bg-[#00cc55] hover:bg-[#00ba4d] text-black font-bold rounded-xl text-sm transition-all disabled:opacity-50 mt-4`;
  const inputCls = "bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white text-right outline-none focus:border-[#00cc55] w-28 transition-colors";
  const rowCls = "flex items-center justify-between py-2.5 px-3 hover:bg-white/[0.02] rounded-lg transition-colors";
  const labelCls = "text-sm text-gray-300 font-medium";

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Pricing Configurations</h1>
            <p className="text-sm text-gray-400 mt-1">
              Source: <span className="font-mono text-[#00cc55]">PulseX_Pricing_Matrix + gst(Last).xlsx</span>
              &nbsp;— GST (18%) is added at display time and is <strong className="text-white">not</strong> stored here.
            </p>
          </div>
          <button onClick={fetchPricing} className="flex items-center gap-2 px-3 py-2 border border-[#333] rounded-lg text-xs text-gray-400 hover:border-[#00cc55]/40 hover:text-white transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
      {success && <div className="p-4 mb-4 rounded-xl bg-[#00cc55]/10 border border-[#00cc55]/30 text-[#00cc55] flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}</div>}

      <div className="flex gap-2 mb-6 border-b border-[#222]">
        <TabButton active={activeTab === 'pcb'} onClick={() => setActiveTab('pcb')} icon={Cpu} label="PCB Fabrication" />
        <TabButton active={activeTab === '3d'} onClick={() => setActiveTab('3d')} icon={Box} label="3D Printing" />
        <TabButton active={activeTab === 'laser'} onClick={() => setActiveTab('laser')} icon={Zap} label="Laser Cutting" />
      </div>

      {/* ── PCB TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'pcb' && pricingPcb && (
        <div className="space-y-6">
          <div className="p-5 bg-[#161616] border border-[#222] rounded-2xl">
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              <strong className="text-gray-300">Formula:</strong> pricePerBoard = (baseCost + area_cm² × costPerCm2) × layerMult × materialMult × thicknessMult × colorMult × finishMult × copperMult. Then × qty, plus advanced flat fees. GST 18% added at display time.
            </p>

            {/* Base Parameters */}
            <Section title="Base Parameters">
              <div className="grid grid-cols-2 gap-3">
                <ScalarRow label="Setup Fee (INR)" value={pricingPcb.baseCost} inputCls={inputCls}
                  onChange={v => setPricingPcb({ ...pricingPcb, baseCost: parseFloat(v) })} />
                <ScalarRow label="Cost per cm² (INR)" value={pricingPcb.costPerCm2} inputCls={inputCls}
                  onChange={v => setPricingPcb({ ...pricingPcb, costPerCm2: parseFloat(v) })} />
              </div>
            </Section>

            {/* Layer Multipliers */}
            <Section title="Layer Count Multipliers">
              <MultiplierTable
                data={pricingPcb.layerMult || {}}
                inputCls={inputCls} rowCls={rowCls} labelCls={labelCls}
                keyLabel="Layers" suffix="L"
                onChange={k => v => setPricingPcb({ ...pricingPcb, layerMult: { ...pricingPcb.layerMult, [k]: parseFloat(v) } })}
              />
            </Section>

            {/* Material Multipliers */}
            <Section title="Material Multipliers">
              <MultiplierTable
                data={pricingPcb.materialMult || {}}
                inputCls={inputCls} rowCls={rowCls} labelCls={labelCls}
                onChange={k => v => setPricingPcb({ ...pricingPcb, materialMult: { ...pricingPcb.materialMult, [k]: parseFloat(v) } })}
              />
            </Section>

            {/* Thickness Multipliers */}
            <Section title="PCB Thickness Multipliers">
              <MultiplierTable
                data={pricingPcb.thicknessMult || {}}
                inputCls={inputCls} rowCls={rowCls} labelCls={labelCls}
                onChange={k => v => setPricingPcb({ ...pricingPcb, thicknessMult: { ...pricingPcb.thicknessMult, [k]: parseFloat(v) } })}
              />
            </Section>

            {/* Color Multipliers */}
            <Section title="Solder Mask Color Multipliers">
              <MultiplierTable
                data={pricingPcb.colorMult || {}}
                inputCls={inputCls} rowCls={rowCls} labelCls={labelCls}
                onChange={k => v => setPricingPcb({ ...pricingPcb, colorMult: { ...pricingPcb.colorMult, [k]: parseFloat(v) } })}
              />
            </Section>

            {/* Finish Multipliers */}
            <Section title="Surface Finish Multipliers">
              <MultiplierTable
                data={pricingPcb.finishMult || {}}
                inputCls={inputCls} rowCls={rowCls} labelCls={labelCls}
                onChange={k => v => setPricingPcb({ ...pricingPcb, finishMult: { ...pricingPcb.finishMult, [k]: parseFloat(v) } })}
              />
            </Section>

            {/* Copper Weight Multipliers */}
            <Section title="Copper Weight Multipliers">
              <MultiplierTable
                data={pricingPcb.copperMult || {}}
                inputCls={inputCls} rowCls={rowCls} labelCls={labelCls}
                onChange={k => v => setPricingPcb({ ...pricingPcb, copperMult: { ...pricingPcb.copperMult, [k]: parseFloat(v) } })}
              />
            </Section>

            {/* Advanced Flat Fees */}
            <Section title="Advanced Option Flat Fees (INR, per order)">
              <div className="space-y-1">
                {Object.entries(pricingPcb.advancedFees || {}).map(([k, v]: any) => (
                  <div key={k} className={rowCls}>
                    <span className={labelCls + " capitalize"}>{k.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-600">₹</span>
                      <input type="number" step="50" value={v}
                        onChange={e => setPricingPcb({ ...pricingPcb, advancedFees: { ...pricingPcb.advancedFees, [k]: parseFloat(e.target.value) } })}
                        className={inputCls} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <button onClick={() => saveConfig('pcb_pricing', pricingPcb)} disabled={!!saving} className={btnCls('pcb_pricing')}>
              {isSaving('pcb_pricing') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save PCB Pricing
            </button>
          </div>
        </div>
      )}

      {/* ── 3D TAB ─────────────────────────────────────────────────────── */}
      {activeTab === '3d' && pricing3d && (
        <div className="space-y-6">
          <div className="p-5 bg-[#161616] border border-[#222] rounded-2xl">
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              <strong className="text-gray-300">Formula:</strong> (baseSetupFee + volume_cm³ × costPerCm3 × materialMult × qualityMult) × infillStepMult^steps + finishFlatFee + [customColorFee]
            </p>

            <Section title="Base Parameters">
              <div className="grid grid-cols-2 gap-3">
                <ScalarRow label="Setup Fee (INR)" value={pricing3d.baseSetupFee ?? 50} inputCls={inputCls}
                  onChange={v => setPricing3d({ ...pricing3d, baseSetupFee: parseFloat(v) })} />
                <ScalarRow label="Cost per cm³ (INR)" value={pricing3d.costPerCm3 ?? 5} inputCls={inputCls}
                  onChange={v => setPricing3d({ ...pricing3d, costPerCm3: parseFloat(v) })} />
                <ScalarRow label="Infill Step Multiplier" value={pricing3d.infillStepMult ?? 1.05} inputCls={inputCls}
                  onChange={v => setPricing3d({ ...pricing3d, infillStepMult: parseFloat(v) })} />
                <ScalarRow label="Custom Color Fee (INR)" value={pricing3d.customColorFee ?? 100} inputCls={inputCls}
                  onChange={v => setPricing3d({ ...pricing3d, customColorFee: parseFloat(v) })} />
              </div>
            </Section>

            <Section title="Materials">
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden divide-y divide-[#1a1a1a]">
                {(pricing3d.materials || []).map((item: any, idx: number) => (
                  <div key={item.id} className="p-3 grid grid-cols-5 gap-3 items-center">
                    <span className="text-sm text-gray-300 font-medium">{item.name}</span>
                    <div className="flex items-center gap-1 justify-end col-span-1">
                      <span className="text-[10px] text-gray-600">Density</span>
                      <input type="number" step="0.01" value={item.density}
                        onChange={e => { const n = [...pricing3d.materials]; n[idx] = { ...n[idx], density: parseFloat(e.target.value) }; setPricing3d({ ...pricing3d, materials: n }); }}
                        className={inputCls} />
                    </div>
                    <div className="flex items-center gap-1 justify-end col-span-1">
                      <span className="text-[10px] text-gray-600">₹/g</span>
                      <input type="number" step="0.01" value={item.baseCost}
                        onChange={e => { const n = [...pricing3d.materials]; n[idx] = { ...n[idx], baseCost: parseFloat(e.target.value) }; setPricing3d({ ...pricing3d, materials: n }); }}
                        className={inputCls} />
                    </div>
                    <div className="flex items-center gap-1 justify-end col-span-2">
                      <span className="text-[10px] text-gray-600">Mult</span>
                      <input type="number" step="0.05" value={item.costMult ?? 1.0}
                        onChange={e => { const n = [...pricing3d.materials]; n[idx] = { ...n[idx], costMult: parseFloat(e.target.value) }; setPricing3d({ ...pricing3d, materials: n }); }}
                        className={inputCls} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Print Quality Multipliers">
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden divide-y divide-[#1a1a1a]">
                {(pricing3d.qualities || []).map((item: any, idx: number) => (
                  <div key={item.id} className="p-3 grid grid-cols-4 gap-3 items-center">
                    <div>
                      <span className="text-sm text-gray-300 font-medium block">{item.name}</span>
                      <span className="text-[10px] text-gray-600">{item.label || `${item.layerHeight}mm`}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-[10px] text-gray-600">Layer h.</span>
                      <input type="number" step="0.01" value={item.layerHeight}
                        onChange={e => { const n = [...pricing3d.qualities]; n[idx] = { ...n[idx], layerHeight: parseFloat(e.target.value) }; setPricing3d({ ...pricing3d, qualities: n }); }}
                        className={inputCls} />
                    </div>
                    <div className="flex items-center gap-1 justify-end col-span-2">
                      <span className="text-[10px] text-gray-600">Cost Mult</span>
                      <input type="number" step="0.05" value={item.costMult}
                        onChange={e => { const n = [...pricing3d.qualities]; n[idx] = { ...n[idx], costMult: parseFloat(e.target.value) }; setPricing3d({ ...pricing3d, qualities: n }); }}
                        className={inputCls} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Post-Processing Flat Fees (INR)">
              <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden divide-y divide-[#1a1a1a]">
                {(pricing3d.finishes || []).map((item: any, idx: number) => (
                  <div key={item.id} className={rowCls}>
                    <span className={labelCls}>{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-600">₹</span>
                      <input type="number" step="50" value={item.cost}
                        onChange={e => { const n = [...pricing3d.finishes]; n[idx] = { ...n[idx], cost: parseFloat(e.target.value) }; setPricing3d({ ...pricing3d, finishes: n }); }}
                        className={inputCls} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <button onClick={() => saveConfig('3d_pricing', pricing3d)} disabled={!!saving} className={btnCls('3d_pricing')}>
              {isSaving('3d_pricing') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save 3D Pricing
            </button>
          </div>
        </div>
      )}

      {/* ── LASER TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'laser' && pricingLaser && (
        <div className="p-5 bg-[#161616] border border-[#222] rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white mb-4">Material Rates</h3>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden divide-y divide-[#1a1a1a]">
            {Object.entries(pricingLaser).map(([key, val]: any) => (
              <div key={key} className="p-3 grid grid-cols-3 gap-4 items-center">
                <span className="text-sm font-medium text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[10px] text-gray-500">Base/cm²</span>
                  <input type="number" step="0.01" value={val.basePer_cm2}
                    onChange={e => { const n = { ...pricingLaser }; n[key] = { ...n[key], basePer_cm2: parseFloat(e.target.value) }; setPricingLaser(n); }}
                    className={inputCls} />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[10px] text-gray-500">Engrave%</span>
                  <input type="number" step="0.01" value={val.engravingSurcharge}
                    onChange={e => { const n = { ...pricingLaser }; n[key] = { ...n[key], engravingSurcharge: parseFloat(e.target.value) }; setPricingLaser(n); }}
                    className={inputCls} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => saveConfig('laser_pricing', pricingLaser)} disabled={!!saving} className={btnCls('laser_pricing')}>
            {isSaving('laser_pricing') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Laser Pricing
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-bold text-[#00cc55] uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </div>
  );
}

function MultiplierTable({ data, inputCls, rowCls, labelCls, keyLabel, suffix, onChange }:
  { data: Record<string, number>; inputCls: string; rowCls: string; labelCls: string; keyLabel?: string; suffix?: string; onChange: (k: string) => (v: string) => void }) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden divide-y divide-[#1a1a1a]">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className={rowCls}>
          <span className={labelCls}>{keyLabel ? `${keyLabel} ${k}${suffix ?? ''}` : k}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600">×</span>
            <input type="number" step="0.05" value={v} onChange={e => onChange(k)(e.target.value)} className={inputCls} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScalarRow({ label, value, onChange, inputCls }: { label: string; value: number; onChange: (v: string) => void; inputCls: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input type="number" step="0.01" value={value ?? 0} onChange={e => onChange(e.target.value)} className={`${inputCls} w-full text-left`} />
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
