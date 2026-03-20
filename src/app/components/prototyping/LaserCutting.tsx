import { PrototypingHeader } from './PrototypingHeader';
import { PrototypingFAQ } from './PrototypingFAQ';
import { HelpCircle, Upload, Loader2, CheckCircle2, AlertTriangle, Shield, Clock, Info, Ruler } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../api/config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MaterialVariant {
  id: string;
  hex: string;
  label: string;
}

interface MaterialGroup {
  name: string;
  id: string;
  variants: MaterialVariant[];
  thicknesses: number[];
}

// ─── Material Data ─────────────────────────────────────────────────────────────

const MATERIAL_GROUPS: MaterialGroup[] = [
  {
    name: 'ABS 1 Side Textured',
    id: 'abs_textured',
    variants: [
      { id: 'black', hex: '#1a1a1a', label: 'Black' },
      { id: 'black_gloss', hex: '#111111', label: 'Black Gloss' },
    ],
    thicknesses: [2.0, 3.0],
  },
  {
    name: 'Acrylic 2mm',
    id: 'acrylic_2mm',
    variants: [
      { id: 'clear', hex: '#f5f5f5', label: 'Clear' },
      { id: 'black', hex: '#1a1a1a', label: 'Black' },
      { id: 'red', hex: '#cc2200', label: 'Red' },
      { id: 'orange', hex: '#e07700', label: 'Orange' },
      { id: 'yellow', hex: '#e8cc00', label: 'Yellow' },
      { id: 'blue', hex: '#1155cc', label: 'Blue' },
      { id: 'white', hex: '#f0f0f0', label: 'White' },
      { id: 'silver', hex: '#aaaaaa', label: 'Silver' },
    ],
    thicknesses: [2.0],
  },
  {
    name: 'Acrylic 3mm',
    id: 'acrylic_3mm',
    variants: [
      { id: 'clear', hex: '#f5f5f5', label: 'Clear' },
      { id: 'black', hex: '#1a1a1a', label: 'Black' },
      { id: 'red', hex: '#cc2200', label: 'Red' },
      { id: 'orange', hex: '#e07700', label: 'Orange' },
      { id: 'yellow', hex: '#e8cc00', label: 'Yellow' },
      { id: 'blue', hex: '#1155cc', label: 'Blue' },
      { id: 'white', hex: '#f0f0f0', label: 'White' },
      { id: 'silver', hex: '#aaaaaa', label: 'Silver' },
    ],
    thicknesses: [3.0],
  },
  {
    name: 'Acrylic 4mm',
    id: 'acrylic_4mm',
    variants: [
      { id: 'clear', hex: '#f5f5f5', label: 'Clear' },
      { id: 'black', hex: '#1a1a1a', label: 'Black' },
      { id: 'white', hex: '#f0f0f0', label: 'White' },
    ],
    thicknesses: [4.0],
  },
  {
    name: 'Acrylic 5mm',
    id: 'acrylic_5mm',
    variants: [
      { id: 'black', hex: '#1a1a1a', label: 'Black' },
      { id: 'clear', hex: '#f5f5f5', label: 'Clear' },
      { id: 'red', hex: '#cc2200', label: 'Red' },
      { id: 'blue', hex: '#1155cc', label: 'Blue' },
      { id: 'white', hex: '#f0f0f0', label: 'White' },
    ],
    thicknesses: [5.0],
  },
  {
    name: 'Acrylic 6mm',
    id: 'acrylic_6mm',
    variants: [
      { id: 'clear', hex: '#f5f5f5', label: 'Clear' },
      { id: 'black', hex: '#1a1a1a', label: 'Black' },
    ],
    thicknesses: [6.0],
  },
  {
    name: 'MDF',
    id: 'mdf',
    variants: [
      { id: 'natural', hex: '#c8a46e', label: 'Natural' },
      { id: 'light', hex: '#d4b07a', label: 'Light' },
    ],
    thicknesses: [3.0, 4.0, 6.0, 9.0, 12.0],
  },
  {
    name: 'Mirror Acrylic',
    id: 'mirror_acrylic',
    variants: [
      { id: 'gold', hex: '#d4a017', label: 'Gold' },
      { id: 'silver', hex: '#7dd7e8', label: 'Silver' },
    ],
    thicknesses: [3.0],
  },
  {
    name: 'Polycarbonate',
    id: 'polycarbonate',
    variants: [
      { id: 'clear', hex: '#f5f5f5', label: 'Clear' },
    ],
    thicknesses: [2.0, 3.0, 4.0, 5.0],
  },
];

