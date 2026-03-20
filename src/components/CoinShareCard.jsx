import { useRef, useState } from 'react';
import { X, Download, Share2, Copy, Check, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export default function CoinShareCard({ coin, onClose }) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const title = `${coin.year || ''} ${coin.denomination || ''}`.trim();
  const grade = coin.user_grade || coin.ai_grade?.suggested_grade;
  const value = coin.market_value?.this_coin_estimated_value;
  const trend = coin.market_value?.price_trend;

  const captureCard = async () => {
    if (!cardRef.current) return null;
    setGenerating(true);
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
    });
    setGenerating(false);
    return canvas;
  };

  const handleDownload = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_') || 'coin'}_card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Card saved!');
  };

  const handleCopyImage = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Could not copy — try downloading instead');
      }
    }, 'image/png');
  };

  const handleNativeShare = async () => {
    const canvas = await captureCard();
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `${title || 'coin'}_card.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${title} — CoinVault`,
          text: `Check out this coin: ${title}${grade ? ` (${grade})` : ''}${value ? ` — est. ${value}` : ''}`,
          files: [file],
        });
      } else {
        handleCopyImage();
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--cv-border)' }}>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4" style={{ color: 'var(--cv-accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--cv-text)' }}>Share Coin</span>
          </div>
          <button onClick={onClose} className="p-1 transition-colors" style={{ color: 'var(--cv-text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview area */}
        <div className="p-4 flex justify-center" style={{ background: 'var(--cv-bg-card)' }}>
          {/* The card that gets rendered to image */}
          <div ref={cardRef} style={{ width: 360, padding: 24, background: 'linear-gradient(160deg, #0f1525, #1a1428)', borderRadius: 20, fontFamily: "'Source Sans 3', sans-serif" }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #c9a84c, #e8c97a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins style={{ width: 12, height: 12, color: '#0a0e1a' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e8c97a', letterSpacing: '0.05em', fontFamily: "'Playfair Display', Georgia, serif" }}>CoinVault</span>
            </div>

            {/* Coin image */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 180, height: 180, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {coin.obverse_image ? (
                  <img src={coin.obverse_image} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
                ) : (
                  <Coins style={{ width: 48, height: 48, color: 'rgba(201,168,76,0.2)' }} />
                )}
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e8c97a', margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>{title || 'Unknown Coin'}</h2>
              {coin.country && <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.45)', margin: '4px 0 0' }}>{coin.country}{coin.coin_series ? ` · ${coin.coin_series}` : ''}</p>}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {grade && (
                <div style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Grade</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#c4b5fd' }}>{grade}</span>
                </div>
              )}
              {value && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Value</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>{value}</span>
                </div>
              )}
              {coin.composition && (
                <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: 10, color: 'rgba(245,240,232,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Metal</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e8c97a' }}>{coin.composition}</span>
                </div>
              )}
            </div>

            {/* Trend badge */}
            {trend && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: trend === 'Rising' ? '#4ade80' : trend === 'Falling' ? '#f87171' : 'rgba(245,240,232,0.35)', fontWeight: 500 }}>
                  {trend === 'Rising' ? '↗ Trending Up' : trend === 'Falling' ? '↘ Trending Down' : '→ Stable'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 p-4" style={{ borderTop: '1px solid var(--cv-border)' }}>
          <Button onClick={handleDownload} disabled={generating} className="flex-1 h-10 rounded-xl gap-1.5 text-sm font-medium" style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
            <Download className="w-4 h-4" /> Save
          </Button>
          <Button onClick={handleCopyImage} disabled={generating} className="flex-1 h-10 rounded-xl gap-1.5 text-sm font-medium" style={{ background: 'var(--cv-input-bg)', color: 'var(--cv-text)', border: '1px solid var(--cv-border)' }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button onClick={handleNativeShare} disabled={generating} className="flex-1 h-10 rounded-xl gap-1.5 text-sm font-medium" style={{ background: 'var(--cv-input-bg)', color: 'var(--cv-text)', border: '1px solid var(--cv-border)' }}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>
      </div>
    </div>
  );
}