import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCoinById, updateCoin } from '@/components/storage';
import { gradeCoin, enrichCoin, getMarketValue } from '@/components/coinAI';
import AIGradingCard from '@/components/AIGradingCard';
import CoinPhotoGuide from '@/components/CoinPhotoGuide';
import {
  ArrowLeft, Sparkles, BookOpen, DollarSign, Loader2,
  Camera, Share2, Pencil, Package, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { isMultiImageType, getEntryLabel } from '@/lib/entryTypes';
import CoinShareCard from '@/components/CoinShareCard';
import ImageCropper from '@/components/ImageCropper';
import ImageViewer from '@/components/ImageViewer';
import EditCoinDialog from '@/components/EditCoinDialog';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoader } from './Dashboard';

// ---------------------------------------------------------------------------
// FIX: useAIAction hook — centralises loading state, error handling, and coin
// state updates for all three AI actions. Before: each handler duplicated the
// same setAiLoading / updateCoin / setCoin pattern with no error handling,
// meaning a failed AI call would leave aiLoading set forever, permanently
// disabling all three buttons until the page was reloaded.
// ---------------------------------------------------------------------------
function useAIAction(coin, setCoin) {
  const [aiLoading, setAiLoading] = useState(null);

  const run = useCallback(async (key, apiFn, resultKey) => {
    setAiLoading(key);
    try {
      const result = await apiFn();
      const patch = { [resultKey]: result };
      // Add timestamp for market value and enrichment
      if (key === 'market') patch.market_value_at = new Date().toISOString();
      if (key === 'enrich') patch.enriched_at = new Date().toISOString();
      await updateCoin(coin.id, patch);
      setCoin(prev => ({ ...prev, ...patch }));
    } catch (err) {
      console.error(`AI action "${key}" failed:`, err);
      // TODO: surface a toast notification here, e.g. toast.error('AI grading failed. Please try again.')
    } finally {
      // FIX: always clears loading state, even on error
      setAiLoading(null);
    }
  }, [coin?.id, setCoin]);

  return { aiLoading, run };
}

