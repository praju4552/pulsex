import { useState, useRef, useEffect } from 'react';
import { Layers, Eye, ZoomIn, ZoomOut, RotateCcw, Maximize2, Upload, Loader2, AlertTriangle, X } from 'lucide-react';
import { API_BASE_URL } from '../../../api/config';

interface LayerInfo {
  filename: string;
  id: string;
  type: string;
  side: string;
}

interface GerberViewerProps {
  file: File | null;
}

const LAYER_COLORS: Record<string, string> = {
  copper: '#c8a020',
  soldermask: '#006000',
  silkscreen: '#eeeeee',
  solderpaste: '#888888',
  outline: '#FF6600',
  drill: '#ffffff',
};

export default function GerberViewer({ file }: GerberViewerProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [topSvg, setTopSvg] = useState('');
  const [bottomSvg, setBottomSvg] = useState('');
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [activeView, setActiveView] = useState<'top' | 'bottom'>('top');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedFile = useRef<File | null>(null);

  const toggleLayer = (filename: string) => {
    setVisibility(prev => ({ ...prev, [filename]: !prev[filename] }));
  };

  useEffect(() => {
    if (!file || file === loadedFile.current) return;
    loadedFile.current = file;

    const renderFile = async () => {
      setStatus('loading');
      setErrorMsg('');
      setTopSvg('');
      setBottomSvg('');
      setLayers([]);
      setPan({ x: 0, y: 0 });
      setZoom(1);

      try {
        const formData = new FormData();
        formData.append('gerberFile', file);

        const res = await fetch(`${API_BASE_URL}/pcb/render-gerber`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || data.detail || 'Rendering failed');
        }

        setTopSvg(data.topSvg);
        setBottomSvg(data.bottomSvg);
        setLayers(data.layers || []);
        
        // Initialize visibility
        const vars: Record<string, boolean> = {};
        (data.layers || []).forEach((l: LayerInfo) => {
          vars[l.filename] = true;
        });
        setVisibility(vars);
        
        setStatus('done');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to render Gerber files');
        setStatus('error');
      }
    };

    renderFile();
  }, [file]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      setZoom(prevZoom => {
        const newZoom = Math.max(0.1, Math.min(10, prevZoom * (1 + delta * 0.1)));
        return newZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const currentSvg = activeView === 'top' ? topSvg : bottomSvg;

  return (
    <div className="rounded-2xl border border-border-glass bg-[#0a0a0a] overflow-hidden max-w-4xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-glass bg-glass-bg">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#00cc55]" />
          <span className="text-sm font-bold tracking-wide">Gerber Viewer</span>
          {status === 'done' && (
            <span className="text-xs text-text-muted ml-2">({layers.length} layers rendered)</span>
          )}
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-1.5 grayscale opacity-60">
             <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-[#00cc55]" />
             <span className="text-[10px] uppercase font-bold text-text-muted">High Res Mode</span>
           </div>
           <div className="w-px h-4 bg-white/10" />
           <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1.5">
            Scroll to zoom · Drag to pan
          </span>
        </div>
      </div>

      <div className="relative h-[480px]">
        {/* Main Viewer area */}
        <div
          ref={containerRef}
          className={`absolute inset-0 bg-white overflow-hidden select-none group focus:outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
              <Upload className="w-12 h-12 mb-4 opacity-40 text-[#00cc55]" />
              <p className="text-sm font-medium">Upload a Gerber/ZIP file to preview your PCB</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-3">
              <Loader2 className="w-8 h-8 text-[#00cc55] animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest">Rendering Stackup...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-600 gap-3 px-8 text-center bg-red-950/5">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm font-bold">Rendering Failed</p>
              <p className="text-xs text-zinc-500 max-w-xs">{errorMsg}</p>
            </div>
          )}

          {status === 'done' && currentSvg && (
            <div
              className={`absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-300 ${isDragging ? 'opacity-80' : 'opacity-100'}`}
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
            >
              <div
                className="gerber-svg-container"
                style={{
                  maxWidth: '90%',
                  maxHeight: '90%',
                  filter: 'drop-shadow(0 20px 50px rgba(0, 0, 0, 0.6))',
                }}
                dangerouslySetInnerHTML={{ __html: currentSvg }}
              />
            </div>
          )}

          {/* Floating Layer Panel (Embedded) - Glassmorphism */}
          {status === 'done' && (
            <div className={`absolute top-4 left-4 ${isPanelExpanded ? 'w-60' : 'w-auto'} max-h-[calc(100%-2rem)] bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-2xl transition-all duration-300 z-30 overflow-hidden ring-1 ring-white/5`}>
              {!isPanelExpanded ? (
                <button 
                  onClick={() => setIsPanelExpanded(true)}
                  className="flex items-center gap-2 px-3 py-2 text-[#00ff6a] hover:bg-white/5 transition-colors"
                  title="Expand Stackup"
                >
                  <Layers className="w-4 h-4 shadow-[0_0_8px_rgba(0,255,106,0.3)]" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Stackup</span>
                </button>
              ) : (
                <>
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00cc55] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00ff6a] drop-shadow-[0_0_8px_rgba(0,255,106,0.3)]">PCB STACKUP</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setVisibility(Object.fromEntries(layers.map(l => [l.filename, true])))} className="px-1.5 py-0.5 text-[9px] font-bold text-[#00cc55]/70 hover:text-[#00cc55] transition-colors">ALL</button>
                  <span className="text-white/10 text-xs">|</span>
                  <button onClick={() => setVisibility(Object.fromEntries(layers.map(l => [l.filename, false])))} className="px-1.5 py-0.5 text-[9px] font-bold text-zinc-500 hover:text-white transition-colors">NONE</button>
                  <div className="w-px h-3 bg-white/10 mx-1" />
                  <div className="flex bg-zinc-900/80 rounded-lg p-0.5 border border-white/10 shadow-inner">
                    <button onClick={() => setActiveView('top')} className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all ${activeView === 'top' ? 'bg-[#00cc55] text-black shadow-lg shadow-[#00cc55]/20' : 'text-zinc-400 hover:text-white'}`}>TOP</button>
                    <button onClick={() => setActiveView('bottom')} className={`px-2.5 py-1 rounded-md text-[9px] font-bold transition-all ${activeView === 'bottom' ? 'bg-[#00cc55] text-black shadow-lg shadow-[#00cc55]/20' : 'text-zinc-400 hover:text-white'}`}>BOT</button>
                  </div>
                  <div className="w-px h-3 bg-white/10 mx-1" />
                  <button onClick={() => setIsPanelExpanded(false)} className="p-0.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-1.5 py-3 custom-scrollbar space-y-4">
                {[
                  { title: activeView === 'top' ? 'Top Side' : 'Bottom Side', items: layers.filter(l => l.side === activeView || (l.side === 'all' && l.type !== 'outline' && l.type !== 'drill')) },
                  { title: 'Mechanical', items: layers.filter(l => l.type === 'outline' || l.type === 'drill') }
                ].filter(g => g.items.length > 0).map((group, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="px-3 text-[9px] font-black text-[#00cc55] uppercase tracking-[0.15em] mb-1 opacity-90">{group.title}</div>
                    {group.items.map((l) => (
                      <button
                        key={l.filename}
                        onClick={() => toggleLayer(l.filename)}
                        className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-white/[0.04] transition-all group/row text-left rounded-xl ${!visibility[l.filename] ? 'grayscale opacity-40' : ''}`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white/5 shadow-inner shrink-0" style={{ backgroundColor: LAYER_COLORS[l.type] || '#888' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-white shadow-sm leading-none capitalize truncate mb-1 pr-1">{l.type.replace('soldermask', 'Solder Mask').replace('silkscreen', 'Silkscreen').replace('solderpaste', 'Paste')}</div>
                          <div className="text-[8px] text-zinc-400 font-mono truncate tracking-tight">{l.filename}</div>
                        </div>
                        <div className={`transition-all duration-300 ${visibility[l.filename] ? 'text-[#00cc55]' : 'text-zinc-700'}`}>
                          <Eye className={`w-3.5 h-3.5 ${visibility[l.filename] ? 'drop-shadow-[0_0_8px_rgba(0,204,85,0.4)]' : ''}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 bg-white/[0.01] border-t border-white/5 flex flex-wrap gap-x-3 gap-y-1">
                 <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#c8a020]" />
                   <span className="text-[8px] text-zinc-400 font-bold uppercase">Copper</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#006000]" />
                   <span className="text-[8px] text-zinc-400 font-bold uppercase">Mask</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                   <span className="text-[8px] text-zinc-400 font-bold uppercase">Silk</span>
                 </div>
               </div>
               </>
              )}
            </div>
          )}

          {/* Zoom & Navigation Controls */}
          {status === 'done' && (
            <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-30">
               <div className="flex flex-col bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl ring-1 ring-white/5">
                 <button onClick={() => setZoom(z => Math.min(z + 0.25, 5))} className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#00cc55] transition-all"><ZoomIn className="w-5 h-5" /></button>
                 <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#00cc55] transition-all"><ZoomOut className="w-5 h-5" /></button>
                 <div className="h-px bg-white/5 mx-2 my-1" />
                 <button onClick={resetView} className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#00cc55] transition-all"><RotateCcw className="w-5 h-5" /></button>
               </div>
               <div className="text-[10px] font-bold text-[#00cc55] bg-black/60 backdrop-blur-xl px-3 py-2 rounded-2xl border border-white/10 text-center shadow-xl ring-1 ring-white/5 tracking-widest">
                 {(zoom * 100).toFixed(0)}%
               </div>
            </div>
          )}
        </div>
      </div>

      {/* File info footer */}
      {status === 'done' && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border-glass bg-white/[0.02]">
          <div className="flex items-center gap-3">
             <div className="px-2 py-0.5 rounded bg-[#00cc55]/10 border border-[#00cc55]/20 text-[#00cc55] text-[9px] font-black uppercase tracking-widest">Verified</div>
             <span className="text-[10px] text-zinc-400 font-medium">
               <span className="text-white font-bold">{file?.name}</span>
               <span className="mx-2 text-white/10">|</span>
               {layers.length} Layers Detected
             </span>
          </div>
          <div className="flex items-center gap-4">
             <button className="text-[10px] font-bold text-[#00cc55] hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-widest">
               <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
             </button>
          </div>
        </div>
      )}

      <style>{`
        ${layers.map((l) => !visibility[l.filename] ? `
          #gerber-preview_${l.id},
          [id*="${l.id}"],
          [data-layer="${l.filename}"],
          g[id*="${l.filename.replace(/[^a-zA-Z0-9_]/g, '')}"],
          [id*="${l.filename.split('.')[0]}"] { display: none !important; }
        ` : '').join('')}
        
        .gerber-svg-container svg {
          max-width: 100%;
          max-height: 520px;
          width: auto;
          height: auto;
          transition: transform 0.1s ease-out;
          background-color: white;
          filter: drop-shadow(0 10px 40px rgba(0, 0, 0, 0.15));
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,204,85,0.2); }
      `}</style>
    </div>
  );
}
