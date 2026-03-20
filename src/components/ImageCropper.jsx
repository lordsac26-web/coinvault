import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Circle, Square, RotateCcw, Check, X } from 'lucide-react';

export default function ImageCropper({ file, onCropped, onCancel, initialShape = 'circle' }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [shape, setShape] = useState(initialShape);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const containerRef = useRef(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const size = Math.min(img.width, img.height) * 0.75;
      setCrop({
        x: (img.width - size) / 2,
        y: (img.height - size) / 2,
        size,
      });
      setImgLoaded(true);
    };
    img.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(img.src);
  }, [file]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const container = containerRef.current;
    const maxW = container?.clientWidth || 400;
    const maxH = 400;
    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    const sx = crop.x * scale;
    const sy = crop.y * scale;
    const ss = crop.size * scale;

    ctx.save();
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(sx + ss / 2, sy + ss / 2, ss / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(sx, sy, ss, ss);
    }
    ctx.clip();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Border
    ctx.strokeStyle = '#e8c97a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(sx + ss / 2, sy + ss / 2, ss / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(sx, sy, ss, ss);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }, [crop, shape, imgLoaded]);

  useEffect(() => { draw(); }, [draw]);

  // Mouse/touch handlers
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const img = imgRef.current;
    const scale = Math.min(rect.width / img.width, rect.height / img.height, 1);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const handleDown = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    setDragging(true);
    setDragStart({ x: pos.x - crop.x, y: pos.y - crop.y });
  };

  const handleMove = (e) => {
    if (!dragging || !imgRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const img = imgRef.current;
    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(pos.x - dragStart.x, img.width - prev.size)),
      y: Math.max(0, Math.min(pos.y - dragStart.y, img.height - prev.size)),
    }));
  };

  const handleUp = () => setDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;
    const delta = e.deltaY > 0 ? -20 : 20;
    setCrop(prev => {
      const newSize = Math.max(50, Math.min(Math.min(img.width, img.height), prev.size + delta));
      const cx = prev.x + prev.size / 2;
      const cy = prev.y + prev.size / 2;
      return {
        size: newSize,
        x: Math.max(0, Math.min(cx - newSize / 2, img.width - newSize)),
        y: Math.max(0, Math.min(cy - newSize / 2, img.height - newSize)),
      };
    });
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const outCanvas = document.createElement('canvas');
    const outSize = Math.min(crop.size, 1200);
    outCanvas.width = outSize;
    outCanvas.height = outSize;
    const ctx = outCanvas.getContext('2d');

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, outSize, outSize);

    outCanvas.toBlob((blob) => {
      const croppedFile = new File([blob], file.name || 'cropped.png', { type: 'image/png' });
      onCropped(croppedFile);
    }, 'image/png', 0.92);
  };

  const resetCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const size = Math.min(img.width, img.height) * 0.75;
    setCrop({ x: (img.width - size) / 2, y: (img.height - size) / 2, size });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={() => setShape('circle')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${shape === 'circle' ? 'bg-[var(--cv-accent)]/15 text-[var(--cv-accent)]' : 'text-[var(--cv-text)]/40 hover:text-[var(--cv-text)]/60'}`}>
            <Circle className="w-3.5 h-3.5" /> Coin
          </button>
          <button onClick={() => setShape('rectangle')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${shape === 'rectangle' ? 'bg-[var(--cv-accent)]/15 text-[var(--cv-accent)]' : 'text-[var(--cv-text)]/40 hover:text-[var(--cv-text)]/60'}`}>
            <Square className="w-3.5 h-3.5" /> Bill
          </button>
        </div>
        <button onClick={resetCrop} className="p-1.5 text-[var(--cv-text)]/30 hover:text-[var(--cv-accent)] transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[10px] text-[var(--cv-text)]/30">Drag to position. Scroll/pinch to resize.</p>

      <div ref={containerRef} className="flex justify-center rounded-xl overflow-hidden bg-black/20">
        <canvas
          ref={canvasRef}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
          onWheel={handleWheel}
          className="max-w-full cursor-move"
          style={{ touchAction: 'none' }}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" className="flex-1 h-10 rounded-xl gap-1.5 border-[var(--cv-border)] text-[var(--cv-text)]">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
        <Button onClick={handleCrop} className="flex-1 h-10 rounded-xl gap-1.5 bg-[var(--cv-accent)] hover:opacity-90 text-[var(--cv-accent-text)]">
          <Check className="w-3.5 h-3.5" /> Apply Crop
        </Button>
      </div>
    </div>
  );
}