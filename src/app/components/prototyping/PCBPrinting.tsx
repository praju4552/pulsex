import { PrototypingHeader } from './PrototypingHeader';
import GerberViewer from './GerberViewer';
import { Upload, HelpCircle, ChevronDown, ChevronUp, Info, Shield, Clock, FileText, History, Loader2, CheckCircle2, AlertTriangle, X, Layers } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../api/config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PCBSpec {
  // Top-level
  baseMaterial: string;
  layers: number;
  dimX: number;
  dimY: number;
  dimUnit: 'mm' | 'inch';
  qty: number;
  productType: string;
  // PCB Specifications
  differentDesign: number | string;
  deliveryFormat: string;
  thickness: string;
  color: string;
  silkscreen: string;
  materialType: string;
  finish: string;
  // High-spec
  copperWeight: string;
  viaCovering: string;
  viaPlating: string;
  minViaHole: string;
  boardTolerance: string;
  confirmProduction: string;
  markOnPcb: string;
  electricalTest: string;
  goldFingers: string;
  castellated: string;
  edgePlating: string;
  blindSlots: string;
  ulMarking: string;
  // Advanced
  fourWireKelvin: string;
  paperBetween: string;
  appearanceQuality: string;
  silkscreenTech: string;
  packageBox: string;
  inspectionReport: string;
  remark: string;
}

interface HistoryItem {
  id: string;
  date: string;
  filename: string;
  spec: PCBSpec;
  parseResult: {
    confidence: string;
    detectedLayers: string[];
    fileCount: number;
    warnings: string[];
  };
}

// ─── Pricing — Source: PulseX_Pricing_Matrix + gst(Last).xlsx ───────────────────
// GST 18% is applied at display time. These values match the Excel exactly.

const GST_RATE = 0.18;

const DEFAULT_PCB_PRICING: any = {
  baseCost:    700,   // INR — Initial Base Cost / Setup Fee
  costPerCm2:  12,    // INR per sq. cm of board area
  layerMult:   { '1': 0.8, '2': 1.0, '4': 2.0, '6': 3.0, '8': 3.8, '10': 4.5, '12': 4.5, '14': 4.5, '16': 4.5 },
  materialMult: { 'FR-4': 1.0, 'Flex': 2.5, 'Aluminum': 2.0, 'Copper Core': 2.2, 'Rogers': 3.5, 'PTFE Teflon': 4.0 },
  thicknessMult: { '0.4mm': 1.30, '0.6mm': 1.20, '0.8mm': 1.10, '1.0mm': 1.05, '1.2mm': 1.02, '1.6mm': 1.00, '2.0mm': 1.20 },
  colorMult: { 'Green': 1.0, 'Red': 1.1, 'Yellow': 1.1, 'Blue': 1.1, 'White': 1.1, 'Black': 1.1, 'Purple': 1.1, 'Matte Black': 1.2 },
  finishMult: { 'HASL': 1.0, 'HASL(with lead)': 1.0, 'LeadFree HASL': 1.1, 'ENIG': 1.4, 'OSP': 1.5, 'Hard Gold': 1.5, 'Silver': 1.5, 'Tin': 1.5 },
  copperMult: { '1 oz': 1.0, '2 oz': 1.3, '3 oz': 1.6 },
  advancedFees: { castellated: 300, goldFingers: 500, viaEpoxy: 400 },
};

