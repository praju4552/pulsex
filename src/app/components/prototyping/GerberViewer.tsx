import { useState, useRef, useEffect } from 'react';
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
  const [boardDimensions, setBoardDimensions] = useState<{ width: number; height: number; units: string } | null>(null);
  
  const [activeView, setActiveView] = useState<'top' | 'bottom'>('top');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isolatedLayer, setIsolatedLayer] = useState<string | null>(null);

  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedFile = useRef<File | null>(null);

  const toggleLayer = (filename: string) => {
    setVisibility(prev => ({ ...prev, [filename]: !prev[filename] }));
  };

  const showAll = () => {
    setVisibility(Object.fromEntries(layers.map(l => [l.filename, true])));
    setIsolatedLayer(null);
  };

  const hideAll = () => {
    setVisibility(Object.fromEntries(layers.map(l => [l.filename, false])));
    setIsolatedLayer(null);
  };

  const isolateLayer = (filename: string) => {
    if (isolatedLayer === filename) {
      setIsolatedLayer(null);
      setVisibility(Object.fromEntries(layers.map(l => [l.filename, true])));
    } else {
      setIsolatedLayer(filename);
      setVisibility(Object.fromEntries(layers.map(l => [l.filename, l.filename === filename])));
    }
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
      setBoardDimensions(null);
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
        if (data.boardWidth && data.boardHeight) {
          setBoardDimensions({ width: data.boardWidth, height: data.boardHeight, units: data.boardUnits || 'mm' });
        }

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

  // ── Inject responsive styles into SVG string ────────────────────────────────
  const getAugmentedSvg = (svgStr: string) => {
    if (!svgStr) return '';
    const styleRules = layers.map(l => {
      const isVisible = visibility[l.filename] !== false;
      if (isVisible) return '';
      const classMap: Record<string, string> = { copper: 'cu', silkscreen: 'ss', soldermask: 'sm', outline: 'out', solderpaste: 'sp' };
      const classType = classMap[l.type] || 'cu';
      return `.gerber-preview_${classType} { display: none !important; }`;
    }).join('\n');

    return svgStr.replace('</svg>', `<style>${styleRules}</style></svg>`);
  };

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
            <span className="text-xs text-text-muted ml-2">({layers.length} layers)</span>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-600 gap-3 px-8 text-center">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm font-bold">Rendering Failed</p>
              <p className="text-xs text-zinc-500 max-w-xs">{errorMsg}</p>
            </div>
          )}

          {/* SVG Canvas */}
          {status === 'done' && currentSvg && (
            <div
              className="absolute inset-0 flex items-center justify-center p-8"
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
            >
              <div
                className="gerber-svg-container"
                style={{ maxWidth: '90%', maxHeight: '90%', filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.6))' }}
                dangerouslySetInnerHTML={{ __html: getAugmentedSvg(currentSvg) }}
              />
            </div>
          )}

          {/* Floating Stackup Panel */}
          {status === 'done' && (
            <div className={`absolute top-4 left-4 max-h-[calc(100%-2rem)] bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-2xl ring-1 ring-white/5 transition-all duration-300 z-30 overflow-hidden ${isPanelExpanded ? 'w-60' : 'w-auto'}`}>
              {!isPanelExpanded ? (
                <button
                  onClick={() => setIsPanelExpanded(true)}
                  className="flex items-center gap-2 px-3 py-2 text-[#00ff6a] hover:bg-white/5 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Stackup</span>
                </button>
              ) : (
                <>
                  <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00cc55] animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#00ff6a]">PCB Stackup</span>
                    </div>
                    <button onClick={() => setIsPanelExpanded(false)} className="p-0.5 hover:bg-white/10 rounded text-zinc-500 hover:text-white"><X className="w-3 h-3" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
                    <div className="px-3 py-2 border-b border-white/5 flex gap-2">
                      <button onClick={() => setActiveView('top')} className={`flex-1 py-1 rounded text-[9px] font-bold ${activeView === 'top' ? 'bg-[#00cc55] text-black' : 'bg-zinc-900 text-zinc-400'}`}>TOP</button>
                      <button onClick={() => setActiveView('bottom')} className={`flex-1 py-1 rounded text-[9px] font-bold ${activeView === 'bottom' ? 'bg-[#00cc55] text-black' : 'bg-zinc-900 text-zinc-400'}`}>BOT</button>
                    </div>
                    {panelGroups.map((group, gi) => (
                      <div key={gi} className="mt-2">
                        <div className="px-3 py-1 text-[8px] font-black text-[#00cc55]/60 uppercase">{group.title}</div>
                        {group.items.map(layer => {
                          const isVisible = visibility[layer.filename] !== false;
                          return (
                            <button
                              key={layer.filename}
                              onClick={() => toggleLayer(layer.filename)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.05] text-left ${!isVisible ? 'opacity-40' : ''}`}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LAYER_COLORS[layer.type] || '#888' }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold text-white truncate">{LAYER_LABELS[layer.type] || layer.type}</div>
                              </div>
                              <div className={isVisible ? 'text-[#00cc55]' : 'text-zinc-700'}>
                                {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="px-3 py-2 border-t border-white/5 flex justify-between">
                    <button onClick={showAll} className="text-[9px] font-bold text-[#00cc55]/80 hover:text-[#00cc55]">ALL</button>
                    <button onClick={hideAll} className="text-[9px] font-bold text-zinc-500 hover:text-white">NONE</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Zoom Controls */}
          {status === 'done' && (
            <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-30">
              <div className="flex flex-col bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
                <button onClick={() => setZoom(z => Math.min(z + 0.25, 5))} className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#00cc55]"><ZoomIn className="w-5 h-5" /></button>
                <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#00cc55]"><ZoomOut className="w-5 h-5" /></button>
                <div className="h-px bg-white/5 mx-2 my-1" />
                <button onClick={resetView} className="p-2.5 rounded-xl hover:bg-white/5 text-zinc-400 hover:text-[#00cc55]"><RotateCcw className="w-5 h-5" /></button>
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
              {boardDimensions && (
                <>
                  <span className="mx-2 text-white/10">|</span>
                  <span className="text-zinc-300">Size: </span>
                  <span className="text-white font-bold">{boardDimensions.width} x {boardDimensions.height}</span>
                  <span className="text-zinc-400 text-[8px] ml-0.5">{boardDimensions.units}</span>
                </>
              )}
            </span>
          </div>
          <button className="text-[10px] font-bold text-[#00cc55] hover:text-white uppercase tracking-widest flex items-center gap-1">
            <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
          </button>
        </div>
      )}

      <style>{`
        .gerber-svg-container svg { max-width: 100%; max-height: 520px; width: auto; height: auto; background-color: white; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
      `}</style>
    </div>
  );
}
