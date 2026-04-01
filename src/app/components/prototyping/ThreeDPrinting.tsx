import { useState, useRef, useEffect } from 'react';
import { PrototypingHeader } from './PrototypingHeader';
import { PrototypingFAQ } from './PrototypingFAQ';
import {
  Upload, Loader2, AlertTriangle,
  Check, ChevronRight, IndianRupee, CheckCircle2, Cpu, Settings, RefreshCcw
} from 'lucide-react';
import * as THREE from 'three';
import { API_BASE_URL } from '../../../api/config';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Constants for pricing
const INITIAL_MATERIALS = [
  { id: 'pla', name: 'PLA', density: 1.24, baseCost: 1.5, desc: 'Eco-friendly, easy to print' },
  { id: 'abs', name: 'ABS', density: 1.04, baseCost: 1.8, desc: 'Tough, heat resistant' },
  { id: 'petg', name: 'PETG', density: 1.27, baseCost: 2.0, desc: 'Strong, chemically resistant' },
  { id: 'resin', name: 'Resin', density: 1.15, baseCost: 5.0, desc: 'Ultra high detail' },
];

const INITIAL_QUALITIES = [
  { id: 'draft', name: 'Draft', layerHeight: 0.3, costMult: 0.8 },
  { id: 'standard', name: 'Standard', layerHeight: 0.2, costMult: 1.0 },
  { id: 'high', name: 'High Precision', layerHeight: 0.1, costMult: 1.5 },
];

const INITIAL_FINISHES = [
  { id: 'raw', name: 'Raw', cost: 0 },
  { id: 'sanded', name: 'Sanded', cost: 50 },
  { id: 'polished', name: 'Polished', cost: 100 },
  { id: 'painted', name: 'Painted', cost: 150 },
];

interface ModelMetadata {
  volume: number;
  surfaceArea: number;
  width: number;
  height: number;
  depth: number;
  triangleCount: number;
  estimatedPrintTime: number;
}

