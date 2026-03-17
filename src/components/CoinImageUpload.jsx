import { useRef, useState } from 'react';
import { Camera, ImagePlus, X, RotateCcw } from 'lucide-react';

export default function CoinImageUpload({ label, value, onChange }) {
  const cameraRef = useRef();
  const galleryRef = useRef();
  const [dragging, setDragging] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e) => {
    processFile(e.target.files[0]);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
      <p className="text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-widest text-center">{label}</p>

      {/* Coin circle — tap to take photo on mobile, or drop on desktop */}
      <div
        className={`relative w-36 h-36 sm:w-44 sm:h-44 rounded-full cursor-pointer transition-all ${dragging ? 'scale-105' : ''}`}
        style={{
          border: `2px dashed ${value ? 'rgba(201,168,76,0.6)' : 'rgba(201,168,76,0.35)'}`,
          boxShadow: value
            ? '0 0 0 4px rgba(201,168,76,0.12), 0 8px 32px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(0,0,0,0.3)',
          background: value ? 'transparent' : 'rgba(201,168,76,0.04)',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !value && cameraRef.current.click()}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover rounded-full" />
            {/* Overlay on hover/tap */}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); cameraRef.current.click(); }}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
                title="Retake"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null); }}
                className="w-9 h-9 rounded-full bg-red-500/30 flex items-center justify-center"
                title="Remove"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#c9a84c]/30 flex items-center justify-center">
              <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-[#c9a84c]/40" />
            </div>
            <span className="text-[10px] text-[#f5f0e8]/40 text-center px-4">Tap to photograph</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!value && (
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => cameraRef.current.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c9a84c]/15 text-[#e8c97a] border border-[#c9a84c]/30 text-xs font-medium hover:bg-[#c9a84c]/25 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" /> Camera
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[#f5f0e8]/50 border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors"
          >
            <ImagePlus className="w-3.5 h-3.5" /> Gallery
          </button>
        </div>
      )}

      {/* Hidden file inputs — camera and gallery separated */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}