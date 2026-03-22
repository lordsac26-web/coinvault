import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCoinsByCollection, createCoin, deleteCoin, getCoins } from '@/components/storage';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ArrowLeft, Coins, FileDown, Loader2, ImageIcon, Package } from 'lucide-react';
import CoinFilterBar from '@/components/CoinFilterBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ImageCropper from '@/components/ImageCropper';
import CollectionTags from '@/components/CollectionTags';
import AddSetDialog from '@/components/AddSetDialog';
import CoinIdentifier from '@/components/CoinIdentifier';
import EditCollectionName from '@/components/EditCollectionName';
import { isMultiImageType, getEntryLabel } from '@/lib/entryTypes';
import { PageLoader } from './Dashboard'; // FIX: shared loader
 
// FIX: Reusable URL download helper with guaranteed cleanup.
// Before: URL.createObjectURL / revokeObjectURL was called inline in two
// separate handlers (PDF export and CSV/JSON in Settings). If the click failed,
// revokeObjectURL never ran, leaking the object URL.
// After: setTimeout ensures revoke always fires ~100ms after the click,
// regardless of whether the download succeeded.
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
 
function FilePreviewSlot({ side, file, onSelect }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <label
      className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all"
      style={{
        border: `1px dashed ${file ? 'var(--cv-accent)' : 'var(--cv-border)'}`,
        background: file ? 'var(--cv-accent-bg)' : 'var(--cv-input-bg)',
      }}
    >
      {preview ? (
        <>
          <img src={preview} alt={side} className="w-12 h-12 rounded-full object-cover" />
          <span className="text-[11px]" style={{ color: 'var(--cv-accent)' }}>
            {side === 'obverse' ? 'Obverse ✓' : 'Reverse ✓'}
          </span>
        </>
      ) : (
        <>
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--cv-bg-card)' }}>
            <Package className="w-4 h-4" style={{ color: 'var(--cv-text-faint)' }} />
          </div>
          <span className="text-[11px] capitalize" style={{ color: 'var(--cv-text-muted)' }}>
            {side} photo
          </span>
        </>
      )}
      <input type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files[0]) onSelect(e.target.files[0]); e.target.value = ''; }} />
    </label>
  );
}

