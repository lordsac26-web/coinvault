import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createCoin } from '@/components/storage';
import { analyzeSet } from '@/components/coinAI';
import { Package, Upload, Loader2, Sparkles, X, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AddSetDialog({ collectionId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('upload'); // upload | analyzing | review
  const [setType, setSetType] = useState('proof_set');
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

    // Upload all files
    const uploadPromises = files.map(f => base44.integrations.Core.UploadFile({ file: f }));
    const uploaded = await Promise.all(uploadPromises);
    const urls = uploaded.map(u => u.file_url);

    // AI analysis
    const result = await analyzeSet(urls, setType);
    setAiResult({ ...result, imageUrls: urls });
    setAnalyzing(false);
    setStep('review');
  };

  const handleSave = async () => {
    if (!aiResult) return;
    setSaving(true);

    await createCoin({
      collection_id: collectionId,
      entry_type: setType,
      set_name: aiResult.set_name || `${aiResult.year} ${setType === 'proof_set' ? 'Proof' : 'Mint'} Set`,
      set_images: aiResult.imageUrls,
      set_contents: aiResult.coins_included || [],
      country: aiResult.country || 'United States',
      year: aiResult.year || '',
      denomination: setType === 'proof_set' ? 'Proof Set' : 'Mint Set',
      mint_mark: aiResult.mint_mark || '',
      composition: aiResult.composition || '',
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
    setSetType('proof_set');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-9 px-3 sm:px-4 rounded-xl font-semibold"
          style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}>
          <Package className="w-4 h-4" /> <span className="hidden sm:inline">Add Set</span><span className="sm:hidden">Set</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl"
        style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Add {setType === 'proof_set' ? 'Proof' : 'Mint'} Set
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 mt-2">
            {/* Set type toggle */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'proof_set', label: 'Proof Set', desc: 'Hard plastic case' },
                { value: 'mint_set', label: 'Mint Set', desc: 'Soft plastic/cello' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setSetType(opt.value)}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    border: setType === opt.value ? '2px solid var(--cv-accent)' : '1px solid var(--cv-border)',
                    background: setType === opt.value ? 'var(--cv-accent-bg)' : 'var(--cv-bg-card)',
                  }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--cv-text)' }}>{opt.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--cv-text-muted)' }}>{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Photo upload area */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--cv-text-muted)' }}>
                Upload photos of the complete set (front, back, packaging)
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
                <input type="file" accept="image/*" multiple onChange={handleFileAdd} className="hidden" />
              </label>
            </div>

            <Button onClick={handleAnalyze} disabled={files.length === 0}
              className="w-full h-11 rounded-xl font-semibold gap-2"
              style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
              <Sparkles className="w-4 h-4" /> Analyze Set with AI
            </Button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--cv-accent)' }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>Analyzing your set...</p>
              <p className="text-xs mt-1" style={{ color: 'var(--cv-text-muted)' }}>Identifying coins, year, and condition</p>
            </div>
          </div>
        )}

        {step === 'review' && aiResult && (
          <div className="space-y-4 mt-2">
            {/* Set header */}
            <div className="rounded-xl p-3" style={{ background: 'var(--cv-accent-bg)', border: '1px solid var(--cv-accent-border)' }}>
              <h3 className="text-sm font-bold" style={{ color: 'var(--cv-accent)' }}>{aiResult.set_name}</h3>
              <div className="flex gap-3 mt-1.5 text-xs" style={{ color: 'var(--cv-text-secondary)' }}>
                {aiResult.year && <span>{aiResult.year}</span>}
                {aiResult.country && <span>· {aiResult.country}</span>}
                {aiResult.mint_mark && <span>· Mint: {aiResult.mint_mark}</span>}
              </div>
              {aiResult.composition && (
                <span className="inline-block mt-1.5 text-[11px] px-2 py-0.5 rounded"
                  style={{ background: 'var(--cv-bg-card)', color: 'var(--cv-text-muted)' }}>
                  {aiResult.composition}
                </span>
              )}
            </div>

            {/* Coins identified */}
            {aiResult.coins_included?.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide font-medium mb-2" style={{ color: 'var(--cv-text-muted)' }}>
                  Coins Identified ({aiResult.coins_included.length})
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

            {/* Condition + notes */}
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

            {/* Purchase price */}
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
                {saving ? 'Saving...' : 'Save Set'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}