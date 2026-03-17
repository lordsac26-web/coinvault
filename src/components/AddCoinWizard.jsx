import { useState } from 'react';
import { X, Sparkles, Loader2, ChevronRight, ChevronLeft, Check, HelpCircle } from 'lucide-react';
import { SHELDON_GRADES, COUNTRIES, MINT_MARKS, COMPOSITIONS, ACQUISITION_SOURCES } from '../lib/sampleData';
import { createCoin } from '../lib/storage';
import { gradeCoin } from '../lib/anthropic';
import CoinImageUpload from './CoinImageUpload';
import AIGradingCard from './AIGradingCard';
import CoinPhotoGuide from './CoinPhotoGuide';

const steps = ['Images', 'Identification', 'Details'];

const inputCls = "w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm";
const selectCls = "w-full bg-[#111827] border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm";
const labelCls = "block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5";

export default function AddCoinWizard({ collectionId, onClose, onAdded }) {
  const [step, setStep] = useState(0);
  const [aiGradeToggle, setAiGradeToggle] = useState(false);
  const [aiGrading, setAiGrading] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [customMint, setCustomMint] = useState('');
  const [customComp, setCustomComp] = useState('');
  const [tagInput, setTagInput] = useState('');

  const [showPhotoGuide, setShowPhotoGuide] = useState(false);

  const [form, setForm] = useState({
    collectionId,
    country: '', denomination: '', year: '', yearUnknown: false,
    mintMark: 'None', coinSeries: '', composition: '', diameter: '', weight: '',
    userGrade: '', obverseImage: null, reverseImage: null,
    purchasePrice: '', purchaseDate: '', whereAcquired: 'Dealer',
    conditionNotes: '', personalNotes: '', storageLocation: '', tags: [],
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const runAiGrading = async () => {
    if (!form.obverseImage || !form.reverseImage) return;
    setAiLoading(true);
    setAiError('');
    try {
      const toBase64 = (dataUrl) => dataUrl.split(',')[1];
      const result = await gradeCoin(toBase64(form.obverseImage), toBase64(form.reverseImage));
      setAiGrading(result);
    } catch (e) {
      setAiError('AI grading failed. Check your API key in Settings.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 0 && aiGradeToggle && form.obverseImage && form.reverseImage && !aiGrading) {
      await runAiGrading();
    }
    setStep(s => s + 1);
  };

  const handleSubmit = () => {
    setSaving(true);
    const finalMint = form.mintMark === 'Custom...' ? customMint : form.mintMark;
    const finalComp = form.composition === 'Custom...' ? customComp : form.composition;
    const coin = createCoin({ ...form, mintMark: finalMint, composition: finalComp, aiGrade: aiGrading });
    setTimeout(() => {
      setSaving(false);
      onAdded(coin);
    }, 400);
  };

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        set('tags', [...form.tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-[#c9a84c]/30 overflow-hidden"
        style={{ background: '#0d1220', boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.1)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c9a84c]/15 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Add Coin</h2>
            <p className="text-xs text-[#f5f0e8]/40 mt-0.5">Step {step + 1} of 3 — {steps[step]}</p>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < step ? 'bg-[#c9a84c] text-[#0a0e1a]' : i === step ? 'bg-[#c9a84c]/30 text-[#e8c97a] border border-[#c9a84c]/50' : 'bg-white/5 text-[#f5f0e8]/30'}`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="text-[#f5f0e8]/40 hover:text-[#f5f0e8] transition-colors ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: Images */}
          {step === 0 && (
            <div className="space-y-5">
              {/* Photo guide toggle */}
              <button
                type="button"
                onClick={() => setShowPhotoGuide(!showPhotoGuide)}
                className="flex items-center gap-2 text-xs text-[#c9a84c]/70 hover:text-[#e8c97a] transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showPhotoGuide ? 'Hide photography tips' : 'How to take great coin photos'}
              </button>

              {showPhotoGuide && (
                <CoinPhotoGuide onClose={() => setShowPhotoGuide(false)} />
              )}

              {/* Image uploads — stacked on mobile, side by side on desktop */}
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center justify-center">
                <CoinImageUpload label="Obverse (Heads)" value={form.obverseImage} onChange={v => set('obverseImage', v)} />
                <CoinImageUpload label="Reverse (Tails)" value={form.reverseImage} onChange={v => set('reverseImage', v)} />
              </div>

              {/* AI Grade toggle */}
              <div className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${aiGradeToggle ? 'border-amber-400/40 bg-amber-500/5' : 'border-[#c9a84c]/20 bg-white/[0.02]'}`}
                onClick={() => setAiGradeToggle(!aiGradeToggle)}>
                <div className={`w-10 h-6 rounded-full transition-all relative shrink-0 ${aiGradeToggle ? 'bg-amber-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${aiGradeToggle ? 'left-5' : 'left-1'}`} />
                </div>
                <Sparkles className={`w-5 h-5 shrink-0 ${aiGradeToggle ? 'text-amber-400' : 'text-[#f5f0e8]/40'}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${aiGradeToggle ? 'text-amber-400' : 'text-[#f5f0e8]/60'}`}>AI Grade This Coin</p>
                  <p className="text-xs text-[#f5f0e8]/30">Upload both images to enable AI grading</p>
                </div>
                {aiGradeToggle && (!form.obverseImage || !form.reverseImage) && (
                  <span className="ml-auto text-xs text-amber-400/60 shrink-0 hidden sm:inline">Upload both first</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Identification */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Country of Origin</label>
                  <input list="countries-list" value={form.country} onChange={e => set('country', e.target.value)}
                    placeholder="Search country..." className={inputCls} />
                  <datalist id="countries-list">
                    {COUNTRIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Denomination</label>
                  <input value={form.denomination} onChange={e => set('denomination', e.target.value)}
                    placeholder="e.g. Morgan Dollar" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <div className="flex gap-2 items-center">
                    <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
                      placeholder="e.g. 1921" disabled={form.yearUnknown} className={inputCls} />
                    <label className="flex items-center gap-1 text-xs text-[#f5f0e8]/50 whitespace-nowrap cursor-pointer">
                      <input type="checkbox" checked={form.yearUnknown} onChange={e => set('yearUnknown', e.target.checked)} className="accent-[#c9a84c]" />
                      Unknown
                    </label>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mint Mark</label>
                  <select value={form.mintMark} onChange={e => set('mintMark', e.target.value)} className={selectCls}>
                    {MINT_MARKS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {form.mintMark === 'Custom...' && (
                    <input value={customMint} onChange={e => setCustomMint(e.target.value)} placeholder="Enter mint mark" className={`${inputCls} mt-2`} />
                  )}
                </div>
                <div>
                  <label className={labelCls}>Coin Series / Type</label>
                  <input value={form.coinSeries} onChange={e => set('coinSeries', e.target.value)}
                    placeholder="e.g. Lincoln Memorial Cent" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Composition</label>
                  <select value={form.composition} onChange={e => set('composition', e.target.value)} className={selectCls}>
                    {COMPOSITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {form.composition === 'Custom...' && (
                    <input value={customComp} onChange={e => setCustomComp(e.target.value)} placeholder="Enter composition" className={`${inputCls} mt-2`} />
                  )}
                </div>
                <div>
                  <label className={labelCls}>Diameter (mm)</label>
                  <input type="number" value={form.diameter} onChange={e => set('diameter', e.target.value)}
                    placeholder="e.g. 38.1" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Weight (g)</label>
                  <input type="number" value={form.weight} onChange={e => set('weight', e.target.value)}
                    placeholder="e.g. 26.73" className={inputCls} />
                </div>
              </div>

              {/* Grade section */}
              <div className="border-t border-[#c9a84c]/15 pt-5">
                <h3 className="text-sm font-semibold text-[#e8c97a] mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Grade</h3>
                
                {aiLoading && (
                  <div className="flex items-center gap-3 py-4 px-4 bg-amber-500/5 rounded-xl border border-amber-500/20 mb-4">
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    <span className="text-sm text-amber-400">AI Grading in progress...</span>
                  </div>
                )}

                {aiError && (
                  <div className="py-3 px-4 bg-red-500/5 rounded-xl border border-red-500/20 text-sm text-red-400 mb-4">{aiError}</div>
                )}

                {aiGrading && (
                  <div className="mb-4">
                    <AIGradingCard grading={aiGrading} userGrade={form.userGrade} onAccept={g => set('userGrade', g)} />
                  </div>
                )}

                <div>
                  <label className={labelCls}>Your Grade {aiGrading ? '(AI Suggested or Override)' : ''}</label>
                  <select value={form.userGrade} onChange={e => set('userGrade', e.target.value)} className={selectCls}>
                    <option value="">Select grade...</option>
                    {SHELDON_GRADES.map(g => (
                      <option key={g.grade} value={g.grade}>{g.grade} — {g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Purchase Price ($)</label>
                  <input type="number" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)}
                    placeholder="Optional" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)}
                    className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Where Acquired</label>
                  <select value={form.whereAcquired} onChange={e => set('whereAcquired', e.target.value)} className={selectCls}>
                    {ACQUISITION_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Condition Notes</label>
                <textarea value={form.conditionNotes} onChange={e => set('conditionNotes', e.target.value)}
                  placeholder="Describe the coin's condition..." rows={2}
                  className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>Personal Notes</label>
                <textarea value={form.personalNotes} onChange={e => set('personalNotes', e.target.value)}
                  placeholder="Your personal notes about this coin..." rows={3}
                  className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>Storage Location</label>
                <input value={form.storageLocation} onChange={e => set('storageLocation', e.target.value)}
                  placeholder="e.g. 2x2 flip, Box 3, Slot 12" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Tags</label>
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
                  placeholder="Type tag and press Enter (e.g. key date, toned, error)" className={inputCls} />
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-xs bg-[#c9a84c]/15 text-[#e8c97a] px-2 py-1 rounded-lg border border-[#c9a84c]/30">
                        {tag}
                        <button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))} className="hover:text-red-400">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#c9a84c]/15 shrink-0">
          <button
            onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#f5f0e8]/20 text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:border-[#f5f0e8]/40 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < 2 ? (
            <button
              onClick={handleNext}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Grading...</> : <>Next <ChevronRight className="w-4 h-4" /></>}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Add to Collection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}