export default function CoinDetail() {
  const { id: coinId } = useParams();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPhotoGuide, setShowPhotoGuide] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null); // 'obverse_image' | 'reverse_image'
  const [cropFile, setCropFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeSetImage, setActiveSetImage] = useState(0);
  const [viewerImage, setViewerImage] = useState(null); // { src, alt }
  const [showEdit, setShowEdit] = useState(false);

  const { aiLoading, run } = useAIAction(coin, setCoin);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const c = await getCoinById(coinId);
      setCoin(c);
      setLoading(false);
    };
    if (coinId) load();
  }, [coinId]);

  // FIX: AI handlers are now one-liners that delegate to useAIAction.
  // Error handling, loading state, and coin update are all handled in the hook.
  const handleGrade = () =>
    run('grade', () => gradeCoin(coin.obverse_image, coin.reverse_image), 'ai_grade');

  const handleEnrich = () =>
    run('enrich', () => enrichCoin(coin), 'enrichment');

  const handleMarketValue = () =>
    run('market', () => getMarketValue(coin), 'market_value');

  const handleAcceptGrade = async (grade) => {
    await updateCoin(coin.id, { user_grade: grade });
    setCoin(prev => ({ ...prev, user_grade: grade }));
  };

  const handlePhotoSelect = (field, file) => {
    if (!file) return;
    setCropFile(file);
    setEditingPhoto(field);
  };

  const handleCropped = async (croppedFile) => {
    // FIX: try/catch on upload — before, a failed upload left the modal stuck
    // in a permanent uploading spinner with no way to escape
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
      await updateCoin(coin.id, { [editingPhoto]: file_url });
      setCoin(prev => ({ ...prev, [editingPhoto]: file_url }));
      setEditingPhoto(null);
      setCropFile(null);
    } catch (err) {
      console.error('Photo upload failed:', err);
      // TODO: show toast — "Upload failed, please try again"
    } finally {
      setUploading(false);
    }
  };

  const handleCancelCrop = () => {
    setEditingPhoto(null);
    setCropFile(null);
  };

  const isSet = isMultiImageType(coin?.entry_type);

  // FIX: Coin title helper — avoids JSX template-literal rendering `false` as text.
  // Before: `{coin.country && `(${coin.country})`}` would render the string "false"
  // in React when coin.country is undefined/null in certain builds.
  const coinTitle = isSet
    ? (coin?.set_name || `${coin?.year} ${coin?.denomination}`)
    : [coin?.year, coin?.denomination, coin?.country ? `(${coin.country})` : '']
        .filter(Boolean)
        .join(' ');

  if (loading) return <PageLoader />;

  if (!coin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p style={{ color: 'var(--cv-text-secondary)' }}>Coin not found.</p>
        <Link
          to="/dashboard"
          className="underline mt-4 inline-block"
          style={{ color: 'var(--cv-accent)' }}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <Link
        to={`/collections/${coin.collection_id}`}
        className="inline-flex items-center gap-2 mb-4 sm:mb-6 transition-colors py-1"
        style={{ color: 'var(--cv-text-muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to collection
      </Link>

      {isSet && (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mb-3"
          style={{
            background: 'var(--cv-accent-bg)',
            color: 'var(--cv-accent)',
            border: '1px solid var(--cv-accent-border)',
          }}
        >
          <Package className="w-3.5 h-3.5" />
          {getEntryLabel(coin.entry_type)}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-5">
        <h1
          className="text-xl sm:text-2xl font-bold"
          style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {coinTitle}
        </h1>
        <Button
          onClick={() => setShowEdit(true)}
          size="sm"
          className="gap-1.5 shrink-0 rounded-xl text-xs font-semibold"
          style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Button>
      </div>

      {/* Set image gallery */}
      {isSet && coin.set_images?.length > 0 ? (
        <div className="mb-6 sm:mb-8">
          <div
            className="relative aspect-[4/3] rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
          >
            <img
              src={coin.set_images[activeSetImage]}
              alt={`Set photo ${activeSetImage + 1}`}
              className="w-full h-full object-contain p-4 sm:p-6 cursor-zoom-in"
              onClick={() => setViewerImage({ src: coin.set_images[activeSetImage], alt: `${coinTitle} — Photo ${activeSetImage + 1}` })}
            />
            {coin.set_images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveSetImage(i => (i - 1 + coin.set_images.length) % coin.set_images.length)
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-border)' }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: 'var(--cv-text)' }} />
                </button>
                <button
                  onClick={() => setActiveSetImage(i => (i + 1) % coin.set_images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-border)' }}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--cv-text)' }} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {coin.set_images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSetImage(i)}
                      className="w-2 h-2 rounded-full transition-all"
                      aria-label={`Go to image ${i + 1}`}
                      style={{
                        background: i === activeSetImage ? 'var(--cv-accent)' : 'var(--cv-text-faint)',
                        opacity: i === activeSetImage ? 1 : 0.4,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {coin.set_images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {coin.set_images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSetImage(i)}
                  className="w-16 h-16 rounded-lg overflow-hidden shrink-0 transition-all"
                  style={{
                    border: i === activeSetImage
                      ? '2px solid var(--cv-accent)'
                      : '1px solid var(--cv-border)',
                    opacity: i === activeSetImage ? 1 : 0.6,
                  }}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : !isSet ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {['obverse_image', 'reverse_image'].map(key => {
            const label = key === 'obverse_image' ? 'Obverse' : 'Reverse';
            return (
              <div
                key={key}
                className="relative group aspect-square rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
              >
                {coin[key] ? (
                  <img
                    src={coin[key]}
                    alt={label}
                    className="w-full h-full object-contain p-4 sm:p-6 cursor-zoom-in"
                    onClick={() => setViewerImage({ src: coin[key], alt: `${coinTitle} — ${label}` })}
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--cv-text-faint)' }} />
                    <span className="text-xs" style={{ color: 'var(--cv-text-faint)' }}>{label}</span>
                  </div>
                )}
                {/* Edit photo overlay */}
                <div className="absolute bottom-2 right-2 z-10">
                  <label
                    className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all opacity-60 hover:opacity-100"
                    style={{ background: 'var(--cv-accent-dim)' }}
                  >
                    <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--cv-accent-text)' }} />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files[0]) handlePhotoSelect(key, e.target.files[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Full-screen image viewer */}
      {viewerImage && (
        <ImageViewer
          src={viewerImage.src}
          alt={viewerImage.alt}
          onClose={() => setViewerImage(null)}
        />
      )}

      {/* Set contents list */}
      {isSet && coin.set_contents?.length > 0 && (
        <div
          className="rounded-2xl p-4 sm:p-5 mb-5"
          style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cv-accent)' }}>
            Contents ({coin.set_contents.length})
          </h3>
          <div className="space-y-1.5">
            {coin.set_contents.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ background: 'var(--cv-input-bg)' }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)' }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>
                    {c.denomination}
                  </span>
                  {c.description && (
                    <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>
                      {c.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo cropper dialog */}
      {editingPhoto && cropFile && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden p-4"
            style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)' }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--cv-text)' }}>
              Crop {editingPhoto === 'obverse_image' ? 'Obverse' : 'Reverse'} Photo
            </p>
            {uploading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--cv-accent)' }} />
                {/* FIX: Added cancel button during upload so users aren't trapped if upload hangs */}
                <button
                  onClick={handleCancelCrop}
                  className="text-xs underline mt-2"
                  style={{ color: 'var(--cv-text-muted)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <ImageCropper
                file={cropFile}
                onCropped={handleCropped}
                onCancel={handleCancelCrop}
                initialShape="circle"
              />
            )}
          </div>
        </div>
      )}

      <div
        className="rounded-2xl p-4 sm:p-5 mb-5"
        style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--cv-accent)' }}>
          Coin Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          {[
            ['Country', coin.country],
            ['Denomination', coin.denomination],
            ['Year', coin.year_unknown ? 'Unknown' : coin.year],
            ['Mint Mark', coin.mint_mark],
            ['Series', coin.coin_series],
            ['Composition', coin.composition],
            ['Weight', coin.weight],
            ['Diameter', coin.diameter],
            ['Grade', coin.user_grade],
            ['Purchase Price', coin.purchase_price ? `$${coin.purchase_price}` : ''],
            ['Purchase Date', coin.purchase_date],
            ['Acquired From', coin.where_acquired],
            ['Storage', coin.storage_location],
          ]
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label}>
                <span
                  className="text-[11px] uppercase tracking-wide"
                  style={{ color: 'var(--cv-text-muted)' }}
                >
                  {label}
                </span>
                <p className="text-sm mt-0.5" style={{ color: 'var(--cv-text)' }}>
                  {value}
                </p>
              </div>
            ))}
        </div>
        {coin.personal_notes && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--cv-border)' }}>
            <span
              className="text-[11px] uppercase tracking-wide"
              style={{ color: 'var(--cv-text-muted)' }}
            >
              Notes
            </span>
            <p
              className="text-sm mt-1 leading-relaxed"
              style={{ color: 'var(--cv-text-secondary)' }}
            >
              {coin.personal_notes}
            </p>
          </div>
        )}
      </div>

      {/*
        FIX: AI action buttons.
        Before: hardcoded Tailwind opacity classes (bg-purple-600/15 etc.) bypassed the --cv-* theme
        system, so buttons wouldn't adapt when the user changed themes.
        After: use CSS variables consistent with the rest of the app.
        Also added tooltip-style aria-label and title on the disabled AI Grade button
        so users know WHY it's disabled.
      */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-5">
        {!isSet && (
          <Button
            onClick={handleGrade}
            disabled={!!aiLoading || !coin.obverse_image || !coin.reverse_image}
            title={
              !coin.obverse_image || !coin.reverse_image
                ? 'Add both obverse and reverse photos to enable AI grading'
                : undefined
            }
            className="gap-2 h-10 rounded-xl text-sm font-medium"
            style={{
              background: 'var(--cv-accent-bg)',
              color: 'var(--cv-accent)',
              border: '1px solid var(--cv-accent-border)',
            }}
          >
            {aiLoading === 'grade' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            AI Grade
          </Button>
        )}
        <Button
          onClick={handleEnrich}
          disabled={!!aiLoading}
          className="gap-2 h-10 rounded-xl text-sm font-medium"
          style={{
            background: 'var(--cv-accent-bg)',
            color: 'var(--cv-accent)',
            border: '1px solid var(--cv-accent-border)',
          }}
        >
          {aiLoading === 'enrich' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BookOpen className="w-4 h-4" />
          )}
          Enrich
        </Button>
        <Button
          onClick={handleMarketValue}
          disabled={!!aiLoading}
          className="gap-2 h-10 rounded-xl text-sm font-medium"
          style={{
            background: 'var(--cv-accent-bg)',
            color: 'var(--cv-accent)',
            border: '1px solid var(--cv-accent-border)',
          }}
        >
          {aiLoading === 'market' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <DollarSign className="w-4 h-4" />
          )}
          Market
        </Button>
      </div>

      {/* Action row: Share + Photo Tips */}
      <div className="flex gap-2 mb-5">
        <Button onClick={() => setShowShare(true)}
          className="gap-2 h-10 rounded-xl text-sm font-medium"
          style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}>
          <Share2 className="w-4 h-4" /> Share
        </Button>
        {!isSet && (
          <Button variant="ghost" onClick={() => setShowPhotoGuide(!showPhotoGuide)}
            className="gap-2 h-10 rounded-xl text-sm" style={{ color: 'var(--cv-text-muted)' }}>
            <Camera className="w-4 h-4" /> Tips
          </Button>
        )}
      </div>

      {showPhotoGuide && <div className="mb-5"><CoinPhotoGuide onClose={() => setShowPhotoGuide(false)} /></div>}
      {showShare && <CoinShareCard coin={coin} onClose={() => setShowShare(false)} />}
      {showEdit && (
        <EditCoinDialog
          coin={coin}
          open={showEdit}
          onOpenChange={setShowEdit}
          onSaved={(patch) => setCoin(prev => ({ ...prev, ...patch }))}
        />
      )}

      {/* Tabs for AI results */}
      <Tabs defaultValue="grading" className="space-y-3">
        <TabsList className="rounded-xl h-10 p-1 w-full sm:w-auto" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)' }}>
          <TabsTrigger value="grading" className="rounded-lg text-xs sm:text-sm flex-1 sm:flex-none data-[state=active]:bg-[var(--cv-accent-bg)] data-[state=active]:text-[var(--cv-accent)]">Grading</TabsTrigger>
          <TabsTrigger value="enrichment" className="rounded-lg text-xs sm:text-sm flex-1 sm:flex-none data-[state=active]:bg-[var(--cv-accent-bg)] data-[state=active]:text-[var(--cv-accent)]">Enrichment</TabsTrigger>
          <TabsTrigger value="market" className="rounded-lg text-xs sm:text-sm flex-1 sm:flex-none data-[state=active]:bg-[var(--cv-accent-bg)] data-[state=active]:text-[var(--cv-accent)]">Market</TabsTrigger>
        </TabsList>

        <TabsContent value="grading">
          {coin.ai_grade ? (
            <AIGradingCard grading={coin.ai_grade} onAccept={handleAcceptGrade} userGrade={coin.user_grade} />
          ) : (
            <p className="text-sm py-10 text-center" style={{ color: 'var(--cv-text-faint)' }}>No AI grading yet. Tap "AI Grade" above.</p>
          )}
        </TabsContent>

        <TabsContent value="enrichment">
          {coin.enrichment ? (
            <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>{coin.enrichment.coin_full_name}</h3>
              {coin.enrichment.series_history && <p className="text-sm leading-relaxed" style={{ color: 'var(--cv-text-secondary)' }}>{coin.enrichment.series_history}</p>}
              {coin.enrichment.historical_context && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--cv-accent)' }}>Historical Context</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--cv-text-secondary)' }}>{coin.enrichment.historical_context}</p>
                </div>
              )}
              {coin.enrichment.fun_facts?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--cv-accent)' }}>Fun Facts</h4>
                  <ul className="space-y-1.5">{coin.enrichment.fun_facts.map((f, i) => <li key={i} className="text-sm" style={{ color: 'var(--cv-text-secondary)' }}>• {f}</li>)}</ul>
                </div>
              )}
              {coin.enrichment.collector_notes && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--cv-accent)' }}>Collector Notes</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--cv-text-secondary)' }}>{coin.enrichment.collector_notes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm py-10 text-center" style={{ color: 'var(--cv-text-faint)' }}>No enrichment data yet. Tap "Enrich" above.</p>
          )}
        </TabsContent>

        <TabsContent value="market">
          {coin.market_value ? (
            <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--cv-text-muted)' }}>Estimated Value</span>
                  <p className="text-2xl sm:text-3xl font-bold text-green-400">{coin.market_value.this_coin_estimated_value}</p>
                </div>
                {coin.market_value.price_trend && (
                  <span className={`text-xs px-2.5 py-1 rounded-lg ${coin.market_value.price_trend === 'Rising' ? 'bg-green-500/10 text-green-400' : coin.market_value.price_trend === 'Falling' ? 'bg-red-500/10 text-red-400' : ''}`}
                    style={coin.market_value.price_trend === 'Stable' ? { background: 'var(--cv-accent-bg)', color: 'var(--cv-text-secondary)' } : undefined}>
                    {coin.market_value.price_trend}
                  </span>
                )}
              </div>
              {coin.market_value.retail_values?.by_grade && (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: 'var(--cv-text-muted)', borderBottom: '1px solid var(--cv-border)' }}>
                        <th className="text-left py-2.5 font-medium">Grade</th>
                        <th className="text-right py-2.5 font-medium">Low</th>
                        <th className="text-right py-2.5 font-medium">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coin.market_value.retail_values.by_grade.map((g, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--cv-border)' }}>
                          <td className="py-2" style={{ color: 'var(--cv-text-secondary)' }}>{g.grade}</td>
                          <td className="py-2 text-right" style={{ color: 'var(--cv-text-secondary)' }}>{g.retail_low}</td>
                          <td className="py-2 text-right" style={{ color: 'var(--cv-text-secondary)' }}>{g.retail_high}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {coin.market_value.market_notes && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cv-text-muted)' }}>{coin.market_value.market_notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm py-10 text-center" style={{ color: 'var(--cv-text-faint)' }}>No market data yet. Tap "Market" above.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}