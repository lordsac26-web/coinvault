import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function ImageViewer({ src, alt, onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const lastDist = useRef(null);
  const containerRef = useRef(null);

  // Fade out the hint after 2.5s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 2500);
    return () => clearTimeout(t);
  }, []);

  const clampScale = (s) => Math.max(0.5, Math.min(s, 8));

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale(prev => clampScale(prev + delta));
  }, []);

  // Pinch zoom for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      setDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = (dist - lastDist.current) * 0.008;
      setScale(prev => clampScale(prev + delta));
      lastDist.current = dist;
    } else if (e.touches.length === 1 && dragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = null;
    setDragging(false);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setDragging(true);
    didDrag.current = false;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    didDrag.current = true;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = (e) => {
    // Close if user clicked (not dragged) on the background — not on controls or the image
    if (!didDrag.current && e.target === containerRef.current) {
      onClose();
    }
    setDragging(false);
  };

  const reset = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', touchAction: 'none' }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
        <span className="text-sm font-medium text-white/70">{alt || 'Coin Image'}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale(prev => clampScale(prev - 0.3))}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={() => setScale(prev => clampScale(prev + 0.3))}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={reset}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hint + Zoom level indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        {showHint && (
          <div className="px-4 py-2 rounded-full bg-black/70 text-white/80 text-xs font-medium animate-pulse">
            Tap background or press Esc to close
          </div>
        )}
        {scale !== 1 && (
          <div className="px-3 py-1.5 rounded-full bg-black/60 text-white/80 text-xs font-medium">
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>

      {/* Image */}
      <img
        src={src}
        alt={alt || ''}
        draggable={false}
        className="max-w-none select-none"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: dragging ? 'grabbing' : 'grab',
          transition: dragging ? 'none' : 'transform 0.1s ease-out',
          maxHeight: '90vh',
          maxWidth: '95vw',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}