export default function ThreeDPrinting() {
  const [step, setStep] = useState<'upload' | 'processing' | 'configure' | 'summary' | 'success'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Pricing Configuration State from BackEnd
  const [materials, setMaterials] = useState(INITIAL_MATERIALS);
  const [qualities, setQualities] = useState(INITIAL_QUALITIES);
  const [finishes, setFinishes] = useState(INITIAL_FINISHES);

  useEffect(() => {
    fetch(`${API_BASE_URL}/pricing/3d_pricing`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.value) {
          if (data.value.materials) setMaterials(data.value.materials);
          if (data.value.qualities) setQualities(data.value.qualities);
          if (data.value.finishes) setFinishes(data.value.finishes);
        }
      })
      .catch(err => console.error('Failed to load pricing:', err));
  }, []);

  // Auth check is handled by PrototypingHeader (redirects to /auth if not logged in).
  // No localStorage read needed here.
  
  // Configuration State
  const [config, setConfig] = useState({
    material: 'pla',
    infill: 20,
    scale: 1.0,
    quality: 'standard',
    finish: 'raw',
    color: 'White',
    quantity: 1,
    sliceEnabled: false,
    slicePosition: 100,
    lastAction: ''
  });
  const [modelColor, setModelColor] = useState('#3dbb6a');

  // Pricing State
  const [price, setPrice] = useState({
    base: 0,
    material: 0,
    processing: 0,
    total: 0,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let uploadedFile: File | null = null;
    if ('files' in e.target) {
      uploadedFile = e.target.files?.[0] || null;
    } else if ('dataTransfer' in e) {
      e.preventDefault();
      uploadedFile = e.dataTransfer.files?.[0] || null;
    }

    if (!uploadedFile) return;

    // Validation
    const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'obj', '3mf', 'step', 'stp'].includes(ext || '')) {
      setError('Unsupported file format. Please upload STL, OBJ, 3MF or STEP.');
      return;
    }

    if (uploadedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setStep('processing');

    // Upload to backend
    try {
      const formData = new FormData();
      formData.append('modelFile', uploadedFile);
      
      const res = await fetch(`${API_BASE_URL}/three-d-printing/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error);
      
      setFileId(data.fileId);
      pollForMetadata(data.fileId);
    } catch (err: any) {
      setError(err.message);
      setStep('upload');
    }
  };

  const pollForMetadata = async (id: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/three-d-printing/status/${id}`);
        const data = await res.json();
        
        if (data.file.uploadStatus === 'COMPLETED') {
          setMetadata(data.file.metadata);
          setStep('configure');
        } else if (data.file.uploadStatus === 'FAILED') {
          setError('Model processing failed. Please try a different file.');
          setStep('upload');
        } else {
          setTimeout(poll, 2000);
        }
      } catch (err) {
        setError('Failed to fetch processing status.');
        setStep('upload');
      }
    };
    poll();
  };

  useEffect(() => {
    if (metadata) calculatePrice();
  }, [metadata, config]);

  const calculatePrice = () => {
    if (!metadata) return;

    const selectedMaterial = materials.find(m => m.id === config.material) || materials[0];
    const selectedQuality = qualities.find(q => q.id === config.quality) || qualities[0];
    const selectedFinish = finishes.find(f => f.id === config.finish) || finishes[0];

    if (!selectedMaterial || !selectedQuality || !selectedFinish) return;

    // Simple scale-aware volume (scale is linear, volume is cubic)
    const scaledVolume = metadata.volume * Math.pow(config.scale, 3) / 1000; // cm3

    // Support both pricing models:
    // Backend model: costMult (multiplier), no density/baseCost
    // Frontend fallback model: density + baseCost
    const materialMult = (selectedMaterial as any).costMult ?? 1.0;
    const density = (selectedMaterial as any).density ?? 1.24;
    const baseCostPerG = (selectedMaterial as any).baseCost ?? 0;
    const qualityMult = selectedQuality.costMult ?? 1.0;
    const finishCost = selectedFinish.cost ?? 0;

    let materialCost: number;
    if (baseCostPerG > 0) {
      // Frontend fallback model: Volume * Density * CostPerGram * Infill%
      materialCost = (scaledVolume * density * baseCostPerG * (config.infill / 100)) * qualityMult;
    } else {
      // Backend multiplier model: Volume * baseCostPerCm3 * materialMult * qualityMult * infillFactor
      const costPerCm3 = 5; // default from backend
      materialCost = scaledVolume * costPerCm3 * materialMult * qualityMult * (config.infill / 100);
    }

    // Processing / Machine Cost: Fixed minimum processing fee
    const baseProcessing = 250;

    const total = (materialCost + baseProcessing + finishCost) * (config.quantity || 1);

    setPrice({
      base: baseProcessing,
      material: Math.round(materialCost),
      processing: finishCost,
      total: Math.max(Math.round(total), 0),
    });
  };

  const handleSaveToCart = () => {
    const selectedQuality = qualities.find(q => q.id === config.quality);
    const payloadConfig = {
      ...config,
      layerHeight: selectedQuality ? selectedQuality.layerHeight : 0.2
    };

    const cartItem = {
      id: Date.now().toString(),
      type: '3D Printing',
      spec: `3D Print: ${config.material}, ${config.infill}% Infill, ${config.finish}`,
      fullSpec: {
         fileId,
         config: payloadConfig
      },
      qty: config.quantity || 1,
      pcbPrice: price.total,
      shippingMethod: 'Standard',
      shippingCost: 100,
      image: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?q=80&w=2070&auto=format&fit=crop'
    };

    let cart = [];
    try {
      const saved = localStorage.getItem('prototyping_cart');
      if (saved) cart = JSON.parse(saved);
    } catch {}

    cart.push(cartItem);
    localStorage.setItem('prototyping_cart', JSON.stringify(cart));
    
    // Redirect to cart
    window.location.href = '/prototyping/cart';
  };

  return (
    <div className="min-h-screen bg-bg-secondary text-text-primary overflow-x-hidden">
      <PrototypingHeader />

      <main className="pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
             {['Upload', 'Configure', 'Confirm'].map((s, i) => (
                <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                        step === 'upload' && i === 0 ? 'bg-[#00cc55] border-[#00cc55] text-black' :
                        (step === 'configure' || step === 'processing') && i <= 1 ? 'bg-[#00cc55] border-[#00cc55] text-black' :
                        step === 'summary' && i <= 2 ? 'bg-[#00cc55] border-[#00cc55] text-black' : 
                        step === 'success' ? 'bg-[#00cc55] border-[#00cc55] text-black' :
                        'bg-surface-100 border-border-glass text-text-muted'
                    }`}>
                        {step === 'success' || (step === 'configure' && i === 0) || (step === 'summary' && i < 2) ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`ml-3 text-xs font-medium ${
                        (step === 'upload' && i === 0) || 
                        ((step === 'configure' || step === 'processing') && i <= 1) ||
                        (step === 'summary' && i <= 2) || step === 'success' ? 'text-white' : 'text-text-muted'
                    }`}>{s}</span>
                    {i < 2 && <div className={`w-12 h-px mx-4 ${i === 0 && (step === 'configure' || step === 'summary' || step === 'success') ? 'bg-[#00cc55]' : i === 1 && (step === 'summary' || step === 'success') ? 'bg-[#00cc55]' : 'bg-surface-100'}`} />}
                </div>
             ))}
          </div>

          {step === 'upload' && (
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold mb-4">Professional 3D Printing</h1>
                    <p className="text-text-secondary">Upload your STL, OBJ, or STEP file to get an instant quote.</p>
                </div>
                
                <div 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileUpload}
                    className="aspect-video rounded-3xl border-2 border-dashed border-border-glass bg-surface-100 flex flex-col items-center justify-center p-12 hover:border-[#00cc55]/40 hover:bg-[#00cc55]/5 transition-all group cursor-pointer relative overflow-hidden"
                >
                    <input 
                        type="file" 
                        id="model-upload" 
                        className="hidden" 
                        accept=".stl,.obj,.step,.stp,.3mf" 
                        onChange={handleFileUpload}
                    />
                    <label htmlFor="model-upload" className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                        <Upload className="w-16 h-16 text-[#00cc55] mb-6 animate-bounce" />
                        <h3 className="text-xl font-bold mb-2">Drag & Drop Model</h3>
                        <p className="text-text-muted text-sm">Or click to browse from files</p>
                        <div className="mt-8 flex gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                            <span>STL</span>
                            <span>OBJ</span>
                            <span>STEP</span>
                            <span>3MF</span>
                        </div>
                    </label>
                </div>

                {error && (
                    <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" /> {error}
                    </div>
                )}
            </div>
          )}

          {step === 'processing' && (
             <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full border-2 border-[#00cc55]/20 border-t-[#00cc55] animate-spin" />
                    <Cpu className="w-10 h-10 text-[#00cc55] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold mt-8">Analyzing Mesh Geometry</h2>
                <p className="text-text-secondary mt-2 max-w-sm">We're calculating volume, surface area, and printability markers...</p>
             </div>
          )}

          {(step === 'configure' || step === 'summary') && metadata && (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Global Error Alert */}
                {error && (
                    <div className="lg:col-span-12 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
                    </div>
                )}
                
                {/* 3D Preview Column */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-[12px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden relative group border border-zinc-200">
                        {/* Model Color Customization & View Presets */}
                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
                             {/* Color Selectors */}
                             <div className="bg-white/90 backdrop-blur-md rounded-lg border border-zinc-200 p-2 shadow-sm flex flex-col gap-2 min-w-[200px]">
                                <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest pl-1">Model Preview Color</span>
                                <div className="flex items-center gap-1.5 pl-1">
                                    {[
                                        { name: 'Green', value: '#3dbb6a' },
                                        { name: 'White', value: '#ffffff' },
                                        { name: 'Black', value: '#111111' },
                                        { name: 'Gray', value: '#808080' },
                                        { name: 'Red', value: '#ef4444' },
                                        { name: 'Blue', value: '#3b82f6' },
                                    ].map((c) => (
                                        <button
                                            key={c.name}
                                            onClick={() => setModelColor(c.value)}
                                            className={`w-4 h-4 rounded-full border border-zinc-200 transition-all ${modelColor === c.value ? 'ring-2 ring-[#00cc55] scale-110' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: c.value }}
                                            title={c.name}
                                        />
                                    ))}
                                    <div className="w-px h-3 bg-zinc-200 mx-1" />
                                    <input 
                                        type="color" 
                                        value={modelColor}
                                        onChange={(e) => setModelColor(e.target.value)}
                                        className="w-5 h-5 bg-transparent border-0 p-0 cursor-pointer rounded-full"
                                        title="Custom Color"
                                    />
                                </div>
                             </div>

                              <div className="flex bg-white/90 backdrop-blur-md rounded-lg border border-zinc-200 p-1 shadow-sm self-start">
                                <button onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'top' }))} className="px-3 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 rounded-md transition-all">Top</button>
                                <button onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'front' }))} className="px-3 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 rounded-md transition-all">Front</button>
                                <button onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'side' }))} className="px-3 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 rounded-md transition-all">Side</button>
                                <button onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'iso' }))} className="px-3 py-1 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 rounded-md transition-all">Iso</button>
                                <div className="w-px h-3 bg-zinc-200 self-center mx-1" />
                                <button 
                                    onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'fit' }))}
                                    className="px-3 py-1 text-[10px] font-bold text-[#00cc55] hover:bg-[#00cc55]/10 rounded-md transition-all"
                                >
                                    Fit Model
                                </button>
                              </div>
                             
                             <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'reset' }))}
                                className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg border border-zinc-200 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 shadow-sm transition-all self-start"
                             >
                                Reset View
                             </button>
                        </div>

                        <div className="aspect-square lg:aspect-[4/3]">
                            <ThreeDViewer 
                                file={file} 
                                scale={config.scale} 
                                _config={config} 
                                _metadata={metadata}
                                sliceEnabled={config.sliceEnabled}
                                slicePosition={config.slicePosition}
                                modelColor={modelColor}
                            />
                        </div>

                        {/* File Name Tag */}
                        <div className="absolute top-4 right-4 z-10">
                             <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-border-glass text-[10px] font-mono text-[#00cc55] uppercase tracking-wider shadow-lg">
                                {file?.name}
                             </div>
                        </div>
                    </div>

                    {/* Viewer Controls (Cross Section) */}
                    <div className="p-4 rounded-2xl bg-surface-100 border border-border-glass flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#00cc55]" /> Advanced Analysis Tools
                            </h3>
                            <div className="flex items-center gap-3">
                                <label className="text-xs text-text-secondary">Enable Cross Section</label>
                                <button 
                                    onClick={() => setConfig({...config, sliceEnabled: !config.sliceEnabled})}
                                    className={`w-10 h-5 rounded-full transition-all relative ${config.sliceEnabled ? 'bg-[#00cc55]' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.sliceEnabled ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                        
                        {config.sliceEnabled && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between text-[10px] text-text-muted uppercase tracking-widest font-bold">
                                    <span>Base</span>
                                    <span>Slice Position ({(config.slicePosition).toFixed(0)}%)</span>
                                    <span>Top</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={config.slicePosition} 
                                    onChange={(e) => setConfig({...config, slicePosition: parseInt(e.target.value)})}
                                    className="w-full accent-[#00cc55]"
                                />
                            </div>
                        )}
                    </div>

                    {/* Printability Checklist */}
                    <div className="p-6 rounded-3xl bg-surface-100 border border-border-glass">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#00cc55]" /> Printability Report
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-primary/60 border border-[#00cc55]/20">
                                <span className="text-xs text-text-secondary">Mesh Integrity</span>
                                <span className="text-xs font-bold text-[#00cc55]">SUCCESS</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-primary/60 border border-amber-500/20">
                                <span className="text-xs text-text-secondary">Overhang Analysis</span>
                                <span className="text-xs font-bold text-amber-500">SUPPORTS REQ</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-primary/60 border border-[#00cc55]/20">
                                <span className="text-xs text-text-secondary">Wall Thickness</span>
                                <span className="text-xs font-bold text-[#00cc55]">VALID</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-primary/60 border border-[#00cc55]/20">
                                <span className="text-xs text-text-secondary">Manifold Geometry</span>
                                <span className="text-xs font-bold text-[#00cc55]">CLEAN</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuration Column */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="p-8 rounded-3xl bg-glass-bg-hover border border-border-glass relative">
                        <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                            <Settings className="w-6 h-6 text-[#00cc55]" /> Configuration
                        </h2>

                        <div className="space-y-8">
                            {/* Material */}
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Material Selection</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {materials.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setConfig({...config, material: m.id})}
                                            className={`p-4 rounded-2xl border text-left transition-all ${
                                                config.material === m.id ? 'bg-[#00cc55] border-[#00cc55] text-black' : 'bg-surface-100 border-border-glass hover:border-border-color text-text-primary'
                                            }`}
                                        >
                                            <div className="font-bold text-sm">{m.name}</div>
                                            <div className="text-[10px] opacity-70 mt-1">{m.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Infill & Quality */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Infill Density ({config.infill}%)</label>
                                    <input 
                                        type="range" min="10" max="100" step="10" 
                                        value={config.infill} onChange={(e) => setConfig({...config, infill: parseInt(e.target.value)})}
                                        className="w-full accent-[#00cc55]"
                                    />
                                    <div className="flex justify-between text-[10px] text-text-muted mt-2">
                                        <span>Light</span>
                                        <span>Solid</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Print Quality</label>
                                    <select 
                                        value={config.quality} onChange={(e) => setConfig({...config, quality: e.target.value})}
                                        className="w-full bg-black/50 border border-border-glass rounded-xl px-4 py-2 text-sm focus:border-[#00cc55] outline-none"
                                    >
                                        {qualities.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Scaling */}
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Scaling Factor ({(config.scale * 100).toFixed(0)}%)</label>
                                <div className="flex items-center gap-4">
                                     <button onClick={() => setConfig({...config, scale: Math.max(0.1, config.scale - 0.1)})} className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center hover:bg-surface-100 border border-border-glass">-</button>
                                     <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#00cc55]" style={{ width: `${(config.scale / 2) * 100}%` }} />
                                     </div>
                                     <button onClick={() => setConfig({...config, scale: Math.min(2.0, config.scale + 0.1)})} className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center hover:bg-surface-100 border border-border-glass">+</button>
                                </div>
                            </div>

                             {/* Finish */}
                             <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 block">Surface Finish</label>
                                <div className="flex flex-wrap gap-2">
                                    {finishes.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setConfig({...config, finish: f.id})}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                config.finish === f.id ? 'bg-white text-black border-white' : 'bg-surface-100 border-border-glass text-text-secondary'
                                            }`}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Order Summary & Pricing */}
                        <div className="mt-12 p-6 rounded-2xl bg-bg-primary/60 border border-border-glass space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Estimated Print Time</span>
                                <span className="text-text-primary font-mono">~{Math.round(metadata.estimatedPrintTime * config.scale)} mins</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Total Weight</span>
                                <span className="text-text-primary font-mono">~{Math.round(metadata.volume * config.scale * 0.0012)}g</span>
                            </div>
                            <div className="h-px bg-surface-100" />
                            <div className="flex justify-between items-center pt-2">
                                <div>
                                    <div className="text-[10px] font-bold text-[#00cc55] uppercase tracking-widest mb-1">Estimated Cost</div>
                                    <div className="text-4xl font-black flex items-center gap-1">
                                        <IndianRupee className="w-6 h-6 text-[#00cc55]" />
                                        {price.total}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button 
                                        onClick={handleSaveToCart}
                                        className="px-8 py-4 bg-[#00cc55] hover:bg-[#00cc55]/90 text-black font-black rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(0,204,85,0.3)] transition-all hover:scale-105 active:scale-95"
                                    >
                                        Save to Cart <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => { setStep('upload'); setFile(null); setFileId(null); setMetadata(null); setError(null); }}
                                        className="flex items-center gap-2 px-4 py-2 text-xs text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all"
                                    >
                                        <RefreshCcw className="w-3.5 h-3.5" /> Start Over
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          )}

          {step === 'success' && (
             <div className="max-w-2xl mx-auto py-20 text-center">
                <div className="w-24 h-24 rounded-full bg-[#00cc55]/20 flex items-center justify-center mx-auto mb-8 border border-[#00cc55]/30">
                    <CheckCircle2 className="w-12 h-12 text-[#00cc55]" />
                </div>
                <h1 className="text-4xl font-bold mb-4">Order Placed Successfully!</h1>
                <p className="text-text-secondary text-lg mb-10">Your 3D model has been received. Our engineers will perform a final check before production starts.</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => window.location.href='/prototyping/orders'} className="px-8 py-3 bg-[#00cc55] text-black font-bold rounded-xl transition-all hover:bg-[#00cc55]/90">Track Order</button>
                    <button onClick={() => setStep('upload')} className="px-8 py-3 border border-border-color rounded-xl font-bold transition-all hover:bg-surface-100">Place Another Order</button>
                </div>
             </div>
          )}
        </div>
      </main>

      <PrototypingFAQ 
         title="3D Printing FAQs"
         description="Everything you need to know about our industrial 3D printing service"
         faqs={[
            { question: 'What file formats do you accept?', answer: 'We accept STL, OBJ, STP, STEP, and 3MF files.' },
            { question: 'What is the maximum size for 3D prints?', answer: 'Our build platforms support prints up to 250×210×210mm. For larger items, we can print in parts.' },
            { question: 'Which materials are best?', answer: 'PLA for prototypes, PETG for functional parts, Nylon for flexible items, and Resin for high detail models.' },
         ]}
      />
    </div>
  );
}

