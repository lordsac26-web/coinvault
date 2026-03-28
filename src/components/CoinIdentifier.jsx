import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { identifyCoin } from '@/components/coinAI';
import { createCoin } from '@/components/storage';
import ImageCropper from '@/components/ImageCropper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Loader2, Camera, Check, X, Pencil, Package, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const inputStyle = {
  background: 'var(--cv-input-bg)',
  border: '1px solid var(--cv-accent-border)',
  color: 'var(--cv-text)',
};

function PhotoUploadSlot({ label, file, onSelect }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <label
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-all aspect-square"
      style={{
        border: `1px dashed ${file ? 'var(--cv-accent)' : 'var(--cv-border)'}`,
        background: file ? 'var(--cv-accent-bg)' : 'var(--cv-input-bg)',
      }}
    >
      {preview ? (
        <>
          <img src={preview} alt={label} className="w-16 h-16 rounded-full object-cover" />
          <span className="text-[11px] font-medium" style={{ color: 'var(--cv-accent)' }}>{label} ✓</span>
        </>
      ) : (
        <>
          <Camera className="w-6 h-6" style={{ color: 'var(--cv-text-faint)' }} />
          <span className="text-[11px]" style={{ color: 'var(--cv-text-muted)' }}>{label}</span>
        </>
      )}
      <input type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files[0]) onSelect(e.target.files[0]); e.target.value = ''; }} />
    </label>
  );
}

function ResultField({ label, value, editValue, onChange }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wide mb-1 block" style={{ color: 'var(--cv-text-muted)' }}>{label}</label>
      <Input value={editValue ?? value ?? ''} onChange={e => onChange(e.target.value)}
        className="h-9 rounded-lg text-sm" style={inputStyle} />
    </div>
  );
}

