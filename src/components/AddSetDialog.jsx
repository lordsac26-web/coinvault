import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createCoin } from '@/components/storage';
import { analyzeItem } from '@/components/coinAI';
import { Package, Loader2, Sparkles, X, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ENTRY_TYPES = [
  { value: 'proof_set', label: 'Proof Set', desc: 'Hard plastic case' },
  { value: 'mint_set', label: 'Mint Set', desc: 'Soft plastic/cello' },
  { value: 'bullion', label: 'Bullion', desc: 'Gold/silver coins & bars' },
  { value: 'roll', label: 'Coin Roll', desc: 'Rolled coins' },
  { value: 'commemorative', label: 'Commemorative', desc: 'Coins & medals' },
  { value: 'paper_currency', label: 'Paper Currency', desc: 'Banknotes & bills' },
];

const TYPE_LABELS = {
  proof_set: 'Proof Set', mint_set: 'Mint Set', bullion: 'Bullion',
  roll: 'Coin Roll', commemorative: 'Commemorative', paper_currency: 'Paper Currency',
};

export default function AddSetDialog({ collectionId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('upload');
  const [entryType, setEntryType] = useState('proof_set');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    setStep('analyzing');
    const uploadPromises = files.map(f => base44.integrations.Core.UploadFile({ file: f }));
    const uploaded = await Promise.all(uploadPromises);
    const urls = uploaded.map(u => u.file_url);
    const result = await analyzeItem(urls, entryType);
    setAiResult({ ...result, imageUrls: urls });
    setAnalyzing(false);
    setStep('review');
  };

  const handleSave = async () => {
    if (!aiResult) return;
    setSaving(true);
    await createCoin({
      collection_id: collectionId,
      entry_type: entryType,
      set_name: aiResult.set_name || `${aiResult.year || ''} ${TYPE_LABELS[entryType]}`.trim(),
      set_images: aiResult.imageUrls,
      set_contents: aiResult.coins_included || [],
      country: aiResult.country || '',
      year: aiResult.year || '',
      denomination: TYPE_LABELS[entryType],
      mint_mark: aiResult.mint_mark || '',
      composition: aiResult.composition || '',
      weight: aiResult.weight || '',
      condition_notes: aiResult.condition_notes || '',
      personal_notes: aiResult.notes || '',
      purchase_price: purchasePrice,
      obverse_image: aiResult.imageUrls?.[0] || null,
      market_value: aiResult.estimated_value ? { this_coin_estimated_value: aiResult.estimated_value } : null,
    });
    setSaving(false);
    resetAndClose();
    onAdded();
  };

  const resetAndClose = () => {
    setOpen(false);
    setStep('upload');
    setFiles([]);
    setPreviews([]);
    setAiResult(null);
    setPurchasePrice('');
    setEntryType('proof_set');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-9 px-3 sm:px-4 rounded-xl font-semibold"
          style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}>
          <Package className="w-4 h-4" /> <span className="hidden sm:inline">Add Item</span><span className="sm:hidden">Item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl"
        style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Add {TYPE_LABELS[entryType]}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ENTRY_TYPES.map(opt => (
                <button key={opt.value} onClick={() => setEntryType(opt.value)}
                  className="p-2.5 rounded-xl text-left transition-all"
                  style={{
                    border: entryType === opt.value ? '2px solid var(--cv-accent)' : '1px solid var(--cv-border)',
                    background: entryType === opt.value ? 'var(--cv-accent-bg)' : 'var(--cv-bg-card)',
                  }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--cv-text)' }}>{opt.label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--cv-text-muted)' }}>{opt.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--cv-text-muted)' }}>
                Upload photos (front, back, packaging)
              </p>
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {previews.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--cv-border)' }}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-black/60">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex flex-col items-center gap-2 py-6 rounded-xl cursor-pointer transition-colors"
                style={{ border: '2px dashed var(--cv-border)', background: 'var(--cv-input-bg)' }}>
                <Camera className="w-6 h-6" style={{ color: 'var(--cv-text-faint)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--cv-text-muted)' }}>
                  {previews.length > 0 ? 'Add more photos' : 'Tap to add photos'}
                </span>
                <input type="file" accept="image/*" capture="environment" multiple onChange={handleFileAdd} className="hidden" />
              </label>
            </div>

            <Button onClick={handleAnalyze} disabled={files.length === 0}
              className="w-full h-11 rounded-xl font-semibold gap-2"
              style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
              <Sparkles className="w-4 h-4" /> Analyze with AI
            </Button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--cv-accent)' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>Analyzing your {TYPE_LABELS[entryType].toLowerCase()}...</p>
              <p className="text-xs mt-1" style={{ color: 'var(--cv-text-muted)' }}>Identifying details and condition</p>
            </div>
          </div>
        )}

        {step === 'review' && aiResult && (
          <div className="space-y-4 mt-2">
            <div className="rounded-xl p-3" style={{ background: 'var(--cv-accent-bg)', border: '1px solid var(--cv-accent-border)' }}>
              <h3 className="text-sm font-bold" style={{ color: 'var(--cv-accent)' }}>{aiResult.set_name}</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs" style={{ color: 'var(--cv-text-secondary)' }}>
                {aiResult.year && <span>{aiResult.year}</span>}
                {aiResult.country && <span>· {aiResult.country}</span>}
                {aiResult.mint_mark && <span>· Mint: {aiResult.mint_mark}</span>}
                {aiResult.weight && <span>· {aiResult.weight}</span>}
              </div>
              {aiResult.composition && (
                <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded"
                  style={{ background: 'var(--cv-bg-card)', color: 'var(--cv-text-muted)' }}>
                  {aiResult.composition}
                </span>
              )}
            </div>

            {aiResult.coins_included?.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide font-medium mb-2" style={{ color: 'var(--cv-text-muted)' }}>
                  Contents ({aiResult.coins_included.length})
                </p>
                <div className="space-y-1">
                  {aiResult.coins_included.map((coin, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ background: 'var(--cv-input-bg)' }}>
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--cv-accent)' }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium" style={{ color: 'var(--cv-text)' }}>{coin.denomination}</span>
                        {coin.description && (
                          <span className="text-[11px] ml-1.5" style={{ color: 'var(--cv-text-muted)' }}>— {coin.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiResult.condition_notes && (
              <div className="rounded-xl p-3" style={{ background: 'var(--cv-input-bg)' }}>
                <p className="text-[11px] uppercase tracking-wide font-medium mb-1" style={{ color: 'var(--cv-text-muted)' }}>Condition</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--cv-text-secondary)' }}>{aiResult.condition_notes}</p>
              </div>
            )}

            {aiResult.estimated_value && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>AI Estimated Value:</span>
                <span className="text-sm font-bold text-green-400">{aiResult.estimated_value}</span>
              </div>
            )}

            <Input placeholder="Purchase price (optional)" value={purchasePrice}
              onChange={e => setPurchasePrice(e.target.value)}
              className="h-11 rounded-xl"
              style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />

            <div className="flex gap-2">
              <Button onClick={() => { setStep('upload'); setAiResult(null); }}
                className="flex-1 h-11 rounded-xl font-semibold"
                style={{ background: 'var(--cv-input-bg)', color: 'var(--cv-text-secondary)', border: '1px solid var(--cv-border)' }}>
                Re-upload
              </Button>
              <Button onClick={handleSave} disabled={saving}
                className="flex-1 h-11 rounded-xl font-semibold gap-2"
                style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}