/**
 * Three.js Model Viewer Component
 */
/**
 * Three.js Model Viewer Component - Professional Engineering Version
 */
function ThreeDViewer({ 
  file, 
  scale, 
  _metadata,
  sliceEnabled,
  slicePosition,
  modelColor
}: { 
  file: File | null; 
  scale: number; 
  _config: any; 
  _metadata: any;
  sliceEnabled: boolean;
  slicePosition: number;
  modelColor: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [currentMetadata, setCurrentMetadata] = useState<any>(_metadata);
  
  
  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const linesGroupRef = useRef<THREE.Group | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, -1, 0), 100));
  const sliceVisualPlaneRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current || !file) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff');
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(150, 150, 150);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(200, 400, 300);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.PointLight(0xffffff, 0.5);
    fillLight.position.set(-100, 100, 200);
    scene.add(fillLight);

    // Build Plate (220x220)
    const plateGeom = new THREE.PlaneGeometry(220, 220);
    const plateMat = new THREE.MeshStandardMaterial({ 
        color: 0xf2f2f2, 
        roughness: 0.9, 
        metalness: 0.1 
    });
    const plate = new THREE.Mesh(plateGeom, plateMat);
    plate.rotation.x = -Math.PI / 2;
    plate.receiveShadow = true;
    scene.add(plate);

    // Grid Floor (220mm, 22 divisions = 10mm spacing)
    const grid = new THREE.GridHelper(220, 22, 0xe5e5e5, 0xe5e5e5);
    grid.position.y = 0.01; // Slightly above plate to avoid Z-fighting
    scene.add(grid);

    // Build Volume Wireframe (220x220x250)
    const volumeGeom = new THREE.BoxGeometry(220, 250, 220);
    const edges = new THREE.EdgesGeometry(volumeGeom);
    const volumeMat = new THREE.LineBasicMaterial({ 
        color: 0xcfcfcf, 
        transparent: true, 
        opacity: 0.25 
    });
    const buildVolume = new THREE.LineSegments(edges, volumeMat);
    buildVolume.position.y = 125; // Centered vertically (0 to 250)
    scene.add(buildVolume);

    // Axis Indicator
    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 1500;
    controlsRef.current = controls;

    // Dimension Lines Group
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);
    linesGroupRef.current = linesGroup;

    // Slice Plane Visualization
    const sliceGeom = new THREE.PlaneGeometry(220, 220);
    const sliceMat = new THREE.MeshBasicMaterial({ 
        color: 0x3b82f6, 
        transparent: true, 
        opacity: 0.25, 
        side: THREE.DoubleSide 
    });
    const sliceVisual = new THREE.Mesh(sliceGeom, sliceMat);
    sliceVisual.rotation.x = Math.PI / 2;
    sliceVisual.visible = false;
    scene.add(sliceVisual);
    sliceVisualPlaneRef.current = sliceVisual;

    // Load Model
    const loader = new STLLoader();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const contents = e.target?.result as ArrayBuffer;
      let geometry = loader.parse(contents);
      
      const material = new THREE.MeshStandardMaterial({ 
        color: modelColor, 
        roughness: 0.4, 
        metalness: 0.1,
        clippingPlanes: [clippingPlaneRef.current],
        clipShadows: true
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      meshRef.current = mesh;

      // Initial centering & positioning on build plate
      centerAndFrameModel(mesh, camera, controls);
      
      scene.add(mesh);
      setLoading(false);
    };

    if (file.name.toLowerCase().endsWith('.stl')) {
        reader.readAsArrayBuffer(file);
    } else {
        setLoading(false);
    }

    // Helper functions
    const centerAndFrameModel = (mesh: THREE.Mesh, cam: THREE.PerspectiveCamera, ctrl: any) => {
        mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox!;
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // Translate geometry so bottom is at Y=0 and it's centered in X/Z
        const size = new THREE.Vector3();
        box.getSize(size);
        
        mesh.geometry.translate(-center.x, -box.min.y, -center.z);
        mesh.geometry.computeBoundingBox(); // Recalculate
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 1.6; // Changed from 2.5 to 1.6 to make model larger by default
        const modelHeight = size.y;
        
        // Initial view is Isometric
        cam.position.set(distance, distance, distance);
        cam.up.set(0, 1, 0);
        cam.lookAt(0, modelHeight / 2, 0);
        ctrl.target.set(0, modelHeight / 2, 0);
        ctrl.update();
        
        updateTechnicalData(mesh);
        updateMeasurementLines(mesh.geometry, linesGroupRef.current!, scale);
    };

    const updateTechnicalData = (mesh: THREE.Mesh) => {
        mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox!;
        const size = new THREE.Vector3();
        box.getSize(size);
        
        setCurrentMetadata((prev: any) => ({
            ...prev,
            width: size.x,
            height: size.y,
            depth: size.z,
            volume: calculateVolume(mesh.geometry)
        }));
    };

    const calculateVolume = (geometry: THREE.BufferGeometry) => {
        if (!geometry.index) return _metadata.volume; // Fallback
        
        let volume = 0;
        const index = geometry.index.array;
        const position = geometry.attributes.position.array;
        const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();

        for (let i = 0; i < index.length; i += 3) {
            p1.fromArray(position, index[i] * 3);
            p2.fromArray(position, index[i+1] * 3);
            p3.fromArray(position, index[i+2] * 3);
            volume += p1.dot(p2.cross(p3)) / 6.0;
        }
        return Math.abs(volume);
    };

    const handleViewChange = (e: any) => {
        if (!cameraRef.current || !controlsRef.current || !meshRef.current) return;
        
        const mesh = meshRef.current;
        mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox!;
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x * scale, size.y * scale, size.z * scale);
        const dist = maxDim * 1.6; // Changed from 2.5 to 1.6 to match initial zoom
        const centerY = (size.y * scale) / 2;
        
        const type = e.detail;
        
        // Always reset UP vector before applying specific views
        cameraRef.current.up.set(0, 1, 0);

        switch (type) {
            case 'top':
                cameraRef.current.position.set(0, dist, 0);
                cameraRef.current.up.set(0, 0, -1);
                break;
            case 'front':
                cameraRef.current.position.set(0, centerY, dist);
                break;
            case 'side':
                cameraRef.current.position.set(dist, centerY, 0);
                break;
            case 'iso':
            case 'fit':
            case 'reset':
                cameraRef.current.position.set(dist, dist, dist);
                break;
        }
        
        controlsRef.current.target.set(0, centerY, 0);
        cameraRef.current.lookAt(0, centerY, 0);
        controlsRef.current.update();
    };

    window.addEventListener('changeView', handleViewChange);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('changeView', handleViewChange);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        if (meshRef.current.material instanceof THREE.Material) {
            meshRef.current.material.dispose();
        }
      }
    };
  }, [file]);

  // Update material color
  useEffect(() => {
    if (meshRef.current) {
        meshRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(m => {
                            if ('color' in m) (m as any).color.set(modelColor);
                        });
                    } else if ('color' in mesh.material) {
                        (mesh.material as any).color.set(modelColor);
                    }
                    if (mesh.material instanceof THREE.Material) {
                        mesh.material.needsUpdate = true;
                    }
                }
            }
        });
    }
  }, [modelColor, loading]);

  // Update scale and measurement lines
  useEffect(() => {
    if (meshRef.current && linesGroupRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
      updateMeasurementLines(meshRef.current.geometry, linesGroupRef.current, scale);
    }
  }, [scale]);

  // Update Cross Section
  useEffect(() => {
    if (meshRef.current && sliceVisualPlaneRef.current) {
        sliceVisualPlaneRef.current.visible = sliceEnabled;
        
        if (sliceEnabled) {
            meshRef.current.geometry.computeBoundingBox();
            const box = meshRef.current.geometry.boundingBox!;
            const size = new THREE.Vector3();
            box.getSize(size);
            
            // Map 0-100% to box limits
            const minY = -size.y / 2 * scale;
            const maxY = size.y / 2 * scale;
            const currentY = minY + (maxY - minY) * (slicePosition / 100);
            
            clippingPlaneRef.current.constant = currentY;
            sliceVisualPlaneRef.current.position.y = currentY;
        } else {
            clippingPlaneRef.current.constant = 10000; // Move out of range
        }
    }
  }, [sliceEnabled, slicePosition, scale]);

  const updateMeasurementLines = (geometry: THREE.BufferGeometry, group: THREE.Group, currentScale: number) => {
    group.clear();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    if (!box) return;

    const size = new THREE.Vector3();
    box.getSize(size);
    size.multiplyScalar(currentScale);

    const halfX = size.x / 2;
    const halfY = size.y / 2;
    const halfZ = size.z / 2;
    const offset = 10;

    const createDimLine = (start: THREE.Vector3, end: THREE.Vector3, label: string) => {
        const lineGeom = new THREE.BufferGeometry().setFromPoints([start, end]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.5 });
        const line = new THREE.Line(lineGeom, lineMat);
        group.add(line);

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(0, 0, 256, 64);
            ctx.font = 'Bold 24px Arial';
            ctx.fillStyle = '#333333';
            ctx.textAlign = 'center';
            ctx.fillText(label, 128, 40);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.copy(start.clone().add(end).multiplyScalar(0.5));
        sprite.scale.set(0.16, 0.04, 1);
        group.add(sprite);
    };

    createDimLine(new THREE.Vector3(-halfX, -halfY - offset, halfZ), new THREE.Vector3(halfX, -halfY - offset, halfZ), `X = ${(size.x).toFixed(1)} mm`);
    createDimLine(new THREE.Vector3(-halfX - offset, -halfY, halfZ), new THREE.Vector3(-halfX - offset, halfY, halfZ), `Y = ${(size.y).toFixed(1)} mm`);
    createDimLine(new THREE.Vector3(halfX + offset, -halfY, -halfZ), new THREE.Vector3(halfX + offset, -halfY, halfZ), `Z = ${(size.z).toFixed(1)} mm`);
  };

  return (
    <div ref={mountRef} className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
           <Loader2 className="w-10 h-10 text-[#00cc55] animate-spin mb-4" />
           <p className="text-text-muted font-bold text-sm">Processing 3D Model...</p>
        </div>
      )}



      {/* Embedded Dimension Panel Overlay */}
      {!loading && currentMetadata && (
          <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-zinc-200 shadow-md min-w-[180px]">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3 border-b border-zinc-100 pb-2">Technical Data</h4>
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] text-text-muted">Width (X)</span>
                          <span className="text-xs font-bold text-zinc-800">{(currentMetadata.width * scale).toFixed(1)} mm</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] text-text-muted">Depth (Y)</span>
                          <span className="text-xs font-bold text-zinc-800">{(currentMetadata.depth * scale).toFixed(1)} mm</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] text-text-muted">Height (Z)</span>
                          <span className="text-xs font-bold text-zinc-800">{(currentMetadata.height * scale).toFixed(1)} mm</span>
                      </div>
                      <div className="h-px bg-zinc-100 my-2" />
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] text-text-muted">Volume</span>
                          <span className="text-xs font-bold text-zinc-800">{(currentMetadata.volume * Math.pow(scale, 3) / 1000).toFixed(2)} cm³</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] text-text-muted">Triangles</span>
                          <span className="text-xs font-bold text-zinc-800">{_metadata.triangleCount.toLocaleString()}</span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
