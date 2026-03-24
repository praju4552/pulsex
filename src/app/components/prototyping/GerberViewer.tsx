import { useState, useRef, useEffect, useCallback } from 'react';
import { Layers, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Maximize2, Upload, Loader2, AlertTriangle, X } from 'lucide-react';
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

const LAYER_LABELS: Record<string, string> = {
  copper: 'Copper',
  soldermask: 'Solder Mask',
  silkscreen: 'Silkscreen',
  solderpaste: 'Solder Paste',
  outline: 'Outline',
  drill: 'Drill',
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
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const loadedFile = useRef<File | null>(null);

  // ── Direct DOM manipulation: show/hide SVG layer groups ──────────────────────
  // pcb-stackup uses id="gerber-preview" for the root SVG,
  // and id="gerber-preview_<layerId>" for each layer <g> group.
  // layerId = filename.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const applyVisibility = useCallback((vis: Record<string, boolean>, allLayers: LayerInfo[]) => {
    const svgContainer = svgContainerRef.current;
    if (!svgContainer) return;

    allLayers.forEach(layer => {
      const isVisible = vis[layer.filename] !== false; // default true
      // The pcb-stackup generated ID
      const elementId = `gerber-preview_${layer.id}`;
      // Try direct ID lookup first
      let el = svgContainer.querySelector(`#${CSS.escape(elementId)}`);
      // Fallback: partial ID match
      if (!el) {
        el = svgContainer.querySelector(`[id="${elementId}"]`);
      }
      if (el) {
        (el as HTMLElement).style.display = isVisible ? '' : 'none';
      }
    });
  }, []);

  // Re-apply visibility whenever visibility state or SVG content changes
  useEffect(() => {
    if (status === 'done' && layers.length > 0) {
      // Small delay to ensure dangerouslySetInnerHTML has flushed to DOM
      const timer = setTimeout(() => applyVisibility(visibility, layers), 50);
      return () => clearTimeout(timer);
    }
  }, [visibility, topSvg, bottomSvg, activeView, status, layers, applyVisibility]);

  const toggleLayer = (filename: string) => {
    setVisibility(prev => {
      const next = { ...prev, [filename]: !prev[filename] };
      // Apply immediately too (belt + suspenders)
      applyVisibility(next, layers);
      return next;
    });
  };

  const showAll = () => {
    const next = Object.fromEntries(layers.map(l => [l.filename, true]));
    setVisibility(next);
    applyVisibility(next, layers);
  };

  const hideAll = () => {
    const next = Object.fromEntries(layers.map(l => [l.filename, false]));
    setVisibility(next);
    applyVisibility(next, layers);
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
      setVisibility({});

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

        // All layers visible by default
        const initVis: Record<string, boolean> = {};
        (data.layers || []).forEach((l: LayerInfo) => { initVis[l.filename] = true; });
        setVisibility(initVis);
        setStatus('done');
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to render Gerber files');
        setStatus('error');
      }
    };

    renderFile();
  }, [file]);

  // ── Wheel zoom ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      setZoom(prev => Math.max(0.1, Math.min(10, prev * (1 + delta * 0.1))));
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

  // ── Group layers for the panel ───────────────────────────────────────────────
  const panelGroups = [
    {
      title: activeView === 'top' ? 'Top Side' : 'Bottom Side',
      items: layers.filter(l => l.side === activeView || (l.side === 'all' && l.type !== 'outline' && l.type !== 'drill')),
    },
    {
      title: 'Mechanical',
      items: layers.filter(l => l.type === 'outline' || l.type === 'drill'),
    },
  ].filter(g => g.items.length > 0);

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
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-zinc-600 font-mono">Scroll to zoom · Drag to pan</span>
        </div>
      </div>

      <div className="relative h-[480px]">
        {/* Main Viewer */}
        <div
          ref={containerRef}
          className={`absolute inset-0 bg-white overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {/* Idle state */}
          {status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
              <Upload className="w-12 h-12 mb-4 opacity-40 text-[#00cc55]" />
              <p className="text-sm font-medium">Upload a Gerber/ZIP file to preview your PCB</p>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-3">
              <Loader2 className="w-8 h-8 text-[#00cc55] animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest">Rendering Stackup...</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-600 gap-3 px-8 text-center">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm font-bold">Rendering Failed</p>
              <p className="text-xs text-zinc-500 max-w-xs">{errorMsg}</p>
            </div>
          )}

          {/* SVG Output */}
          {status === 'done' && currentSvg && (
            <div
              className="absolute inset-0 flex items-center justify-center p-8"
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
            >
              <div
                ref={svgContainerRef}
                className="gerber-svg-container"
                style={{ maxWidth: '90%', maxHeight: '90%', filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.6))' }}
                dangerouslySetInnerHTML={{ __html: currentSvg }}
              />
            </div>
          )}

          {/* ── Floating Stackup Panel ── */}
          {status === 'done' && (
            <div className={`absolute top-4 left-4 max-h-[calc(100%-2rem)] bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-2xl ring-1 ring-white/5 transition-all duration-300 z-30 overflow-hidden ${isPanelExpanded ? 'w-60' : 'w-auto'}`}>
              {!isPanelExpanded ? (
                // Collapsed pill
                <button
                  onClick={() => setIsPanelExpanded(true)}
                  className="flex items-center gap-2 px-3 py-2.5 text-[#00ff6a] hover:bg-white/5 transition-colors"
                  title="Show layer stackup"
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Stackup</span>
                </button>
              ) : (
                <>
                  {/* Panel Header */}
                  <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00cc55] animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#00ff6a]">PCB Stackup</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* TOP / BOT toggle */}
                      <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-white/10">
                        <button onClick={() => setActiveView('top')} className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${activeView === 'top' ? 'bg-[#00cc55] text-black' : 'text-zinc-400 hover:text-white'}`}>TOP</button>
                        <button onClick={() => setActiveView('bottom')} className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${activeView === 'bottom' ? 'bg-[#00cc55] text-black' : 'text-zinc-400 hover:text-white'}`}>BOT</button>
                      </div>
                      {/* ALL / NONE */}
                      <button onClick={showAll} className="px-1.5 py-0.5 text-[9px] font-bold text-[#00cc55]/70 hover:text-[#00cc55] transition-colors">ALL</button>
                      <span className="text-white/20 text-[9px]">|</span>
                      <button onClick={hideAll} className="px-1.5 py-0.5 text-[9px] font-bold text-zinc-500 hover:text-white transition-colors">NONE</button>
                      {/* Close */}
                      <button onClick={() => setIsPanelExpanded(false)} className="ml-0.5 p-0.5 hover:bg-white/10 rounded text-zinc-500 hover:text-white transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Layer List */}
                  <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    {panelGroups.map((group, gi) => (
                      <div key={gi} className="mb-1">
                        <div className="px-3 py-1 text-[8px] font-black text-[#00cc55]/60 uppercase tracking-[0.15em]">{group.title}</div>
                        {group.items.map(layer => {
                          const isVisible = visibility[layer.filename] !== false;
                          return (
                            <button
                              key={layer.filename}
                              onClick={() => toggleLayer(layer.filename)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] transition-all text-left ${!isVisible ? 'opacity-40' : ''}`}
                            >
                              {/* Color dot */}
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                                style={{ backgroundColor: LAYER_COLORS[layer.type] || '#888' }}
                              />
                              {/* Label */}
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold text-white truncate">
                                  {LAYER_LABELS[layer.type] || layer.type}
                                </div>
                                <div className="text-[8px] text-zinc-500 font-mono truncate">{layer.filename}</div>
                              </div>
                              {/* Eye icon */}
                              <div className={`shrink-0 transition-colors ${isVisible ? 'text-[#00cc55]' : 'text-zinc-700'}`}>
                                {isVisible
                                  ? <Eye className="w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(0,204,85,0.5)]" />
                                  : <EyeOff className="w-3.5 h-3.5" />
                                }
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Legend footer */}
                  <div className="px-3 py-2 border-t border-white/5 flex flex-wrap gap-x-3 gap-y-1">
                    {Object.entries(LAYER_COLORS).slice(0, 3).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[8px] text-zinc-500 font-bold uppercase">{type.slice(0, 4)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Zoom Controls */}
          {status === 'done' && (
            <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-30">
              <div className="flex flex-col bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                <button onClick={() => setZoom(z => Math.min(z + 0.25, 5))} className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#00cc55] transition-all"><ZoomIn className="w-5 h-5" /></button>
                <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#00cc55] transition-all"><ZoomOut className="w-5 h-5" /></button>
                <div className="h-px bg-white/5 mx-2 my-1" />
                <button onClick={resetView} className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#00cc55] transition-all"><RotateCcw className="w-5 h-5" /></button>
              </div>
              <div className="text-[10px] font-bold text-[#00cc55] bg-black/70 backdrop-blur-xl px-3 py-2 rounded-2xl border border-white/10 text-center tracking-widest">
                {(zoom * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
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
          <button className="text-[10px] font-bold text-[#00cc55] hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-widest">
            <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
          </button>
        </div>
      )}

      <style>{`
        .gerber-svg-container svg {
          max-width: 100%;
          max-height: 520px;
          width: auto;
          height: auto;
          background-color: white;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
      `}</style>
    </div>
  );
}