// Returns { preGst, gst, total } — all INR, GST 18% included in total.
function calcPrice(spec: PCBSpec, pricingConfig?: any): { preGst: number; gst: number; total: number } {
  const p = pricingConfig || DEFAULT_PCB_PRICING;

  // 1. Board area in cm²
  let dimX = spec.dimX || 100;
  let dimY = spec.dimY || 100;
  if (spec.dimUnit === 'inch') { dimX *= 2.54; dimY *= 2.54; }
  const areaCm2 = (dimX / 10) * (dimY / 10);

  // 2. Base per-board cost
  const baseCost  = Number(p.baseCost  ?? 700);
  const perCm2    = Number(p.costPerCm2 ?? 12);
  const perBoard  = baseCost + areaCm2 * perCm2;

  // 3. Multiplier chain
  const lm  = p.layerMult    || {};
  const mm  = p.materialMult || {};
  const tm  = p.thicknessMult || {};
  const cm  = p.colorMult    || {};
  const fm  = p.finishMult   || {};
  const cwm = p.copperMult   || {};

  const layerKey = String(spec.layers);
  // 10+ layers all map to 4.5x per Excel
  const layerMultVal     = Number(lm[layerKey]           ?? (spec.layers >= 10 ? 4.5 : 1.0));
  const materialMultVal  = Number(mm[spec.baseMaterial]   ?? 1.0);
  const thicknessMultVal = Number(tm[spec.thickness]      ?? 1.0);
  const colorMultVal     = Number(cm[spec.color]          ?? 1.0);
  const finishMultVal    = Number(fm[spec.finish]         ?? 1.0);
  const copperMultVal    = Number(cwm[spec.copperWeight]  ?? 1.0);

  const pricePerBoard = perBoard
    * layerMultVal * materialMultVal * thicknessMultVal
    * colorMultVal * finishMultVal   * copperMultVal;

  // 4. Qty
  let subtotal = pricePerBoard * spec.qty;

  // 5. Advanced flat fees (once per order)
  const af = p.advancedFees || {};
  if (spec.castellated === 'Yes') subtotal += Number(af.castellated ?? 0);
  if (spec.goldFingers  === 'Yes') subtotal += Number(af.goldFingers  ?? 0);
  if (spec.viaCovering  === 'Epoxy Filled & Capped') subtotal += Number(af.viaEpoxy ?? 0);

  // 6. GST 18%
  const preGst = Math.max(Math.round(subtotal), 500);  // floor ₹500
  const gst    = Math.round(preGst * GST_RATE);
  const total  = preGst + gst;

  return { preGst, gst, total };
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

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

function BtnGroup({ opts, value, onChange, disabledOpts = [] }: { opts: string[]; value: string; onChange: (v: string) => void; disabledOpts?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(o => {
        const disabled = disabledOpts.includes(o);
        const active = value === o;
        return (
          <button
            key={o}
            disabled={disabled}
            onClick={() => !disabled && onChange(o)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              active
                ? 'border-accent-primary bg-accent-primary/15 text-[#008800] dark:text-accent-primary shadow-[0_0_8px_rgba(0,204,85,0.1)]'
                : disabled
                ? 'border-border-glass text-text-placeholder cursor-not-allowed bg-glass-bg'
                : 'border-border-glass text-text-secondary bg-surface-100/50 hover:border-accent-primary/40 hover:text-text-primary'
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({ num, title, open, onToggle }: { num: string; title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-surface-100 hover:bg-surface-hover transition-colors rounded-xl border border-border-glass mb-1"
    >
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-accent-primary/15 flex items-center justify-center border border-accent-primary/25 text-accent-primary font-bold text-xs">{num}</span>
        <span className="font-bold text-base text-text-primary">{title}</span>
      </div>
      {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
    </button>
  );
}

const COLORS_PCB = [
  { val: 'Green', hex: '#22c55e' },
  { val: 'Purple', hex: '#a855f7' },
  { val: 'Red', hex: '#ef4444' },
  { val: 'Yellow', hex: '#eab308' },
  { val: 'Blue', hex: '#3b82f6' },
  { val: 'White', hex: '#f5f5f5' },
  { val: 'Black', hex: '#1f2937' },
];

const SHIP = [
  { id: 'dhl', name: 'DHL Express', days: '7-8 days', price: 150 },
  { id: 'fedex', name: 'FedEx Intl', days: '7-8 days', price: 150 },
  { id: 'std', name: 'Standard Post', days: '7-8 days', price: 120 },
  { id: 'eco', name: 'Economy', days: '10 days', price: 90 },
];

const BASE_MATERIALS = ['FR-4', 'Proto FR-4', 'Flex', 'Aluminum', 'Copper Core', 'Rogers', 'PTFE Teflon'];
const LAYER_OPTS = [1, 2, 4, 6, 8, 10, 12, 14, 16];
const QTY_OPTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ─── Main Component ──────────────────────────────────────────────────────────────

export default function PCBPrinting() {
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const [pcbPricing, setPcbPricing] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/pricing/pcb_pricing`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.value) setPcbPricing(data.value);
      })
      .catch(err => console.error('Failed to load PCB pricing:', err));
  }, []);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [rawGerberFile, setRawGerberFile] = useState<File | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [ship, setShip] = useState('dhl');
  const [showHistory, setShowHistory] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [openSections, setOpenSections] = useState({ spec: true, highspec: false, advanced: false });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('pcb_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [spec, setSpec] = useState<PCBSpec>({
    baseMaterial: 'FR-4',
    layers: 2,
    dimX: 100,
    dimY: 100,
    dimUnit: 'mm',
    qty: 1,
    productType: 'Industrial/Consumer electronics',
    differentDesign: 1,
    deliveryFormat: 'Single PCB',
    thickness: '1.6mm',
    color: 'Green',
    silkscreen: 'White',
    materialType: 'FR-4 TG 135',
    finish: 'HASL',
    copperWeight: '1 oz',
    viaCovering: 'Tented',
    viaPlating: 'Not Specified',
    minViaHole: '0.3mm/(0.4/0.45mm)',
    boardTolerance: '±0.2mm(Regular)',
    confirmProduction: 'No',
    markOnPcb: 'Remove Mark',
    electricalTest: 'Flying Probe Fully Test',
    goldFingers: 'No',
    castellated: 'No',
    edgePlating: 'No',
    blindSlots: 'No',
    ulMarking: 'No',
    fourWireKelvin: 'No',
    paperBetween: 'No',
    appearanceQuality: 'IPC Class 2 Standard',
    silkscreenTech: 'Ink-jet/Screen Printing Silkscreen',
    packageBox: 'With PULSE X logo',
    inspectionReport: 'No',
    remark: '',
  });

  const set = (k: keyof PCBSpec, v: any) => setSpec(s => {
    const newSpec = { ...s, [k]: v };
    if (k === 'baseMaterial' && v === 'Proto FR-4') {
      newSpec.layers = 1;
      newSpec.dimX = Math.min(newSpec.dimX, 100);
      newSpec.dimY = Math.min(newSpec.dimY, 100);
      if (newSpec.silkscreen !== 'None') newSpec.silkscreen = 'None';
    }
    if (newSpec.baseMaterial === 'Proto FR-4') {
      if (k === 'dimX' && newSpec.dimX > 100) newSpec.dimX = 100;
      if (k === 'dimY' && newSpec.dimY > 100) newSpec.dimY = 100;
    }
    return newSpec;
  });
  const toggleSection = (s: keyof typeof openSections) => setOpenSections(o => ({ ...o, [s]: !o[s] }));

  const priceResult = calcPrice(spec, pcbPricing);
  const shipCost = SHIP.find(s => s.id === ship)?.price || 0;
  const grandTotal = priceResult.preGst;

  const [parseStatus, setParseStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [parseResult, setParseResult] = useState<null | {
    filename: string;
    confidence: string;
    detectedLayers: string[];
    fileCount: number;
  }>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRawGerberFile(file);
    setUploadedFile(file.name);
    setParseStatus('uploading');
    setParseResult(null);
    setParseWarnings([]);

    const formData = new FormData();
    formData.append('gerberFile', file);

    try {
      const res = await fetch(`${API_BASE_URL}/pcb/parse-gerber`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server returned an error.');
      }

      // Auto-populate the spec from parsed data
      const ps = data.parsedSpec;
      
      const newSpec = {
        ...spec,
        layers: ps.layers ?? spec.layers,
        dimX: ps.dimX ?? spec.dimX,
        dimY: ps.dimY ?? spec.dimY,
        dimUnit: ps.dimUnit ?? spec.dimUnit,
        ...(ps.finish ? { finish: ps.finish } : {}),
      };

      setSpec(newSpec);

      const parsedData = {
        confidence: data.analysis.confidence,
        detectedLayers: data.analysis.detectedLayers,
        fileCount: data.analysis.fileCount,
        warnings: data.analysis.warnings || [],
      };

      setParseResult({
        filename: data.filename,
        confidence: parsedData.confidence,
        detectedLayers: parsedData.detectedLayers,
        fileCount: parsedData.fileCount,
      });
      // Filter out internal debug warnings that shouldn't be shown to users
      const debugPrefixes = ['Picked outline', 'Manual parser:', 'Found candidate in'];
      const userWarnings = (parsedData.warnings || []).filter(
        (w: string) => !debugPrefixes.some(prefix => w.startsWith(prefix))
      );
      setParseWarnings(userWarnings);
      setParseStatus('success');

      // Save to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleString(),
        filename: data.filename,
        spec: newSpec,
        parseResult: parsedData,
      };
      
      setHistory(prev => {
        const updated = [newItem, ...prev].slice(0, 10); // keep last 10
        localStorage.setItem('pcb_history', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Gerber parse failed:', err);
      setParseStatus('error');
      setParseWarnings([err instanceof Error ? err.message : 'Upload failed. Please try again.']);
    }
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  // Run this in a useEffect or inside the try block to save history.
  // We'll hook into the state update above, but since we need the *new* spec, 
  // we do it right inside the try block:

  const handleSaveToCart = () => {
    const cartItem = {
      id: Date.now().toString(),
      type: 'PCB Printing',
      spec: `${spec.layers}L | ${spec.dimX}x${spec.dimY}mm | ${spec.baseMaterial} | ${spec.finish}`,
      fullSpec: spec,
      qty: spec.qty,
      pcbPrice: priceResult.preGst,
      shippingMethod: SHIP.find(s => s.id === ship)?.name || 'Standard',
      shippingCost: shipCost,
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop'
    };

    let cart = [];
    try {
      const saved = localStorage.getItem('prototyping_cart');
      if (saved) cart = JSON.parse(saved);
    } catch {}

    cart.push(cartItem);
    localStorage.setItem('prototyping_cart', JSON.stringify(cart));
    
    // Redirect to cart
    navigate('/prototyping/cart');
  };

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary">
      <PrototypingHeader />

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="inline-block px-4 py-1.5 bg-[#00cc55]/10 rounded-full border border-[#00cc55]/20 text-[#00cc55] font-medium text-xs mb-3">
              Professional PCB Printing Service
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Online PCB Quote</h1>
            <p className="text-text-secondary text-sm mt-1">Instant pricing for PCB manufacturing orders</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowInstructions(true)}
              className="flex items-center gap-2 px-4 py-2 border border-border-glass hover:border-[#00cc55]/30 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <FileText className="w-4 h-4" />
              Instructions For Ordering
            </button>
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
                  showHistory ? 'border-[#00cc55] text-[#00cc55] bg-[#00cc55]/10' : 'border-border-glass text-text-secondary hover:border-[#00cc55]/30 hover:text-text-primary'
                }`}
              >
                <History className="w-4 h-4" />
                Upload History
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              
              {/* History Dropdown */}
              {showHistory && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0d1410] border border-border-glass shadow-2xl rounded-xl overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-border-glass bg-glass-bg flex justify-between items-center">
                    <span className="font-bold text-sm">Recent Uploads</span>
                    <span className="text-xs text-text-muted">{history.length} saved</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {history.length === 0 ? (
                      <div className="p-6 text-center text-text-muted text-sm">No upload history yet.</div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {history.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSpec(item.spec);
                              setUploadedFile(item.filename);
                              setParseStatus('success');
                              setParseResult({
                                filename: item.filename,
                                confidence: item.parseResult.confidence,
                                detectedLayers: item.parseResult.detectedLayers,
                                fileCount: item.parseResult.fileCount,
                              });
                              const dbgPfx = ['Picked outline', 'Manual parser:', 'Found candidate in'];
                              setParseWarnings((item.parseResult.warnings || []).filter((w: string) => !dbgPfx.some(p => w.startsWith(p))));
                              setShowHistory(false);
                            }}
                            className="w-full text-left p-4 hover:bg-white/[0.04] transition-colors group"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-[#00cc55] truncate pr-2 group-hover:underline">{item.filename}</span>
                              <span className="text-[10px] text-text-muted whitespace-nowrap">{item.date.split(',')[0]}</span>
                            </div>
                            <div className="flex gap-2 text-xs text-text-secondary">
                              <span>{item.spec.layers}L</span>
                              <span>•</span>
                              <span>{item.spec.dimX}x{item.spec.dimY}mm</span>
                              <span>•</span>
                              <span className="truncate">{item.spec.finish}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 2-col Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT: Configurator ──────────────────────────────── */}
          <div className="flex-1 space-y-6">

            {/* Upload Section */}
            <div
              onClick={() => parseStatus !== 'uploading' && ref.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all group bg-surface-100 ${
                parseStatus === 'uploading'
                  ? 'border-accent-primary/60 cursor-wait'
                  : parseStatus === 'success'
                  ? 'border-accent-primary/50 cursor-pointer hover:border-accent-primary'
                  : parseStatus === 'error'
                  ? 'border-red-500/40 cursor-pointer hover:border-red-400/60'
                  : 'border-border-glass cursor-pointer hover:border-accent-primary/40 hover:bg-accent-primary/[0.03]'
              }`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center border transition-all ${
                parseStatus === 'uploading'
                  ? 'bg-[#00cc55]/10 border-[#00cc55]/30 animate-pulse'
                  : parseStatus === 'success'
                  ? 'bg-[#00cc55]/15 border-[#00cc55]/30'
                  : parseStatus === 'error'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-[#00cc55]/10 border-[#00cc55]/20 group-hover:scale-105'
              }`}>
                {parseStatus === 'uploading' ? (
                  <Loader2 className="w-7 h-7 text-[#00cc55] animate-spin" />
                ) : parseStatus === 'success' ? (
                  <CheckCircle2 className="w-7 h-7 text-[#00cc55]" />
                ) : parseStatus === 'error' ? (
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                ) : (
                  <Upload className="w-7 h-7 text-[#00cc55]" />
                )}
              </div>

              {/* Status text */}
              {parseStatus === 'uploading' ? (
                <div>
                  <p className="font-bold text-[#00cc55] mb-1">Scanning Gerber Files…</p>
                  <p className="text-xs text-text-muted">Detecting layers, dimensions, and specifications</p>
                </div>
              ) : parseStatus === 'success' && parseResult ? (
                <div>
                  <p className="font-bold text-text-primary mb-0.5">{parseResult.filename}</p>
                  <p className="text-xs text-text-muted mb-0">{parseResult.fileCount} files analysed</p>
                </div>
              ) : (
                <div>
                  {uploadedFile && parseStatus === 'error' ? (
                    <p className="font-semibold text-text-primary mb-1">{uploadedFile}</p>
                  ) : (
                    <button className="px-6 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-black font-bold rounded-full text-sm transition-colors mb-3">
                      + Add Gerber File
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs text-text-muted mt-2">Only accept .zip or .rar, Max 100 MB</p>
              <p className="text-xs text-text-placeholder mt-1 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> All uploads are secure and confidential.
              </p>
              <input ref={ref} type="file" accept=".zip,.rar,.gbr,.kicad_pcb,.brd,.gbz" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Reset / Clear File Button */}
            {(parseStatus === 'success' || parseStatus === 'error') && (
              <div className="flex justify-end">
                <button
                  onClick={() => { setParseStatus('idle'); setParseResult(null); setParseWarnings([]); setUploadedFile(null); setRawGerberFile(null); setShowViewer(false); if (ref.current) ref.current.value = ''; }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all"
                >
                  <X className="w-4 h-4" /> Clear File &amp; Reset
                </button>
              </div>
            )}

            {/* ── Scan Result Banner ── */}
            {parseStatus === 'success' && parseResult && (
              <div className="rounded-2xl border border-[#00cc55]/20 bg-[#00cc55]/[0.05] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#00cc55]" />
                    <span className="font-bold text-text-primary">Gerber Scan Complete</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      parseResult.confidence === 'high'
                        ? 'bg-[#00cc55]/10 border-[#00cc55]/30 text-[#00cc55]'
                        : parseResult.confidence === 'medium'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-zinc-500/10 border-zinc-500/30 text-text-secondary'
                    }`}>{parseResult.confidence} confidence</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setParseStatus('idle'); setParseResult(null); setParseWarnings([]); setUploadedFile(null); }}
                    className="text-text-muted hover:text-text-primary transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  ✅ Specifications below have been <strong className="text-text-primary">auto-populated</strong> from your Gerber files. Review and adjust as needed.
                </p>

                {/* Detected Layer Types */}
                {parseResult.detectedLayers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">Detected File Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parseResult.detectedLayers.map(l => (
                        <span key={l} className="px-2 py-0.5 text-[11px] rounded-md bg-surface-200 border border-border-glass text-text-primary">{l}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-populated summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Layers', value: `${spec.layers}L` },
                    { label: 'Width', value: `${spec.dimX}mm` },
                    { label: 'Height', value: `${spec.dimY}mm` },
                    { label: 'Finish', value: spec.finish },
                  ].map(item => (
                    <div key={item.label} className="bg-surface-100 rounded-xl p-3 text-center border border-border-glass">
                      <p className="text-xs text-text-muted mb-1">{item.label}</p>
                      <p className="font-bold text-text-primary text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Warnings / Errors Banner ── */}
            {parseWarnings.length > 0 && (
              <div className={`rounded-2xl border p-4 space-y-2 ${parseStatus === 'error' ? 'border-red-500/30 bg-red-500/[0.05]' : 'border-amber-500/20 bg-amber-500/[0.04]'}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${parseStatus === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
                  <span className={`text-sm font-semibold ${parseStatus === 'error' ? 'text-red-300' : 'text-amber-300'}`}>
                    {parseStatus === 'error' ? 'Upload Failed' : `${parseWarnings.length} Note${parseWarnings.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                <ul className="space-y-1">
                  {parseWarnings.map((w, i) => (
                    <li key={i} className={`text-xs ${parseStatus === 'error' ? 'text-red-400' : 'text-amber-400'}`}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Gerber Viewer ── */}
            {parseStatus === 'success' && rawGerberFile && (
              <div className="flex flex-col gap-4">
                {!showViewer ? (
                  <button 
                    onClick={() => setShowViewer(true)}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-border-glass bg-surface-100 hover:bg-surface-hover transition-colors text-text-secondary hover:text-text-primary shadow-sm"
                  >
                    <Layers className="w-5 h-5 text-accent-primary" />
                    <span className="font-semibold text-sm">Open Online Gerber Viewer</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowViewer(false)}
                      className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors px-2 py-1 ml-auto"
                    >
                      Close Viewer <ChevronUp className="w-4 h-4" />
                    </button>
                    <GerberViewer file={rawGerberFile} />
                  </div>
                )}
              </div>
            )}

            {/* ── TOP-LEVEL FIELDS ── */}
            <div className="p-6 rounded-2xl border border-border-glass bg-bg-surface space-y-1 shadow-sm">

              <FieldRow label="Base Material" tooltip="The substrate used for PCB manufacturing.">
                <div className="flex flex-wrap gap-2">
                  {BASE_MATERIALS.map(m => (
                    <button
                      key={m}
                      onClick={() => set('baseMaterial', m)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${spec.baseMaterial === m ? 'border-accent-primary bg-accent-primary/10 text-[#008800] dark:text-accent-primary shadow-[0_0_8px_rgba(0,204,85,0.1)]' : 'border-border-glass text-text-secondary hover:border-accent-primary/40 hover:text-text-primary'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </FieldRow>

              <FieldRow label="Layers" tooltip="Number of copper layers on your PCB.">
                <div className="flex flex-wrap items-center gap-2">
                  {LAYER_OPTS.map(l => (
                    <button
                      key={l}
                      disabled={spec.baseMaterial === 'Proto FR-4' && l !== 1}
                      onClick={() => set('layers', l)}
                      className={`w-10 h-9 rounded-lg border text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${spec.layers === l ? 'border-accent-primary bg-accent-primary/15 text-[#008800] dark:text-accent-primary' : 'border-border-glass text-text-secondary hover:border-accent-primary/40 hover:text-text-primary'} ${l >= 6 ? 'text-amber-500 border-amber-500/20 hover:border-amber-500/40 dark:text-amber-400' : ''}`}
                    >
                      {l}
                    </button>
                  ))}
                  {spec.layers >= 6 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">High Precision PCB</span>
                  )}
                </div>
              </FieldRow>

              <FieldRow label="Dimensions" tooltip="PCB dimensions in mm or inches.">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={spec.dimX}
                    onChange={e => set('dimX', parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-center text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <span className="text-text-muted font-bold">×</span>
                  <input
                    type="number"
                    value={spec.dimY}
                    onChange={e => set('dimY', parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-center text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <select
                    value={spec.dimUnit}
                    onChange={e => set('dimUnit', e.target.value)}
                    className="px-3 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-text-secondary focus:outline-none focus:border-accent-primary"
                  >
                    <option value="mm">mm</option>
                    <option value="inch">inch</option>
                  </select>
                </div>
              </FieldRow>

              <FieldRow label="PCB Qty" tooltip="Number of boards.">
                <select
                  value={spec.qty}
                  onChange={e => set('qty', parseInt(e.target.value))}
                  className="px-4 py-2 bg-surface-100 border border-border-glass rounded-lg text-sm text-text-secondary focus:outline-none focus:border-accent-primary"
                >
                  {QTY_OPTS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </FieldRow>

            </div>

            {/* ── PCB SPECIFICATIONS ── */}
            <div>
              <SectionHeader num="1" title="PCB Specifications" open={openSections.spec} onToggle={() => toggleSection('spec')} />
              {openSections.spec && (
                <div className="p-6 rounded-2xl border border-border-glass bg-bg-surface space-y-1 mt-1 shadow-sm">

                  <FieldRow label="Different Design" tooltip="Number of different designs in same order.">
                    <div className="flex flex-wrap gap-2 items-center">
                      {[1,2,3,4].map(n => (
                        <button key={n} onClick={() => set('differentDesign', n)}
                          className={`w-10 h-9 rounded-lg border text-xs font-bold transition-all ${spec.differentDesign === n ? 'border-accent-primary bg-accent-primary/15 text-[#008800] dark:text-accent-primary' : 'border-border-glass text-text-secondary hover:border-accent-primary/40'}`}>{n}</button>
                      ))}
                      <input type="number" min={1} placeholder="other"
                        className="w-20 px-2 py-1.5 bg-surface-100 border border-border-glass rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                        onChange={e => set('differentDesign', e.target.value)}
                      />
                    </div>
                  </FieldRow>

                  <FieldRow label="Delivery Format" tooltip="How the PCBs are delivered to you.">
                    <BtnGroup
                      opts={['Single PCB', 'Panel by Customer']}
                      value={spec.deliveryFormat}
                      onChange={v => set('deliveryFormat', v)}
                    />
                  </FieldRow>

                  <FieldRow label="PCB Thickness" tooltip="Thickness of the PCB including all layers.">
                    <BtnGroup
                      opts={['1.2mm','1.6mm','2.0mm']}
                      value={spec.thickness}
                      onChange={v => set('thickness', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Silkscreen" tooltip="Color of the silkscreen text printed on the PCB.">
                    <BtnGroup 
                      opts={['None', 'White', 'Black']} 
                      value={spec.silkscreen} 
                      onChange={v => set('silkscreen', v)}
                      disabledOpts={spec.baseMaterial === 'Proto FR-4' ? ['White', 'Black'] : []}
                    />
                  </FieldRow>

                  <FieldRow label="Material Type" tooltip="Specific grade of base material (Tg rating affects thermal resistance).">
                    <BtnGroup
                      opts={['FR-4 TG 135']}
                      value={spec.materialType}
                      onChange={v => set('materialType', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Surface Finish" tooltip="Surface protection and solderability coating.">
                    <BtnGroup
                      opts={['HASL']}
                      value={spec.finish}
                      onChange={v => set('finish', v)}
                    />
                  </FieldRow>
                </div>
              )}
            </div>

            {/* ── HIGH-SPEC OPTIONS ── */}
            <div>
              <SectionHeader num="2" title="High-spec Options" open={openSections.highspec} onToggle={() => toggleSection('highspec')} />
              {openSections.highspec && (
                <div className="p-6 rounded-2xl border border-border-glass bg-bg-surface space-y-1 mt-1 shadow-sm">

                  <FieldRow label="Outer Copper Weight" tooltip="Copper thickness on outer layers. Affects current capacity.">
                    <BtnGroup
                      opts={['1 oz','2 oz','2.5 oz','3.5 oz','4.5 oz']}
                      value={spec.copperWeight}
                      onChange={v => set('copperWeight', v)}
                      disabledOpts={['2.5 oz','3.5 oz','4.5 oz'].filter(() => spec.layers < 4)}
                    />
                  </FieldRow>

                  <FieldRow label="Via Covering" tooltip="How vias (holes) are finished.">
                    <BtnGroup
                      opts={['Tented','Untented','Plugged','Epoxy Filled & Capped','Copper paste Filled & Capped']}
                      value={spec.viaCovering}
                      onChange={v => set('viaCovering', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Via Plating Method" tooltip="Method used to plate the via holes.">
                    <BtnGroup
                      opts={['Not Specified','Conductive Adhesive','Horizontal Electroless Copper Plating']}
                      value={spec.viaPlating}
                      onChange={v => set('viaPlating', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Min Via Hole Size/Diameter" tooltip="Smallest drilled via hole size. Smaller holes require higher precision.">
                    <BtnGroup
                      opts={['0.3mm/(0.4/0.45mm)','0.25mm/(0.35/0.4mm)','0.2mm/(0.3/0.35mm)','0.15mm/(0.25/0.3mm)']}
                      value={spec.minViaHole}
                      onChange={v => set('minViaHole', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Board Outline Tolerance" tooltip="How accurately the board outline is cut.">
                    <BtnGroup
                      opts={['±0.2mm(Regular)','±0.1mm(Precision)']}
                      value={spec.boardTolerance}
                      onChange={v => set('boardTolerance', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Confirm Production File" tooltip="Request our engineering team prepares a DFM report before production.">
                    <BtnGroup opts={['No','Yes']} value={spec.confirmProduction} onChange={v => set('confirmProduction', v)} />
                  </FieldRow>

                  <FieldRow label="Mark on PCB" tooltip="PULSE X order number mark placement on your PCB.">
                    <BtnGroup
                      opts={['Remove Mark','Order Number(Specify Position)','2D barcode (Serial Number)','Order Number']}
                      value={spec.markOnPcb}
                      onChange={v => set('markOnPcb', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Electrical Test" tooltip="Test method to verify PCB connections.">
                    <BtnGroup
                      opts={['Flying Probe Fully Test']}
                      value={spec.electricalTest}
                      onChange={v => set('electricalTest', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Gold Fingers" tooltip="Plated edge connectors used for insertion into slots.">
                    <BtnGroup opts={['No','Yes']} value={spec.goldFingers} onChange={v => set('goldFingers', v)} />
                  </FieldRow>

                  <FieldRow label="Castellated Holes" tooltip="Half-holes on board edge for SMT mounting.">
                    <BtnGroup opts={['No','Yes']} value={spec.castellated} onChange={v => set('castellated', v)} />
                  </FieldRow>

                  <FieldRow label="Edge Plating" tooltip="Copper plating along the board edge.">
                    <BtnGroup opts={['No','Yes']} value={spec.edgePlating} onChange={v => set('edgePlating', v)} />
                  </FieldRow>

                  <FieldRow label="Blind Slots" tooltip="Slots that do not go fully through the PCB.">
                    <BtnGroup opts={['No','Yes']} value={spec.blindSlots} onChange={v => set('blindSlots', v)} />
                  </FieldRow>

                  <FieldRow label="UL Marking" tooltip="Underwriters Laboratories compliance mark.">
                    <BtnGroup
                      opts={['No','Yes (Any Position)','Yes (Specify Position)']}
                      value={spec.ulMarking}
                      onChange={v => set('ulMarking', v)}
                    />
                  </FieldRow>
                </div>
              )}
            </div>

            {/* ── ADVANCED OPTIONS ── */}
            <div>
              <SectionHeader num="3" title="Advanced Options" open={openSections.advanced} onToggle={() => toggleSection('advanced')} />
              {openSections.advanced && (
                <div className="p-6 rounded-2xl border border-border-glass bg-bg-surface space-y-1 mt-1 shadow-sm">

                  <FieldRow label="4-Wire Kelvin Test" tooltip="High-accuracy 4-wire resistance measurement for power boards.">
                    <BtnGroup opts={['No','Yes']} value={spec.fourWireKelvin} onChange={v => set('fourWireKelvin', v)} />
                  </FieldRow>

                  <FieldRow label="Paper between PCBs" tooltip="Adds protective paper sheets between boards for scratch prevention.">
                    <BtnGroup opts={['No','Yes']} value={spec.paperBetween} onChange={v => set('paperBetween', v)} />
                  </FieldRow>

                  <FieldRow label="Appearance Quality" tooltip="PCB visual quality inspection standard.">
                    <BtnGroup
                      opts={['IPC Class 2 Standard','Superb Quality']}
                      value={spec.appearanceQuality}
                      onChange={v => set('appearanceQuality', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Silkscreen Technology" tooltip="Method used to apply silkscreen text and graphics.">
                    <BtnGroup
                      opts={['Ink-jet/Screen Printing Silkscreen','High-precision Printing Silkscreen','EasyEDA multi-color silkscreen','High-definition Exposure Silkscreen']}
                      value={spec.silkscreenTech}
                      onChange={v => set('silkscreenTech', v)}
                      disabledOpts={['EasyEDA multi-color silkscreen','High-definition Exposure Silkscreen']}
                    />
                  </FieldRow>

                  <FieldRow label="Package Box" tooltip="Branded packaging for your order.">
                    <BtnGroup
                      opts={['With PULSE X logo','Blank box']}
                      value={spec.packageBox}
                      onChange={v => set('packageBox', v)}
                    />
                  </FieldRow>

                  <FieldRow label="Inspection Report" tooltip="Optional quality documentation included with your order.">
                    <BtnGroup
                      opts={['No','Final Inspection Report','Electrical Test Report','ROHS Test Report']}
                      value={spec.inspectionReport}
                      onChange={v => set('inspectionReport', v)}
                    />
                  </FieldRow>

                  <FieldRow label="PCB Remark">
                    <div className="flex items-center gap-2">
                      <textarea
                        rows={3}
                        value={spec.remark}
                        onChange={e => set('remark', e.target.value)}
                        placeholder="Any special manufacturing notes or instructions..."
                        className="w-full px-3 py-2 bg-surface-100 border border-border-glass rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent-primary resize-none placeholder:text-text-placeholder"
                      />
                    </div>
                  </FieldRow>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Sticky Order Summary ────────────── */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-24 rounded-2xl border border-border-glass bg-bg-surface overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-accent-primary/10 border-b border-border-glass">
                <h3 className="font-bold text-lg text-text-primary">Order Summary</h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary font-medium">Base Material</span><span className="font-bold text-text-primary">{spec.baseMaterial}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary font-medium">Layers</span><span className="font-bold text-text-primary">{spec.layers}L</span></div>
                <div className="flex justify-between"><span className="text-text-secondary font-medium">Dimensions</span><span className="font-bold text-text-primary">{spec.dimX}×{spec.dimY}{spec.dimUnit}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary font-medium">Quantity</span><span className="font-bold text-text-primary">{spec.qty} pcs</span></div>
                <div className="flex justify-between"><span className="text-text-secondary font-medium">Product Type</span><span className="font-bold text-text-primary text-right max-w-[140px] leading-tight">{spec.productType}</span></div>
                <div className="border-t border-border-glass pt-3 flex justify-between"><span className="text-text-secondary">Thickness</span><span className="font-medium">{spec.thickness}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">PCB Color</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_PCB.find(c => c.val === spec.color)?.hex }} />
                    {spec.color}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-text-secondary">Surface Finish</span><span className="font-medium">{spec.finish}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Material Type</span><span className="font-medium text-right max-w-[130px] leading-tight">{spec.materialType}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Copper Weight</span><span className="font-medium">{spec.copperWeight}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Via Covering</span><span className="font-medium">{spec.viaCovering}</span></div>
                {spec.goldFingers === 'Yes' && <div className="flex justify-between text-amber-400 text-xs"><span>Edge Connector / Gold Fingers</span><span>+₹500</span></div>}
                {spec.castellated === 'Yes' && <div className="flex justify-between text-amber-400 text-xs"><span>Castellated Holes</span><span>+₹300</span></div>}
                {spec.viaCovering === 'Epoxy Filled & Capped' && <div className="flex justify-between text-amber-400 text-xs"><span>Via Epoxy Fill</span><span>+₹400</span></div>}

                <div className="border-t border-border-glass pt-3 space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-text-secondary">PCB Total (excl. GST)</span>
                    <span className="text-accent-primary">₹{priceResult.preGst.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-text-muted mb-2 font-bold uppercase tracking-wider">Shipping</p>
                  <div className="space-y-1.5">
                    {SHIP.map(s => (
                      <button key={s.id} onClick={() => setShip(s.id)}
                        className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex justify-between items-center ${ship === s.id ? 'border-accent-primary bg-accent-primary/10 shadow-sm shadow-accent-primary/5' : 'border-border-glass bg-surface-100/50 hover:border-accent-primary/30'}`}>
                        <div>
                          <span className="font-bold block text-text-primary">{s.name}</span>
                          <span className="text-text-muted font-medium">{s.days} days</span>
                        </div>
                        <span className="text-accent-primary font-bold">₹{s.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border-glass pt-3 flex justify-between items-end">
                  <div>
                    <span className="font-bold text-text-primary block">Grand Total</span>
                    <span className="text-[10px] text-text-muted">(Shipping & GST evaluated at checkout)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-emerald-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                    <p className="text-xs text-text-muted font-bold">INR</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-hover rounded-lg p-2.5 border border-border-glass font-medium">
                  <Clock className="w-3.5 h-3.5 text-accent-primary flex-shrink-0" />
                  Standard lead time: 2–5 business days
                </div>

                <button 
                  onClick={handleSaveToCart}
                  className="w-full py-3.5 bg-accent-primary hover:bg-accent-primary-hover text-black font-black uppercase tracking-wider rounded-xl text-sm transition-all shadow-[0_4px_20px_rgba(0,204,85,0.25)] hover:shadow-[0_8px_30px_rgba(0,204,85,0.45)] hover:-translate-y-0.5"
                >
                  Save to Cart
                </button>

                <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
                  <Info className="w-3.5 h-3.5" />
                  Price updates instantly as you configure
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-glass bg-glass-bg py-8 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-text-muted">© 2024 PULSE X. All rights reserved.</p>
        </div>
      </footer>

      {/* ─── Instructions For Ordering — Slide-Over Panel ─── */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowInstructions(false)}
          />
          {/* Panel */}
          <div className="relative ml-auto w-full max-w-xl h-full bg-bg-surface border-l border-border-glass overflow-y-auto shadow-2xl flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-bg-surface/95 backdrop-blur border-b border-border-glass px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00cc55]/10 border border-[#00cc55]/20 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-[#00cc55]" />
                </div>
                <div>
                  <h2 className="font-black text-lg leading-tight">Instructions For Ordering</h2>
                  <p className="text-xs text-text-muted">Step-by-step PCB ordering guide</p>
                </div>
              </div>
              <button onClick={() => setShowInstructions(false)} className="text-text-muted hover:text-text-primary transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6 space-y-8 text-sm">

              {/* ── Step-by-step process ── */}
              <section>
                <h3 className="font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#00cc55] text-black text-xs font-black flex items-center justify-center">1</span>
                  How the Ordering Process Works
                </h3>
                <ol className="space-y-5">
                  {[
                    {
                      title: 'Upload Your Gerber Files',
                      desc: 'Start by uploading a .zip or .rar archive of your exported Gerber files. Our system will automatically scan your files and pre-fill specifications like board dimensions, layer count, and surface finish.',
                      tip: 'Export from KiCAD (File → Plot), Eagle (CAM Processor), or Altium (Output Jobs). Always include the board outline (.GKO / Edge.Cuts) file.',
                    },
                    {
                      title: 'Review and Adjust Specifications',
                      desc: 'After the scan, all the fields below are auto-filled. Review each setting carefully. You can modify any value — our pricing updates in real‑time on the right.',
                      tip: 'Pay close attention to Dimensions, Layers, Thickness, and Surface Finish — these have the most impact on cost and lead time.',
                    },
                    {
                      title: 'Configure Advanced Options',
                      desc: 'Scroll through the High-spec and Advanced Options sections. Most fields default to the most common values, but projects with tight tolerances, heavy copper, or special requirements need attention here.',
                      tip: 'For first-time orders, the default values work well for standard FR-4 2-layer hobby / prototype boards.',
                    },
                    {
                      title: 'Select Quantity and Shipping',
                      desc: 'Choose your order quantity from the dropdown. The price-per-board drops significantly for larger quantities. Pick a shipping method that suits your timeline and budget.',
                      tip: 'DHL Express (3–5 days) is recommended for urgent projects. Economy shipping (25–45 days) is best for non-urgent bulk orders.',
                    },
                    {
                      title: 'Save to Cart & Checkout',
                      desc: 'Click "Save to Cart" when you are happy with the configuration. You will be taken to the checkout page where you fill in your shipping address and contact details before placing the order.',
                      tip: 'Double-check your Gerber files are complete before confirming. Missing files cause production delays.',
                    },
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full border border-[#00cc55]/30 bg-[#00cc55]/10 text-[#00cc55] text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary mb-1">{step.title}</p>
                        <p className="text-text-secondary leading-relaxed mb-2">{step.desc}</p>
                        <div className="pl-3 border-l-2 border-[#00cc55]/30">
                          <p className="text-xs text-[#00cc55]/80">💡 {step.tip}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="border-t border-border-glass" />

              {/* ── Field Explanations ── */}
              <section>
                <h3 className="font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#00cc55] text-black text-xs font-black flex items-center justify-center">2</span>
                  Understanding Each Option
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      field: 'Base Material',
                      explanation: 'FR-4 is the standard for most PCBs — affordable and reliable. Rogers/PTFE Teflon are for RF/microwave designs. Aluminum is for high-power LED boards. Flex is for bendable circuits.',
                    },
                    {
                      field: 'Layers',
                      explanation: '1–2 layers cover 90% of hobbyist and prototype use. 4+ layers are needed for dense designs, high-speed signals, or when you need dedicated power/ground planes. 6+ layers (High Precision PCB) require longer lead times and higher cost.',
                    },
                    {
                      field: 'PCB Thickness',
                      explanation: '1.6 mm is the global standard. Thinner boards (0.4–0.8mm) suit wearables, connectors, and flexible assemblies. Thicker boards (2.0mm) are used for power electronics needing mechanical strength.',
                    },
                    {
                      field: 'PCB Color',
                      explanation: 'Green is fastest and cheapest. Other colors (Red, Blue, Black, White) cost slightly more due to longer processing times. Black looks premium but is harder to inspect visually.',
                    },
                    {
                      field: 'Surface Finish',
                      explanation: 'HASL (with lead) is cheapest and robust. Lead-Free HASL is RoHS-compliant (required for most commercial products). ENIG (gold) provides the flattest, most solderable surface — ideal for fine-pitch components and edge connectors.',
                    },
                    {
                      field: 'Outer Copper Weight',
                      explanation: '1 oz copper handles most signal and low-power designs. 2 oz+ is needed for power traces carrying 3A or more. Heavier copper adds significant cost.',
                    },
                    {
                      field: 'Via Covering',
                      explanation: 'Tented (covered with solder mask) protects vias from solder bridging — default and cheapest. Plugged/Filled vias are required for BGA devices or designs with vias under pads.',
                    },
                    {
                      field: 'Gold Fingers',
                      explanation: 'Hard-gold edge connectors used when the PCB edge plugs into a card slot or backplane (like RAM, M.2 cards). Only enable this if your design requires it.',
                    },
                    {
                      field: 'Castellated Holes',
                      explanation: 'Half-holes along the board edge that allow the PCB to be soldered like a component onto another PCB. Common for wireless modules (ESP32, LoRa).',
                    },
                    {
                      field: 'Product Type',
                      explanation: 'Industrial/Consumer is the standard. Aerospace and Medical trigger stricter quality-control processes and documentation, and typically cost more and take longer.',
                    },
                  ].map(item => (
                    <div key={item.field} className="p-4 rounded-xl bg-surface-100 border border-border-glass">
                      <p className="font-semibold text-[#00cc55] mb-1 text-xs uppercase tracking-wider">{item.field}</p>
                      <p className="text-text-secondary leading-relaxed">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="border-t border-border-glass" />

              {/* ── Modification Tips ── */}
              <section>
                <h3 className="font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#00cc55] text-black text-xs font-black flex items-center justify-center">3</span>
                  Alteration & Modification Guidelines
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: '✏️', title: 'Editing Auto-Filled Values', desc: 'All fields pre-filled from your Gerber scan are suggestions only. Click any button or input to override the detected value.' },
                    { icon: '📐', title: 'Incorrect Dimensions', desc: 'If the auto-detected size looks wrong, manually enter your board size in the Dimensions field (X × Y in mm). This often happens if the outline file uses a non-standard layer.' },
                    { icon: '🔢', title: 'Changing Quantity After Upload', desc: 'Your quantity and shipping choice do not affect the Gerber files — change them freely at any time before checkout.' },
                    { icon: '🎨', title: 'Color & Finish Changes', desc: 'You can freely change PCB color and surface finish after upload. These are manufacturing choices, not design choices, so they do not require re-uploading your files.' },
                    { icon: '📋', title: 'Re-uploading Files', desc: 'If you upload a new Gerber file after already uploading one, the form fields will be re-scanned and updated. Click the ✕ on the scan result banner to reset and start fresh.' },
                    { icon: '💬', title: 'Special Instructions', desc: 'Use the PCB Remark field at the bottom of the Advanced Options section to add any manufacturing notes, like "V-score panelization" or "no solder mask on test pads".' },
                    { icon: '🚫', title: 'Greyed-Out Options', desc: 'Some options (like Epoxy-Filled Vias, EasyEDA silkscreen) are greyed out because they require a separate quote process. Contact us directly for those services.' },
                  ].map(tip => (
                    <div key={tip.title} className="flex gap-3 p-3 rounded-xl bg-surface-100 border border-border-glass">
                      <span className="text-base flex-shrink-0 mt-0.5">{tip.icon}</span>
                      <div>
                        <p className="font-semibold text-text-primary mb-0.5">{tip.title}</p>
                        <p className="text-text-secondary text-xs leading-relaxed">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="border-t border-border-glass" />

              {/* ── File Format Guide ── */}
              <section>
                <h3 className="font-bold text-base text-text-primary mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#00cc55] text-black text-xs font-black flex items-center justify-center">4</span>
                  Gerber File Guide
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-glass">
                        <th className="text-left pb-2 text-text-secondary font-semibold">Layer</th>
                        <th className="text-left pb-2 text-text-secondary font-semibold">KiCAD Extension</th>
                        <th className="text-left pb-2 text-text-secondary font-semibold">Eagle Extension</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-glass">
                      {[
                        ['Top Copper', 'F.Cu.gbr', '.cmp / .gtl'],
                        ['Bottom Copper', 'B.Cu.gbr', '.sol / .gbl'],
                        ['Top Silkscreen', 'F.Silks.gbr', '.plc / .gto'],
                        ['Bottom Silkscreen', 'B.Silks.gbr', '.pls / .gbo'],
                        ['Top Solder Mask', 'F.Mask.gbr', '.stc / .gts'],
                        ['Bottom Solder Mask', 'B.Mask.gbr', '.sts / .gbs'],
                        ['Board Outline', 'Edge.Cuts.gbr', '.gm1 / .gko'],
                        ['Drill File', '.drl', '.xln / .exc'],
                      ].map(([layer, kicad, eagle]) => (
                        <tr key={layer}>
                          <td className="py-2 text-text-primary font-medium">{layer}</td>
                          <td className="py-2 text-text-secondary font-mono">{kicad}</td>
                          <td className="py-2 text-text-secondary font-mono">{eagle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* CTA */}
              <div className="bg-accent-primary/[0.07] border border-accent-primary/20 rounded-2xl p-5 text-center">
                <p className="font-bold text-text-primary mb-1">Ready to place your order?</p>
                <p className="text-xs text-text-secondary mb-4">Upload your Gerber files above to get started. Our team reviews every order before production begins.</p>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="px-6 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-black font-bold rounded-full text-sm transition-all"
                >
                  Start Configuring →
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
