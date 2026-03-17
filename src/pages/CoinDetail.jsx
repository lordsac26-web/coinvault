import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, RotateCcw, Tag, MapPin, Calendar, DollarSign, Circle, ZoomIn } from 'lucide-react';
import { getCoinById, updateCoin, deleteCoin, getCollections } from '../lib/storage';
import { enrichCoin, getMarketValue, hasApiKey } from '../lib/anthropic';
import CoinIntelligence from '../components/CoinIntelligence';
import MarketValue from '../components/MarketValue';
import AIGradingCard from '../components/AIGradingCard';

const detailTabs = ['History', 'Mintage', 'Varieties', 'Market Value', 'Notes', 'Grading Report'];

const Chip = ({ children, color = 'default' }) => {
  const colors = {
    default: 'bg-white/5 text-[#f5f0e8]/60 border border-white/10',
    gold: 'bg-[#c9a84c]/15 text-[#e8c97a] border border-[#c9a84c]/30',
    blue: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[color]}`}>{children}</span>;
};

export default function CoinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coin, setCoin] = useState(null);
  const [showFront, setShowFront] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [activeTab, setActiveTab] = useState('History');
  const [notes, setNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  const load = () => {
    const c = getCoinById(id);
    if (c) { setCoin(c); setNotes(c.personalNotes || ''); }
  };

  useEffect(() => { load(); }, [id]);

  // Auto-enrich if needed
  useEffect(() => {
    if (coin && !coin.enrichment && hasApiKey()) {
      const settings = JSON.parse(localStorage.getItem('coinvault_settings') || '{}');
      if (settings.aiAutoEnrich !== false) {
        setEnrichLoading(true);
        enrichCoin({ country: coin.country, denomination: coin.denomination, year: coin.year, mintMark: coin.mintMark, series: coin.coinSeries, composition: coin.composition })
          .then(result => {
            const updated = updateCoin(coin.id, { enrichment: result, enrichedAt: new Date().toISOString() });
            setCoin(updated);
          })
          .catch(() => {})
          .finally(() => setEnrichLoading(false));
      }
    }
  }, [coin?.id]);

  const flip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => { setShowFront(f => !f); setIsFlipping(false); }, 300);
  };

  const handleDelete = () => {
    deleteCoin(id);
    navigate(-1);
  };

  const handleNotesBlur = () => {
    updateCoin(id, { personalNotes: notes });
  };

  if (!coin) return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-center">
      <p className="text-[#f5f0e8]/40">Coin not found.</p>
    </div>
  );

  const coinName = [coin.year, coin.mintMark !== 'None' ? coin.mintMark : '', coin.denomination, coin.country?.replace(/^\S+\s/, '')].filter(Boolean).join(' ');

  const currentImage = showFront ? coin.obverseImage : coin.reverseImage;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[#f5f0e8]/40 hover:text-[#f5f0e8]/70 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Top layout */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Left: Coin image */}
        <div className="lg:w-[40%] flex flex-col items-center gap-4">
          {/* Coin flip */}
          <div className="relative" style={{ perspective: '800px' }}>
            <div
              className="w-64 h-64 rounded-full cursor-pointer transition-all"
              style={{
                border: '3px solid rgba(201,168,76,0.6)',
                boxShadow: '0 0 0 6px rgba(201,168,76,0.08), 0 12px 40px rgba(0,0,0,0.6)',
                transform: isFlipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
                transition: 'transform 0.3s ease',
                background: 'rgba(255,255,255,0.03)',
                overflow: 'hidden',
              }}
              onClick={flip}
            >
              {currentImage ? (
                <img src={currentImage} alt={showFront ? 'Obverse' : 'Reverse'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 rounded-full border-2 border-[#c9a84c]/30 flex items-center justify-center">
                    <Circle className="w-8 h-8 text-[#c9a84c]/20" />
                  </div>
                  <p className="text-xs text-[#f5f0e8]/30">No image</p>
                </div>
              )}
              {currentImage && (
                <button
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setLightboxImg(currentImage); }}>
                  <ZoomIn className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Toggle label */}
          <div className="flex items-center gap-3">
            {[['Obverse', true], ['Reverse', false]].map(([label, front]) => (
              <button key={label} onClick={() => { if (showFront !== front) flip(); }}
                className={`text-xs px-3 py-1 rounded-full transition-all ${showFront === front ? 'bg-[#c9a84c]/20 text-[#e8c97a] border border-[#c9a84c]/40' : 'text-[#f5f0e8]/40 hover:text-[#f5f0e8]/60'}`}>
                {label}
              </button>
            ))}
            <button onClick={flip} className="text-[#f5f0e8]/30 hover:text-[#f5f0e8]/60 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grade badge */}
          {coin.userGrade && (
            <div className="text-center">
              <div className="inline-block px-6 py-2 rounded-xl bg-gradient-to-br from-[#c9a84c]/20 to-[#c9a84c]/5 border border-[#c9a84c]/40">
                <p className="text-2xl font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{coin.userGrade}</p>
                <p className="text-xs text-[#f5f0e8]/40 mt-0.5">
                  {coin.userGrade?.startsWith('MS') ? 'Mint State' : coin.userGrade?.startsWith('PF') ? 'Proof' : 'Circulated'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="lg:w-[60%]">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-[#f5f0e8] leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {coinName || 'Unknown Coin'}
            </h1>
            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {coin.country && <Chip color="default">{coin.country}</Chip>}
            {coin.denomination && <Chip color="gold">{coin.denomination}</Chip>}
            {coin.year && !coin.yearUnknown && <Chip>{coin.year}</Chip>}
            {coin.mintMark && coin.mintMark !== 'None' && <Chip>{coin.mintMark} Mint</Chip>}
          </div>

          {/* Spec bar */}
          {(coin.composition || coin.weight || coin.diameter) && (
            <div className="flex gap-4 p-3 rounded-xl bg-white/[0.03] border border-[#c9a84c]/10 mb-4 text-xs text-[#f5f0e8]/60 flex-wrap">
              {coin.composition && <span>Metal: <strong className="text-[#f5f0e8]/80">{coin.composition}</strong></span>}
              {coin.weight && <span>Weight: <strong className="text-[#f5f0e8]/80">{coin.weight}g</strong></span>}
              {coin.diameter && <span>Diameter: <strong className="text-[#f5f0e8]/80">{coin.diameter}mm</strong></span>}
              {coin.coinSeries && <span>Series: <strong className="text-[#f5f0e8]/80">{coin.coinSeries}</strong></span>}
            </div>
          )}

          {/* Purchase info */}
          {(coin.purchasePrice || coin.purchaseDate || coin.whereAcquired) && (
            <div className="flex gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4 text-xs text-[#f5f0e8]/50 flex-wrap">
              {coin.purchasePrice && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${coin.purchasePrice}</span>}
              {coin.purchaseDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {coin.purchaseDate}</span>}
              {coin.whereAcquired && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {coin.whereAcquired}</span>}
            </div>
          )}

          {/* Tags */}
          {coin.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Tag className="w-3.5 h-3.5 text-[#f5f0e8]/30 self-center" />
              {coin.tags.map(tag => (
                <span key={tag} className="text-xs bg-[#c9a84c]/10 text-[#c9a84c]/80 border border-[#c9a84c]/20 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {/* Storage */}
          {coin.storageLocation && (
            <div className="text-xs text-[#f5f0e8]/40 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Storage: {coin.storageLocation}
            </div>
          )}
        </div>
      </div>

      {/* Tabbed panel */}
      <div className="rounded-2xl border border-[#c9a84c]/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex border-b border-[#c9a84c]/15 overflow-x-auto">
          {detailTabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${activeTab === tab ? 'border-[#c9a84c] text-[#e8c97a]' : 'border-transparent text-[#f5f0e8]/40 hover:text-[#f5f0e8]/70'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {(activeTab === 'History' || activeTab === 'Mintage' || activeTab === 'Varieties') && (
            <CoinIntelligence coin={coin} onUpdate={updated => setCoin(updated)} defaultTab={activeTab.toLowerCase()} />
          )}

          {activeTab === 'Market Value' && (
            <MarketValue coin={coin} onUpdate={updated => setCoin(updated)} />
          )}

          {activeTab === 'Notes' && (
            <div className="space-y-5">
              {coin.conditionNotes && (
                <div>
                  <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Condition Notes</h4>
                  <p className="text-sm text-[#f5f0e8]/70 bg-white/[0.03] rounded-xl p-3 border border-white/5">{coin.conditionNotes}</p>
                </div>
              )}
              <div>
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Personal Notes</h4>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  rows={6}
                  placeholder="Write your personal notes about this coin..."
                  className="w-full bg-white/[0.03] border border-[#c9a84c]/20 rounded-xl px-4 py-3 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/50 resize-none"
                />
                <p className="text-xs text-[#f5f0e8]/30 mt-1">Auto-saved on blur</p>
              </div>
              {coin.storageLocation && (
                <div>
                  <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Storage Location</h4>
                  <p className="text-sm text-[#f5f0e8]/70 bg-white/[0.03] rounded-xl p-3 border border-white/5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#c9a84c]/50" /> {coin.storageLocation}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Grading Report' && (
            <div>
              {coin.aiGrade ? (
                <AIGradingCard grading={coin.aiGrade} userGrade={coin.userGrade} onAccept={g => {
                  const updated = updateCoin(id, { userGrade: g });
                  setCoin(updated);
                }} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#f5f0e8]/40 text-sm">No AI grading report available for this coin.</p>
                  <p className="text-[#f5f0e8]/30 text-xs mt-1">Upload coin images and enable AI grading when adding a coin.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 p-6 text-center" style={{ background: '#0d1220' }}>
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#f5f0e8] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Delete Coin?</h3>
            <p className="text-sm text-[#f5f0e8]/50 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-[#f5f0e8]/60 hover:text-[#f5f0e8] text-sm">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Coin" className="max-w-full max-h-full rounded-full" style={{ border: '3px solid rgba(201,168,76,0.6)' }} />
        </div>
      )}
    </div>
  );
}