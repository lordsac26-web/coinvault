import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, GripHorizontal, Loader2, RefreshCw, Minimize2, Maximize2 } from 'lucide-react';

const METAL_COLORS = { Gold: '#e8c97a', Silver: '#c0c0c0', Platinum: '#a8b8c8', Palladium: '#b8a8d0', Copper: '#d4845a' };

export default function SpotPriceWidget({ onClose }) {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('spotWidgetPos');
    return saved ? JSON.parse(saved) : { x: 16, y: 80 };
  });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const widgetRef = useRef(null);

  const fetchPrices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Look up the current live spot prices for Gold, Silver, Platinum, Palladium, and Copper. Return price per troy ounce in USD (copper per pound). Include 24h change percentage. For unit field use exactly: "troy oz" for Gold/Silver/Platinum/Palladium and "lb" for Copper.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            metals: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, unit: { type: "string" }, change_24h: { type: "string" } } } },
            as_of: { type: "string" }
          }
        },
        model: "gemini_3_flash"
      });
      setPrices(result);
    } catch (err) {
      console.warn('Spot price fetch failed, retrying...', err.message);
      try {
        const retry = await base44.integrations.Core.InvokeLLM({
          prompt: `What are today's spot prices for Gold, Silver, Platinum, Palladium (per troy oz USD) and Copper (per lb USD)? Include 24h change. Use unit field: "troy oz" or "lb".`,
          add_context_from_internet: true,
          response_json_schema: { type: "object", properties: { metals: { type: "array", items: { type: "object", properties: { name: { type: "string" }, price: { type: "string" }, unit: { type: "string" }, change_24h: { type: "string" } } } }, as_of: { type: "string" } } },
          model: "gemini_3_flash"
        });
        setPrices(retry);
      } catch { setError('Could not fetch prices. Tap refresh to try again.'); }
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);
  useEffect(() => { localStorage.setItem('spotWidgetPos', JSON.stringify(position)); }, [position]);

  const handlePointerDown = (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const rect = widgetRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging(true);
    widgetRef.current.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragging) return;
    const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 200);
    const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 100);
    setPosition({ x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, maxX)), y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, maxY)) });
  };
  const handlePointerUp = () => setDragging(false);

  return (
    <div ref={widgetRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
      className="fixed z-[100] select-none" style={{ left: position.x, top: position.y, cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}>
      <div className="rounded-2xl shadow-2xl shadow-black/50 overflow-hidden" style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', backdropFilter: 'blur(20px)', minWidth: minimized ? 180 : 260 }}>
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--cv-border)' }}>
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--cv-text-faint)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-accent)' }}>Spot Prices</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={() => fetchPrices(true)} disabled={refreshing} className="p-1 transition-colors" style={{ color: 'var(--cv-text-faint)' }}><RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /></button>
            <button onClick={() => setMinimized(!minimized)} className="p-1 transition-colors" style={{ color: 'var(--cv-text-faint)' }}>{minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}</button>
            <button onClick={onClose} className="p-1 hover:text-red-400 transition-colors" style={{ color: 'var(--cv-text-faint)' }}><X className="w-3 h-3" /></button>
          </div>
        </div>
        {!minimized && (
          <div className="px-3 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--cv-accent-dim)' }} /></div>
            ) : error ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-[11px] text-red-400/70">{error}</p>
                <button onClick={() => fetchPrices(true)} className="text-[11px] underline" style={{ color: 'var(--cv-accent)' }}>Retry</button>
              </div>
            ) : prices?.metals ? (
              <div className="space-y-1.5">
                {prices.metals.map((m) => {
                  const color = METAL_COLORS[m.name] || 'var(--cv-text)';
                  const isUp = m.change_24h?.includes('+');
                  const isDown = m.change_24h?.includes('-');
                  return (
                    <div key={m.name} className="flex items-center justify-between gap-3 py-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--cv-text-secondary)' }}>{m.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--cv-text)' }}>{m.price}</span>
                        {m.unit && <span className="text-[9px] font-medium" style={{ color: 'var(--cv-text-muted)' }}>/{m.unit.replace('per ', '')}</span>}
                        {m.change_24h && (
                          <span className={`text-[10px] font-medium tabular-nums ${isUp ? 'text-green-400' : isDown ? 'text-red-400' : ''}`} style={!isUp && !isDown ? { color: 'var(--cv-text-muted)' } : {}}>
                            {m.change_24h}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {prices.as_of && <p className="text-[9px] pt-1 text-center" style={{ color: 'var(--cv-text-faint)' }}>{prices.as_of}</p>}
              </div>
            ) : (
              <p className="text-xs text-center py-4" style={{ color: 'var(--cv-text-muted)' }}>Could not load prices</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}