export default function CollectionView() {
  const { id: collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
 
  // FIX: Separate customDenomination state — before, selecting "Custom..." and
  // typing overwrote newCoin.denomination directly, meaning the Select would
  // show the typed string instead of "Custom..." and submitting with a half-typed
  // value was possible. Now denomination stays "__custom" while the user types,
  // and we resolve it to the custom value only on submit.
  const [newCoin, setNewCoin] = useState({
    country: '', denomination: '', year: '', mint_mark: 'None',
    composition: '', user_grade: '', purchase_price: '',
  });
  const [customDenomination, setCustomDenomination] = useState('');
 
  const [obverseFile, setObverseFile] = useState(null);
  const [reverseFile, setReverseFile] = useState(null);
  const [croppingField, setCroppingField] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportWithImages, setExportWithImages] = useState(true);
  const [allCoins, setAllCoins] = useState([]); // all user coins for pre-populating dropdowns
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const load = async () => {
    setLoading(true);
    const [collections, coinList, all] = await Promise.all([
      base44.entities.Collection.filter({ id: collectionId }),
      getCoinsByCollection(collectionId),
      getCoins(),
    ]);
    setCollection(collections[0] || null);
    setCoins(coinList);
    setAllCoins(all);
    setLoading(false);
  };

  // Pre-populated dropdown options derived from all existing coins
  const existingCountries = useMemo(
    () => [...new Set(allCoins.map(c => c.country).filter(Boolean))].sort(),
    [allCoins]
  );
  const existingCompositions = useMemo(
    () => [...new Set(allCoins.map(c => c.composition).filter(Boolean))].sort(),
    [allCoins]
  );
  const existingGrades = useMemo(
    () => [...new Set(allCoins.map(c => c.user_grade).filter(Boolean))].sort(),
    [allCoins]
  );
 
  useEffect(() => { if (collectionId) load(); }, [collectionId]);

  const handleFiltered = useCallback((result, meta) => {
    setFilteredCoins(result);
    setHasActiveFilters(meta.search || meta.activeFilterCount > 0);
  }, []);
 
  const uploadFile = async (file) => {
    if (!file) return null;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };
 
  const handleFileSelect = (field, file) => {
    if (!file) return;
    setCropFile(file);
    setCroppingField(field);
  };
 
  const handleCropped = (croppedFile) => {
    if (croppingField === 'obverse') setObverseFile(croppedFile);
    else setReverseFile(croppedFile);
    setCroppingField(null);
    setCropFile(null);
  };
 
  const handleCancelCrop = () => {
    setCroppingField(null);
    setCropFile(null);
  };
 
  const handleAddCoin = async () => {
    // FIX: Form validation — prevent submitting with no denomination or year.
    // Before: handleAddCoin ran unconditionally, creating blank coin records.
    const resolvedDenomination =
      newCoin.denomination === '__custom' ? customDenomination.trim() : newCoin.denomination;

    if (!resolvedDenomination || !newCoin.year.trim()) return;
 
    // FIX: try/catch on add — prevents silent failure and upload-state getting stuck
    setUploading(true);
    try {
      const [obverseUrl, reverseUrl] = await Promise.all([
        uploadFile(obverseFile),
        uploadFile(reverseFile),
      ]);
      await createCoin({
        collection_id: collectionId,
        ...newCoin,
        denomination: resolvedDenomination,
        obverse_image: obverseUrl,
        reverse_image: reverseUrl,
      });
      // Reset form
      setNewCoin({
        country: '', denomination: '', year: '', mint_mark: 'None',
        composition: '', user_grade: '', purchase_price: '',
      });
      setCustomDenomination('');
      setObverseFile(null);
      setReverseFile(null);
      setShowAdd(false);
      load();
    } catch (err) {
      console.error('Failed to add coin:', err);
      // TODO: show toast — "Failed to add coin, please try again"
    } finally {
      setUploading(false);
    }
  };
 
  const handleDeleteCoin = async (id) => {
    // FIX: try/catch on delete
    try {
      await deleteCoin(id);
      // FIX: Optimistic update — remove from local state immediately
      setCoins(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete coin:', err);
      load(); // Re-sync on failure
    }
  };
 
  const handleExportPdf = async () => {
    // FIX: try/catch on PDF export — before, a failed serverless function call
    // would leave exporting=true and the button permanently disabled/spinning
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportCollectionPdf', {
        collectionId,
        includeThumbnails: exportWithImages,
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      // FIX: Use shared triggerDownload helper — guarantees URL cleanup
      triggerDownload(blob, `${collection?.name || 'collection'}_report.pdf`);
      setShowExport(false);
    } catch (err) {
      console.error('PDF export failed:', err);
      // TODO: show toast — "PDF generation failed. Please try again."
    } finally {
      setExporting(false);
    }
  };
 
  if (loading) return <PageLoader />;
 
  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p style={{ color: 'var(--cv-text-secondary)' }}>Collection not found.</p>
        <Link to="/dashboard" className="underline mt-4 inline-block" style={{ color: 'var(--cv-accent)' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }
 
  // FIX: Derived submit button enabled state — requires denomination and year
  const canSubmit =
    (newCoin.denomination !== '' && newCoin.denomination !== '__custom'
      ? newCoin.denomination
      : customDenomination.trim()) && newCoin.year.trim();
 
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <Link to="/dashboard" className="p-2 -ml-2 transition-colors" style={{ color: 'var(--cv-text-muted)' }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className="text-xl sm:text-2xl font-bold truncate"
              style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {collection.name}
            </h1>
            <EditCollectionName collection={collection} onUpdated={load} />
          </div>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--cv-text-muted)' }}>
            {coins.length} coin{coins.length !== 1 ? 's' : ''} · {collection.type}
          </p>
        </div>
 
        <div className="flex items-center gap-2 shrink-0">
          {/* PDF Export */}
          <Dialog open={showExport} onOpenChange={setShowExport}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5 h-9 px-3 rounded-xl font-semibold"
                style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}
                disabled={coins.length === 0}
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              className="mx-4 sm:mx-auto rounded-2xl"
              style={{
                background: 'var(--cv-bg-elevated)',
                border: '1px solid var(--cv-accent-border)',
                color: 'var(--cv-text)',
              }}
            >
              <DialogHeader>
                <DialogTitle
                  style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Export PDF Report
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm" style={{ color: 'var(--cv-text-secondary)' }}>
                  Generate a PDF report of{' '}
                  <strong style={{ color: 'var(--cv-text)' }}>{collection?.name}</strong> with{' '}
                  {coins.length} coin{coins.length !== 1 ? 's' : ''}.
                </p>
                <button
                  onClick={() => setExportWithImages(!exportWithImages)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{
                    border: `1px solid ${exportWithImages ? 'var(--cv-accent-border)' : 'var(--cv-border)'}`,
                    background: exportWithImages ? 'var(--cv-accent-bg)' : 'var(--cv-bg-card)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: exportWithImages ? 'var(--cv-accent-bg)' : 'var(--cv-input-bg)' }}
                  >
                    <ImageIcon
                      className="w-4 h-4"
                      style={{ color: exportWithImages ? 'var(--cv-accent)' : 'var(--cv-text-faint)' }}
                    />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>
                      Include coin thumbnails
                    </p>
                    <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>
                      Adds obverse images next to each coin row
                    </p>
                  </div>
                  <div
                    className="w-10 h-6 rounded-full p-0.5 transition-colors"
                    style={{ background: exportWithImages ? 'var(--cv-accent-dim)' : 'var(--cv-input-bg)' }}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${exportWithImages ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </div>
                </button>
                <Button
                  onClick={handleExportPdf}
                  disabled={exporting}
                  className="w-full h-11 rounded-xl font-semibold gap-2"
                  style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)', border: 'none' }}
                >
                  {exporting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><FileDown className="w-4 h-4" /> Download PDF</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
 
          <CoinIdentifier collectionId={collectionId} onAdded={load} />

          <AddSetDialog collectionId={collectionId} onAdded={load} />
 
          {/* Add Coin */}
          <Dialog
            open={showAdd}
            onOpenChange={v => {
              setShowAdd(v);
              if (!v) { setCroppingField(null); setCropFile(null); }
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5 h-9 px-3 sm:px-4 rounded-xl font-semibold"
                style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Coin</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl"
              style={{
                background: 'var(--cv-bg-elevated)',
                border: '1px solid var(--cv-accent-border)',
                color: 'var(--cv-text)',
              }}
            >
              <DialogHeader>
                <DialogTitle
                  style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Add Coin
                </DialogTitle>
              </DialogHeader>
 
              {croppingField && cropFile ? (
                <ImageCropper
                  file={cropFile}
                  onCropped={handleCropped}
                  onCancel={handleCancelCrop}
                  initialShape="circle"
                />
              ) : (
                <div className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Country — with autocomplete suggestions from existing coins */}
                    <Input placeholder="Country" value={newCoin.country} list="countries-list"
                      onChange={e => setNewCoin({ ...newCoin, country: e.target.value })}
                      className="h-11 rounded-xl"
                      style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                    <datalist id="countries-list">
                      {existingCountries.map(c => <option key={c} value={c} />)}
                    </datalist>
                    <Select
                      value={newCoin.denomination}
                      onValueChange={v => setNewCoin({ ...newCoin, denomination: v })}
                    >
                      <SelectTrigger
                        className="h-11 rounded-xl"
                        style={{
                          background: 'var(--cv-input-bg)',
                          border: '1px solid var(--cv-accent-border)',
                          color: 'var(--cv-text)',
                        }}
                      >
                        <SelectValue placeholder="Denomination" />
                      </SelectTrigger>
                      <SelectContent
                        className="max-h-60"
                        style={{
                          background: 'var(--cv-bg-elevated)',
                          border: '1px solid var(--cv-accent-border)',
                        }}
                      >
                        {[
                          '1 Cent (Penny)','5 Cents (Nickel)','10 Cents (Dime)',
                          '25 Cents (Quarter)','50 Cents (Half Dollar)','1 Dollar',
                          '1 Dollar (Silver)','1 Dollar (Gold)','$2.50 (Quarter Eagle)',
                          '$5 (Half Eagle)','$10 (Eagle)','$20 (Double Eagle)',
                          '1 Penny','2 Pence','5 Pence','10 Pence','20 Pence','50 Pence',
                          '1 Pound','2 Pounds','1 Euro Cent','2 Euro Cent','5 Euro Cent',
                          '10 Euro Cent','20 Euro Cent','50 Euro Cent','1 Euro','2 Euro',
                          '1 Yen','5 Yen','10 Yen','50 Yen','100 Yen','500 Yen',
                          '1 Franc','2 Franc','5 Franc','1 Mark','2 Mark','5 Mark',
                          '1 Real','5 Centavos','10 Centavos','25 Centavos','50 Centavos',
                          '1 Rupee','2 Rupees','5 Rupees','10 Rupees','1 Yuan','5 Jiao',
                          '1 Peso','5 Pesos','10 Pesos',
                        ].map(d => (
                          <SelectItem key={d} value={d} style={{ color: 'var(--cv-text)' }}>{d}</SelectItem>
                        ))}
                        <SelectItem value="__custom" style={{ color: 'var(--cv-accent)' }}>
                          Custom...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
 
                  {/*
                    FIX: Custom denomination input now uses separate customDenomination state.
                    Before: onChange set newCoin.denomination directly, causing the Select to
                    show the typed string as its value and making the "Custom..." placeholder
                    disappear. Now denomination stays "__custom" while typing, resolved on submit.
                  */}
                  {newCoin.denomination === '__custom' && (
                    <Input placeholder="Enter denomination" value={customDenomination}
                      onChange={e => setCustomDenomination(e.target.value)} className="h-11 rounded-xl"
                      style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} autoFocus />
                  )}
 
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Year *"
                      value={newCoin.year}
                      onChange={e => setNewCoin({ ...newCoin, year: e.target.value })}
                      className="h-11 rounded-xl"
                      style={{
                        background: 'var(--cv-input-bg)',
                        border: '1px solid var(--cv-accent-border)',
                        color: 'var(--cv-text)',
                      }}
                    />
                    <Input
                      placeholder="Mint Mark"
                      value={newCoin.mint_mark}
                      onChange={e => setNewCoin({ ...newCoin, mint_mark: e.target.value })}
                      className="h-11 rounded-xl"
                      style={{
                        background: 'var(--cv-input-bg)',
                        border: '1px solid var(--cv-accent-border)',
                        color: 'var(--cv-text)',
                      }}
                    />
                  </div>
 
                  {/* Composition — with autocomplete suggestions */}
                  <Input placeholder="Composition" value={newCoin.composition} list="compositions-list"
                    onChange={e => setNewCoin({ ...newCoin, composition: e.target.value })}
                    className="h-11 rounded-xl"
                    style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                  <datalist id="compositions-list">
                    {existingCompositions.map(c => <option key={c} value={c} />)}
                  </datalist>
 
                  <div className="grid grid-cols-2 gap-3">
                    {/* Grade — with autocomplete suggestions */}
                    <Input placeholder="Grade" value={newCoin.user_grade} list="grades-list"
                      onChange={e => setNewCoin({ ...newCoin, user_grade: e.target.value })}
                      className="h-11 rounded-xl"
                      style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                    <datalist id="grades-list">
                      {existingGrades.map(g => <option key={g} value={g} />)}
                    </datalist>
                    <Input
                      placeholder="Purchase Price"
                      value={newCoin.purchase_price}
                      onChange={e => setNewCoin({ ...newCoin, purchase_price: e.target.value })}
                      className="h-11 rounded-xl"
                      style={{
                        background: 'var(--cv-input-bg)',
                        border: '1px solid var(--cv-accent-border)',
                        color: 'var(--cv-text)',
                      }}
                    />
                  </div>
 
                  {/* Photo upload fields */}
                  <div className="grid grid-cols-2 gap-3">
                    {['obverse', 'reverse'].map(side => (
                      <FilePreviewSlot
                        key={side}
                        side={side}
                        file={side === 'obverse' ? obverseFile : reverseFile}
                        onSelect={(f) => handleFileSelect(side, f)}
                      />
                    ))}
                  </div>
 
                  {/*
                    FIX: Submit button disabled until required fields are filled.
                    Before: button was always enabled, creating blank coin records.
                    "Denomination *" and "Year *" are the minimum required fields.
                  */}
                  <Button
                    onClick={handleAddCoin}
                    disabled={uploading || !canSubmit}
                    className="w-full h-11 rounded-xl font-semibold gap-2"
                    style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                    ) : (
                      'Add Coin'
                    )}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
 
      {/* Collection tags */}
      <CollectionTags collection={collection} onUpdated={load} />

      {/* Search and filters */}
      {coins.length > 1 && (
        <CoinFilterBar coins={coins} onFiltered={handleFiltered} />
      )}

      {/* Coin grid */}
      {coins.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--cv-accent-bg)' }}
          >
            <Coins className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No coins yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--cv-text-faint)' }}>
            Tap "Add" to add your first coin
          </p>
        </div>
      ) : coins.length > 1 && filteredCoins.length === 0 && hasActiveFilters ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No coins match your filters</p>
          <p className="text-xs mt-1" style={{ color: 'var(--cv-text-faint)' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {(coins.length > 1 ? filteredCoins : coins).map(coin => {
            const isSet = isMultiImageType(coin.entry_type);
            return (
              <div
                key={coin.id}
                className="group rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
                style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
              >
                <Link to={`/coins/${coin.id}`} className="block">
                  <div
                    className="aspect-square flex items-center justify-center overflow-hidden relative"
                    style={{
                      background: `linear-gradient(135deg, var(--cv-gradient-from), var(--cv-gradient-to))`,
                    }}
                  >
                    {coin.obverse_image || coin.set_images?.[0] ? (
                      <img
                        src={coin.obverse_image || coin.set_images[0]}
                        alt=""
                        className="w-full h-full object-contain p-3"
                        loading="lazy"
                      />
                    ) : (
                      <Coins className="w-8 h-8" style={{ color: 'var(--cv-text-faint)' }} />
                    )}
                    {isSet && (
                      <div
                        className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{
                          background: 'var(--cv-accent-bg)',
                          color: 'var(--cv-accent)',
                          border: '1px solid var(--cv-accent-border)',
                        }}
                      >
                        Set
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate" style={{ color: 'var(--cv-text)' }}>
                      {isSet ? (coin.set_name || `${coin.year} ${coin.denomination}`) : `${coin.year} ${coin.denomination}`}
                    </h3>
                    <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>
                      {coin.country}
                    </p>
                    {(coin.user_grade || coin.ai_grade) && (
                      <span
                        className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1"
                        style={{
                          background: 'var(--cv-accent-bg)',
                          color: 'var(--cv-accent)',
                          border: '1px solid var(--cv-accent-border)',
                        }}
                      >
                        {coin.user_grade || coin.ai_grade}
                      </span>
                    )}
                  </div>
                </Link>
 
                <div className="px-3 pb-3 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="p-1.5 -m-1.5 hover:text-red-400 transition-colors opacity-40 hover:opacity-100"
                        style={{ color: 'var(--cv-text-faint)' }}
                        aria-label="Delete coin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      className="mx-4"
                      style={{
                        background: 'var(--cv-bg-elevated)',
                        border: '1px solid var(--cv-accent-border)',
                        color: 'var(--cv-text)',
                      }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this coin?</AlertDialogTitle>
                        <AlertDialogDescription style={{ color: 'var(--cv-text-secondary)' }}>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          style={{
                            background: 'var(--cv-input-bg)',
                            border: '1px solid var(--cv-border)',
                            color: 'var(--cv-text)',
                          }}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCoin(coin.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}