// ─── Helper sub-components ────────────────────────────────────────────────────

function FieldRow({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-4 border-b border-border-glass last:border-0">
      <div className="flex items-center gap-1.5 sm:w-52 flex-shrink-0">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {tooltip && (
          <span title={tooltip} className="cursor-help flex">
            <HelpCircle className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          </span>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function BtnGroup({ opts, value, onChange, labelMap = {} }: { opts: string[]; value: string; onChange: (v: string) => void; labelMap?: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(o => {
        const active = value === o;
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              active
                ? 'border-accent-primary bg-accent-primary/15 text-[#008800] dark:text-accent-primary shadow-[0_0_8px_rgba(0,204,85,0.1)]'
                : 'border-border-glass text-text-secondary bg-surface-100/50 hover:border-accent-primary/40 hover:text-text-primary'
            }`}
          >
            {labelMap[o] || o.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        );
      })}
    </div>
  );
}

// coloured swatch button
function Swatch({ variant, active, onClick }: { variant: MaterialVariant; active: boolean; onClick: (e: React.MouseEvent) => void }) {
  // determine if the swatch needs a border to be visible (light colours)
  const isLight = ['clear', 'white', 'silver'].includes(variant.id);
  return (
    <button
      onClick={onClick}
      title={variant.label}
      className={`w-7 h-7 rounded-md transition-all ring-offset-2 ring-offset-bg-surface ${
        active ? 'ring-2 ring-accent-primary scale-110' : 'hover:scale-105 hover:ring-1 hover:ring-accent-primary/50'
      }`}
      style={{
        backgroundColor: variant.hex,
        border: isLight ? '1px solid rgba(255,255,255,0.2)' : undefined,
        boxShadow: isLight ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : undefined,
      }}
    />
  );
}

// ─── Model Stats helpers ───────────────────────────────────────────────────────

function calcModelStats(width: number, height: number, serviceType: string) {
  const perimeter = 2 * (width + height); // mm
  const totalPathCm = (perimeter / 10).toFixed(2);

  // very rough estimate: 60 mm/s cut speed, 30 mm/s engrave
  const speed = serviceType === 'engraving' ? 30 : 60;
  const totalSec = Math.round(perimeter / speed);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');

  return {
    dimensions: `${width} × ${height} mm`,
    totalPath: `${totalPathCm} cm`,
    printTime: `${hh}:${mm}:${ss}`,
  };
}

// ─── Main Component ──────────────────────────────────────────────────────────────

export default function LaserCutting() {
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string } | null>(null);
  const [parseStatus, setParseStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [serviceType, setServiceType] = useState('cutting');

  // Material selection: group + variant
  const [selectedGroup, setSelectedGroup] = useState<MaterialGroup>(MATERIAL_GROUPS[2]); // Acrylic 3mm default
  const [selectedVariant, setSelectedVariant] = useState<MaterialVariant>(MATERIAL_GROUPS[2].variants[0]);
  const [thickness, setThickness] = useState(3.0);

  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [finish, setFinish] = useState('standard');
  const [urgency, setUrgency] = useState('standard');

  const [priceDetails, setPriceDetails] = useState<{ total: number; unitPrice: number } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // When group changes → reset variant and thickness
  const handleGroupSelect = (group: MaterialGroup) => {
    setSelectedGroup(group);
    setSelectedVariant(group.variants[0]);
    setThickness(group.thicknesses[0]);
  };

  // Model Stats computed
  const modelStats = useMemo(() => calcModelStats(width, height, serviceType), [width, height, serviceType]);

  const materialKey = selectedGroup.id;

  // Auto-fetch price
  useEffect(() => {
    async function fetchPrice() {
      setLoadingPrice(true);
      try {
        const res = await fetch(`${API_BASE_URL}/laser-cutting/calculate-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceType,
            material: materialKey,
            thickness,
            width,
            height,
            quantity,
            urgency,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setPriceDetails({
            total: data.pricing.total / 100,
            unitPrice: data.pricing.unitPrice / 100,
          });
        }
      } catch (err) {
        console.error('Failed to calculate price', err);
      } finally {
        setLoadingPrice(false);
      }
    }
    fetchPrice();
  }, [serviceType, materialKey, thickness, width, height, quantity, urgency]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseStatus('uploading');
    setErrorMessage('');
    const formData = new FormData();
    formData.append('designFile', file);
    try {
      const res = await fetch(`${API_BASE_URL}/laser-cutting/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Server returned an error.');
      setUploadedFile({ id: data.fileId, name: data.fileName });
      setParseStatus('success');
    } catch (err) {
      setParseStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed.');
    }
    e.target.value = '';
  };

  const handleSaveToCart = () => {
    if (!uploadedFile) { alert('Please upload a design file first.'); return; }
    const cartItem = {
      id: Date.now().toString(),
      type: 'Laser Cutting',
      spec: `${serviceType.toUpperCase()} | ${selectedGroup.name} (${selectedVariant.label}) | ${thickness}mm | ${width}×${height}mm`,
      fullSpec: {
        fileId: uploadedFile.id, fileName: uploadedFile.name,
        serviceType, material: materialKey, colorVariant: selectedVariant.id,
        thickness, width, height, quantity, finish, urgency,
      },
      qty: quantity,
      pcbPrice: priceDetails?.total || 0,
      shippingMethod: 'Standard',
      shippingCost: 0,
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    };
    let cart: object[] = [];
    try { const saved = localStorage.getItem('prototyping_cart'); if (saved) cart = JSON.parse(saved); } catch {}
    cart.push(cartItem);
    localStorage.setItem('prototyping_cart', JSON.stringify(cart));
    navigate('/prototyping/cart');
  };

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <PrototypingHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-4">
        <div className="inline-block px-4 py-1.5 bg-[#00cc55]/10 rounded-full border border-[#00cc55]/20 text-[#00cc55] font-medium text-xs mb-3">
          Laser Cutting & Engraving
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Laser Configurator</h1>
        <p className="text-text-secondary text-sm mt-1">High-precision cutting and raster engraving quotes</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 space-y-6">

            {/* Upload Drop Zone */}
            <div
              onClick={() => parseStatus !== 'uploading' && ref.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all group bg-surface-100 ${
                parseStatus === 'uploading' ? 'border-accent-primary/60 cursor-wait' :
                parseStatus === 'success'   ? 'border-accent-primary/50 cursor-pointer hover:border-accent-primary' :
                parseStatus === 'error'     ? 'border-red-500/40 cursor-pointer hover:border-red-400/60' :
                'border-border-glass cursor-pointer hover:border-accent-primary/40 hover:bg-accent-primary/[0.03]'
              }`}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border transition-all ${
                parseStatus === 'uploading' ? 'bg-[#00cc55]/10 border-[#00cc55]/30 animate-pulse' :
                parseStatus === 'success'   ? 'bg-[#00cc55]/15 border-[#00cc55]/30' :
                parseStatus === 'error'     ? 'bg-red-500/10 border-red-500/30' :
                'bg-[#00cc55]/10 border-[#00cc55]/20 group-hover:scale-105'
              }`}>
                {parseStatus === 'uploading' ? <Loader2 className="w-7 h-7 text-[#00cc55] animate-spin" /> :
                 parseStatus === 'success'   ? <CheckCircle2 className="w-7 h-7 text-[#00cc55]" /> :
                 parseStatus === 'error'     ? <AlertTriangle className="w-7 h-7 text-red-400" /> :
                 <Upload className="w-7 h-7 text-[#00cc55]" />}
              </div>
              {parseStatus === 'uploading' ? <p className="font-bold text-[#00cc55] mb-1">Uploading design file…</p> :
               parseStatus === 'success'   ? <p className="font-bold text-text-primary mb-0.5">{uploadedFile?.name}</p> :
               parseStatus === 'error'     ? <p className="font-bold text-red-400">{errorMessage || 'Upload failed'}</p> :
               <button className="px-6 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-black font-bold rounded-full text-sm transition-colors mb-3">+ Add Design File</button>}
              <p className="text-xs text-text-muted mt-2">Accept DXF, SVG, PDF, AI, EPS, PNG, JPG, BMP. Max 50 MB</p>
              <p className="text-xs text-text-placeholder mt-1 flex items-center justify-center gap-1"><Shield className="w-3 h-3" /> Secure and confidential.</p>
              <input ref={ref} type="file" className="hidden" onChange={handleFileChange} />
            </div>

            {/* ── Model Stats card — shown only after successful upload ── */}
            {parseStatus === 'success' && (
              <div className="rounded-2xl border border-[#00cc55]/30 bg-bg-surface overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="px-5 py-3 border-b border-border-glass flex items-center gap-2 bg-[#00cc55]/5">
                  <Ruler className="w-4 h-4 text-accent-primary" />
                  <span className="font-bold text-sm text-text-primary">Model Stats</span>
                  <span className="ml-auto text-[10px] font-bold text-[#00cc55] bg-[#00cc55]/10 px-2 py-0.5 rounded-full border border-[#00cc55]/20 uppercase tracking-wide">Computed</span>
                </div>
                <div className="divide-y divide-border-glass">
                  {[
                    { label: 'Model Dimensions', value: modelStats.dimensions },
                    { label: 'Total Path', value: modelStats.totalPath },
                    { label: 'Print Time  (hh:mm:ss)', value: modelStats.printTime },
                  ].map(row => (
                    <div key={row.label} className="flex items-center px-5 py-3 text-sm">
                      <span className="w-52 text-text-secondary font-medium">{row.label}</span>
                      <span className="font-bold text-text-primary font-mono">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Material Picker ── */}
            <div className="rounded-2xl border border-border-glass bg-bg-surface overflow-hidden shadow-sm">

              {/* Selected material badge */}
              <div className="px-5 py-3 border-b border-border-glass flex items-center gap-3 bg-surface-100/60">
                <span className="font-bold text-sm text-text-primary">① Material</span>
                {selectedVariant && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border-glass bg-surface-100 text-xs text-text-secondary font-medium">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: selectedVariant.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)' }} />
                    Material : {selectedGroup.name} — {selectedVariant.label}
                  </div>
                )}
              </div>

              {/* Grid of material rows */}
              <div className="p-4 space-y-1">
                {MATERIAL_GROUPS.map(group => {
                  const isGroupActive = selectedGroup.id === group.id;
                  return (
                    <div
                      key={group.id}
                      className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                        isGroupActive
                          ? 'bg-accent-primary/10 border border-accent-primary/25'
                          : 'hover:bg-surface-100 border border-transparent'
                      }`}
                      onClick={() => handleGroupSelect(group)}
                    >
                      {/* Material name */}
                      <span className={`w-36 text-sm font-semibold flex-shrink-0 ${isGroupActive ? 'text-accent-primary' : 'text-text-secondary'}`}>
                        {group.name}
                      </span>
                      {/* Color swatches */}
                      <div className="flex flex-wrap gap-1.5">
                        {group.variants.map(v => (
                          <Swatch
                            key={v.id}
                            variant={v}
                            active={isGroupActive && selectedVariant.id === v.id}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleGroupSelect(group);
                              setSelectedVariant(v);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Rest of Config Fields ── */}
            <div className="p-6 rounded-2xl border border-border-glass bg-bg-surface space-y-1 shadow-sm">

              <FieldRow label="Service Type">
                <BtnGroup opts={['cutting', 'engraving', 'both']} value={serviceType} onChange={setServiceType} />
              </FieldRow>

              <FieldRow label="Thickness (mm)" tooltip="Varying thicknesses affect laser edge precision">
                <div className="flex flex-wrap gap-2">
                  {selectedGroup.thicknesses.map(t => (
                    <button key={t} onClick={() => setThickness(t)} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${thickness === t ? 'border-accent-primary bg-accent-primary/10 text-[#008800] dark:text-accent-primary' : 'border-border-glass text-text-secondary hover:border-accent-primary/40'}`}>{t}mm</button>
                  ))}
                </div>
              </FieldRow>

              <FieldRow label="Dimensions" tooltip="Overall bounding box of your design area (mm)">
                <div className="flex items-center gap-2">
                  <input type="number" value={width} onChange={e => setWidth(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-center focus:border-accent-primary" />
                  <span className="text-text-muted font-bold">×</span>
                  <input type="number" value={height} onChange={e => setHeight(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-center focus:border-accent-primary" />
                  <span className="text-text-secondary text-sm">mm</span>
                </div>
              </FieldRow>

              <FieldRow label="Quantity">
                <input type="number" min={1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="w-24 px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-center focus:border-accent-primary" />
              </FieldRow>

              <FieldRow label="Finish">
                <BtnGroup opts={['standard', 'polished', 'painted']} value={finish} onChange={setFinish} />
              </FieldRow>

              <FieldRow label="Urgency">
                <BtnGroup opts={['standard', 'rush_24h']} value={urgency} onChange={setUrgency} labelMap={{ standard: 'Standard', rush_24h: 'Rush (24h)' }} />
              </FieldRow>

            </div>
          </div>

          {/* ── RIGHT: Sticky Order Summary ── */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24 rounded-2xl border border-border-glass bg-bg-surface overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-accent-primary/10 border-b border-border-glass">
                <h3 className="font-bold text-lg text-text-primary">Order Summary</h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary font-medium">Service</span>
                  <span className="font-bold text-text-primary uppercase">{serviceType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary font-medium">Material</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: selectedVariant.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)' }} />
                    <span className="font-bold text-text-primary text-right max-w-[120px] leading-tight">{selectedGroup.name}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary font-medium">Color</span>
                  <span className="font-bold text-text-primary">{selectedVariant.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary font-medium">Thickness</span>
                  <span className="font-bold text-text-primary">{thickness} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary font-medium">Dimensions</span>
                  <span className="font-bold text-text-primary">{width} × {height} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary font-medium">Quantity</span>
                  <span className="font-bold text-text-primary">{quantity} pcs</span>
                </div>

                {/* Model stats mini summary — only after upload */}
                {uploadedFile && (
                  <div className="rounded-xl border border-[#00cc55]/20 bg-[#00cc55]/5 p-3 space-y-1.5 text-xs">
                    <p className="font-bold text-[#00cc55] uppercase tracking-wider mb-1">Model Stats</p>
                    <div className="flex justify-between text-text-muted"><span>Dimensions</span><span className="font-mono text-text-primary">{modelStats.dimensions}</span></div>
                    <div className="flex justify-between text-text-muted"><span>Total Path</span><span className="font-mono text-text-primary">{modelStats.totalPath}</span></div>
                    <div className="flex justify-between text-text-muted"><span>Est. Print Time</span><span className="font-mono text-text-primary">{modelStats.printTime}</span></div>
                  </div>
                )}

                <div className="border-t border-border-glass pt-3 flex justify-between font-bold">
                  <span className="text-text-secondary">Estimated Total</span>
                  <span className="text-accent-primary text-base">
                    {loadingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : priceDetails ? `₹${priceDetails.total}` : 'Calculating...'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-hover rounded-lg p-2.5 border border-border-glass font-medium">
                  <Clock className="w-3.5 h-3.5 text-accent-primary flex-shrink-0" />
                  Lead time: {urgency === 'rush_24h' ? '24 Hours' : '3-5 business days'}
                </div>

                <button
                  onClick={handleSaveToCart}
                  disabled={!uploadedFile}
                  className="w-full py-3.5 bg-accent-primary hover:bg-accent-primary-hover disabled:bg-surface-200 disabled:text-text-placeholder disabled:cursor-not-allowed text-black font-black uppercase tracking-wider rounded-xl text-sm transition-all shadow-[0_4px_20px_rgba(0,204,85,0.25)]"
                >
                  Save to Cart
                </button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
                  <Info className="w-3.5 h-3.5" /> Prices adapt based on design footprint
                </div>

                {/* View Cart link — always available */}
                <button
                  onClick={() => navigate('/prototyping/cart')}
                  className="w-full py-2.5 border border-border-glass hover:border-accent-primary/50 text-text-secondary hover:text-accent-primary font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  View Cart
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <PrototypingFAQ title="Laser Cutting FAQs" faqs={[
        { question: 'What file formats do you accept?', answer: 'DXF, SVG, PDF, AI, EPS, and image formats (PNG, JPG, BMP).' },
        { question: 'What materials can you cut?', answer: 'Acrylic, MDF, ABS, Polycarbonate, Mirror Acrylic and more.' },
        { question: 'What are the size limitations?', answer: 'Max cutting bed: 1300 × 900 mm. Material thickness up to 25mm.' },
        { question: 'How long does an order take?', answer: 'Most projects: 3-5 business days. 24-hour rush available.' },
      ]} />

    </div>
  );
}