export default function CoinIdentifier({ collectionId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('upload'); // upload | cropping | analyzing | review
  const [obverseFile, setObverseFile] = useState(null);
  const [reverseFile, setReverseFile] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // 'obverse' | 'reverse'
  const [cropFile, setCropFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [imageUrls, setImageUrls] = useState({ obverse: null, reverse: null });
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);

  const handleFileSelect = (side, file) => {
    setCropFile(file);
    setCropTarget(side);
    setStep('cropping');
  };

  const handleCropped = (croppedFile) => {
    if (cropTarget === 'obverse') setObverseFile(croppedFile);
    else setReverseFile(croppedFile);
    setCropFile(null);
    setCropTarget(null);
    setStep('upload');
  };

  const [error, setError] = useState(null);

  const handleIdentify = async () => {
    if (!obverseFile || !reverseFile) return;
    setStep('analyzing');
    setAnalyzing(true);
    setError(null);
    try {
      const [obv, rev] = await Promise.all([
        base44.integrations.Core.UploadFile({ file: obverseFile }),
        base44.integrations.Core.UploadFile({ file: reverseFile }),
      ]);
      setImageUrls({ obverse: obv.file_url, reverse: rev.file_url });
      const identified = await identifyCoin(obv.file_url, rev.file_url);
      setResult(identified);
      setEdits({});
      setStep('review');
    } catch (err) {
      console.error('Coin identification failed:', err);
      setError('Identification failed. The request may have timed out — please try again.');
      setStep('upload');
    } finally {
      setAnalyzing(false);
    }
  };

  const getVal = (key) => edits[key] !== undefined ? edits[key] : (result?.[key] || '');
  const setVal = (key, val) => setEdits(prev => ({ ...prev, [key]: val }));

  const handleAddToCollection = async () => {
    if (!result) return;
    setSaving(true);
    await createCoin({
      collection_id: collectionId,
      country: getVal('country'),
      denomination: getVal('denomination'),
      year: getVal('year'),
      mint_mark: getVal('mint_mark') || 'None',
      coin_series: getVal('coin_series'),
      composition: getVal('composition'),
      weight: getVal('weight'),
      diameter: getVal('diameter'),
      user_grade: getVal('suggested_grade'),
      obverse_image: imageUrls.obverse,
      reverse_image: imageUrls.reverse,
      condition_notes: result.identification_notes || '',
      market_value: result.estimated_value ? { this_coin_estimated_value: result.estimated_value } : null,
    });
    setSaving(false);
    resetAndClose();
    onAdded();
  };

  const resetAndClose = () => {
    setOpen(false);
    setStep('upload');
    setObverseFile(null);
    setReverseFile(null);
    setCropFile(null);
    setCropTarget(null);
    setResult(null);
    setImageUrls({ obverse: null, reverse: null });
    setEdits({});
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-9 px-3 sm:px-4 rounded-xl font-semibold"
          style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Identify</span>
          <span className="sm:hidden">ID</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl"
        style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Coin Identifier
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 mt-2">
            {error && (
              <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>
                Take or upload photos of both sides. AI will identify the coin and fill in all details.
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors shrink-0 ml-2"
                    style={{ color: 'var(--cv-accent)', background: 'var(--cv-accent-bg)', border: '1px solid var(--cv-accent-border)' }}>
                    <Info className="w-3 h-3" /> Tips
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-xs space-y-2 p-4 rounded-xl"
                  style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--cv-accent)' }}>Photo Tips for Best Results</p>
                  {[
                    ['Lighting', 'Use natural diffused light or a lamp at a 45 degree angle. Avoid direct flash which causes glare.'],
                    ['Background', 'Place coin on a dark, non-reflective surface to maximize contrast.'],
                    ['Focus', 'Hold camera steady or use a stand. Tap the coin on your screen to set focus point.'],
                    ['Distance', 'Fill the frame — coin should take up 70-80% of the photo.'],
                    ['Both Sides', 'Capture the obverse (front/heads) and reverse (back/tails) for accurate identification.'],
                    ['Clean First', 'Gently remove loose debris with a soft brush before photographing — never rub or clean a coin for grading purposes.'],
                  ].map(([title, tip]) => (
                    <div key={title}>
                      <span className="font-semibold" style={{ color: 'var(--cv-text)' }}>{title}: </span>
                      <span style={{ color: 'var(--cv-text-secondary)' }}>{tip}</span>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PhotoUploadSlot label="Obverse (Front)" file={obverseFile} onSelect={f => handleFileSelect('obverse', f)} />
              <PhotoUploadSlot label="Reverse (Back)" file={reverseFile} onSelect={f => handleFileSelect('reverse', f)} />
            </div>
            <Button onClick={handleIdentify} disabled={!obverseFile || !reverseFile}
              className="w-full h-11 rounded-xl font-semibold gap-2"
              style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
              <Search className="w-4 h-4" /> Identify This Coin
            </Button>
          </div>
        )}

        {step === 'cropping' && cropFile && (
          <ImageCropper file={cropFile} onCropped={handleCropped}
            onCancel={() => { setCropFile(null); setCropTarget(null); setStep('upload'); }}
            initialShape="circle" />
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--cv-accent)' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>Identifying your coin...</p>
              <p className="text-xs mt-1" style={{ color: 'var(--cv-text-muted)' }}>
                Searching numismatic databases for a match
              </p>
            </div>
          </div>
        )}

        {step === 'review' && result && (
          <div className="space-y-4 mt-2">
            {/* Identification summary */}
            <div className="rounded-xl p-3" style={{ background: 'var(--cv-accent-bg)', border: '1px solid var(--cv-accent-border)' }}>
              <div className="flex items-start gap-3">
                <div className="flex gap-1.5 shrink-0">
                  {imageUrls.obverse && <img src={imageUrls.obverse} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  {imageUrls.reverse && <img src={imageUrls.reverse} alt="" className="w-10 h-10 rounded-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate" style={{ color: 'var(--cv-accent)' }}>
                    {result.coin_name}
                  </h3>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--cv-text-secondary)' }}>
                    {result.suggested_grade && <span>{result.suggested_grade}</span>}
                    {result.estimated_value && <span>· {result.estimated_value}</span>}
                  </div>
                </div>
              </div>
              {result.confidence != null && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cv-input-bg)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${result.confidence}%`,
                      background: result.confidence >= 80 ? '#4ade80' : result.confidence >= 50 ? '#facc15' : '#f87171',
                    }} />
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: 'var(--cv-text-muted)' }}>
                    {result.confidence}% match
                  </span>
                </div>
              )}
            </div>

            {result.identification_notes && (
              <p className="text-xs leading-relaxed px-1" style={{ color: 'var(--cv-text-muted)' }}>
                {result.identification_notes}
              </p>
            )}

            {/* Editable fields */}
            <div className="grid grid-cols-2 gap-3">
              <ResultField label="Country" value={result.country} editValue={edits.country} onChange={v => setVal('country', v)} />
              <ResultField label="Denomination" value={result.denomination} editValue={edits.denomination} onChange={v => setVal('denomination', v)} />
              <ResultField label="Year" value={result.year} editValue={edits.year} onChange={v => setVal('year', v)} />
              <ResultField label="Mint Mark" value={result.mint_mark} editValue={edits.mint_mark} onChange={v => setVal('mint_mark', v)} />
              <ResultField label="Series" value={result.coin_series} editValue={edits.coin_series} onChange={v => setVal('coin_series', v)} />
              <ResultField label="Composition" value={result.composition} editValue={edits.composition} onChange={v => setVal('composition', v)} />
              <ResultField label="Weight" value={result.weight} editValue={edits.weight} onChange={v => setVal('weight', v)} />
              <ResultField label="Diameter" value={result.diameter} editValue={edits.diameter} onChange={v => setVal('diameter', v)} />
              <ResultField label="Grade" value={result.suggested_grade} editValue={edits.suggested_grade} onChange={v => setVal('suggested_grade', v)} />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => { setStep('upload'); setObverseFile(null); setReverseFile(null); setResult(null); }}
                className="flex-1 h-11 rounded-xl font-semibold"
                style={{ background: 'var(--cv-input-bg)', color: 'var(--cv-text-secondary)', border: '1px solid var(--cv-border)' }}>
                Try Again
              </Button>
              <Button onClick={handleAddToCollection} disabled={saving}
                className="flex-1 h-11 rounded-xl font-semibold gap-2"
                style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Adding...' : 'Add to Collection'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}