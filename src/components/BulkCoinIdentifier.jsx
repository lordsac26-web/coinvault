import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { identifyCoin } from '@/components/coinAI';
import { createCoin } from '@/components/storage';
import ImageCropper from '@/components/ImageCropper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Camera, Loader2, Check, X, SkipForward, RefreshCw,
  ChevronRight, ChevronLeft, AlertCircle, Grid3X3, Info,
  Pencil, Plus, Minus
} from 'lucide-react';

const inputStyle = {
  background: 'var(--cv-input-bg)',
  border: '1px solid var(--cv-accent-border)',
  color: 'var(--cv-text)',
};

// ── Step indicator ──────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="rounded-full transition-all"
          style={{
            width: i === current ? 18 : 8, height: 8,
            background: i === current ? 'var(--cv-accent)' : i < current ? 'var(--cv-accent-dim)' : 'var(--cv-border)',
          }} />
      ))}
    </div>
  );
}

// ── Grid visual preview ─────────────────────────────────────────────────────
function GridPreview({ cols, rows, currentSlot, croppedImages, emptySlots }) {
  const total = cols * rows;
  return (
    <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: total }).map((_, i) => {
        const row = Math.floor(i / cols) + 1;
        const col = (i % cols) + 1;
        const label = `${row}×${col}`;
        const isEmpty = emptySlots.has(i);
        const isCurrent = currentSlot === i;
        const isDone = croppedImages[i];

        return (
          <div key={i}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all"
            style={{
              border: `2px solid ${isCurrent ? 'var(--cv-accent)' : isDone ? '#4ade80' : isEmpty ? 'var(--cv-border)' : 'var(--cv-border)'}`,
              background: isCurrent ? 'var(--cv-accent-bg)' : isDone ? 'rgba(74,222,128,0.1)' : isEmpty ? 'rgba(0,0,0,0.2)' : 'var(--cv-input-bg)',
              color: isCurrent ? 'var(--cv-accent)' : isDone ? '#4ade80' : isEmpty ? 'var(--cv-text-faint)' : 'var(--cv-text-muted)',
            }}>
            {isDone ? <Check className="w-3 h-3" /> : isEmpty ? <X className="w-3 h-3" /> : label}
          </div>
        );
      })}
    </div>
  );
}

// ── Photo upload slot ───────────────────────────────────────────────────────
function PhotoUploadSlot({ label, file, onSelect }) {
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-all aspect-video"
      style={{ border: `1px dashed ${file ? 'var(--cv-accent)' : 'var(--cv-border)'}`, background: file ? 'var(--cv-accent-bg)' : 'var(--cv-input-bg)' }}>
      {preview ? (
        <img src={preview} alt={label} className="w-full h-full object-contain rounded-lg max-h-36" />
      ) : (
        <>
          <Camera className="w-8 h-8" style={{ color: 'var(--cv-text-faint)' }} />
          <span className="text-xs text-center" style={{ color: 'var(--cv-text-muted)' }}>{label}</span>
        </>
      )}
      <input type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => { if (e.target.files[0]) onSelect(e.target.files[0]); e.target.value = ''; }} />
    </label>
  );
}

// ── Result card for review ──────────────────────────────────────────────────
function ResultCard({ index, slot, result, onEdit, onRerun, rerunning }) {
  const [editing, setEditing] = useState(false);
  const [localEdits, setLocalEdits] = useState({});

  const label = `Slot ${Math.floor(index / slot.cols) + 1}×${(index % slot.cols) + 1}`;

  if (slot.empty) return (
    <div className="rounded-xl p-3 opacity-40" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-input-bg)' }}>
      <p className="text-xs font-medium" style={{ color: 'var(--cv-text-muted)' }}>{label} — Empty</p>
    </div>
  );

  const getVal = (key) => localEdits[key] !== undefined ? localEdits[key] : (result?.[key] || '');
  const setVal = (key, val) => setLocalEdits(p => ({ ...p, [key]: val }));

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${result ? 'var(--cv-accent-border)' : 'rgba(239,68,68,0.3)'}`, background: 'var(--cv-bg-elevated)' }}>
      <div className="flex items-center gap-2 p-3" style={{ borderBottom: '1px solid var(--cv-border)', background: 'var(--cv-accent-bg)' }}>
        <div className="flex gap-1">
          {slot.obverseUrl && <img src={slot.obverseUrl} alt="" className="w-8 h-8 rounded-full object-cover" />}
          {slot.reverseUrl && <img src={slot.reverseUrl} alt="" className="w-8 h-8 rounded-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--cv-text-muted)' }}>{label}</p>
          <p className="text-sm font-bold truncate" style={{ color: result ? 'var(--cv-accent)' : '#f87171' }}>
            {result ? result.coin_name : 'Could not identify'}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onRerun(index)} disabled={rerunning}
            className="p-1.5 rounded-lg transition-colors" title="Re-run AI"
            style={{ color: 'var(--cv-text-muted)', background: 'var(--cv-input-bg)' }}>
            {rerunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { setEditing(!editing); setLocalEdits({}); }}
            className="p-1.5 rounded-lg transition-colors" title="Edit manually"
            style={{ color: editing ? 'var(--cv-accent)' : 'var(--cv-text-muted)', background: editing ? 'var(--cv-accent-bg)' : 'var(--cv-input-bg)' }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!editing && result && (
        <div className="px-3 py-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: 'var(--cv-text-secondary)' }}>
          {result.year && <span>{result.year}</span>}
          {result.country && <span>{result.country}</span>}
          {result.denomination && <span>{result.denomination}</span>}
          {result.suggested_grade && <span>{result.suggested_grade}</span>}
          {result.estimated_value && <span style={{ color: 'var(--cv-accent)' }}>{result.estimated_value}</span>}
        </div>
      )}

      {editing && (
        <div className="p-3 grid grid-cols-2 gap-2">
          {['country', 'denomination', 'year', 'mint_mark', 'coin_series', 'composition', 'suggested_grade'].map(key => (
            <div key={key}>
              <label className="text-[10px] uppercase tracking-wide block mb-1" style={{ color: 'var(--cv-text-muted)' }}>
                {key.replace(/_/g, ' ')}
              </label>
              <Input value={getVal(key)} onChange={e => setVal(key, e.target.value)}
                className="h-8 text-xs rounded-lg" style={inputStyle} />
            </div>
          ))}
          <div className="col-span-2 flex justify-end pt-1">
            <button onClick={() => { onEdit(index, localEdits); setEditing(false); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
              <Check className="w-3 h-3" /> Save Edits
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function BulkCoinIdentifier({ collectionId, onAdded, onBack }) {
  const [step, setStep] = useState('setup'); // setup | instructions | obverse-upload | obverse-crop | reverse-upload | reverse-crop | analyzing | review | saving
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(2);

  // Per-slot state
  const [currentSlot, setCurrentSlot] = useState(0);
  const [cropSide, setCropSide] = useState('obverse'); // 'obverse' | 'reverse'
  const [groupFile, setGroupFile] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [emptySlots, setEmptySlots] = useState(new Set());

  // Cropped files per slot
  const [obverseFiles, setObverseFiles] = useState({});
  const [reverseFiles, setReverseFiles] = useState({});

  // Uploaded URLs per slot
  const [obverseUrls, setObverseUrls] = useState({});
  const [reverseUrls, setReverseUrls] = useState({});

  // Results
  const [results, setResults] = useState({});
  const [rerunningSlot, setRerunningSlot] = useState(null);
  const [saving, setSaving] = useState(false);

  const total = cols * rows;
  const activeSlots = Array.from({ length: total }, (_, i) => i).filter(i => !emptySlots.has(i));

  // ── Grid setup ────────────────────────────────────────────────────────────
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const adjustGrid = (axis, delta) => {
    if (axis === 'cols') {
      const newCols = clamp(cols + delta, 1, 5);
      setCols(newCols);
    } else {
      const newRows = clamp(rows + delta, 1, 4);
      setRows(newRows);
    }
  };

  // ── Cropping flow ─────────────────────────────────────────────────────────
  const startCropping = (side, file) => {
    setGroupFile(file);
    setCurrentSlot(0);
    setCropSide(side);
    setCropFile(file);
    setStep(side === 'obverse' ? 'obverse-crop' : 'reverse-crop');
  };

  const handleCropped = (croppedFile) => {
    if (cropSide === 'obverse') {
      setObverseFiles(p => ({ ...p, [currentSlot]: croppedFile }));
    } else {
      setReverseFiles(p => ({ ...p, [currentSlot]: croppedFile }));
    }
    advanceSlot();
  };

  const handleEmptySlot = () => {
    setEmptySlots(p => new Set([...p, currentSlot]));
    advanceSlot();
  };

  const advanceSlot = () => {
    // Find next non-skipped slot — or finish
    let next = currentSlot + 1;
    while (next < total && emptySlots.has(next)) next++;

    if (next >= total) {
      // Done with this side
      if (cropSide === 'obverse') {
        setStep('reverse-upload');
        setGroupFile(null);
      } else {
        runBulkIdentification();
      }
    } else {
      setCurrentSlot(next);
      setCropFile(groupFile); // reuse same group photo
    }
  };

  const goBackSlot = () => {
    let prev = currentSlot - 1;
    while (prev >= 0 && emptySlots.has(prev)) prev--;
    if (prev < 0) return;
    setCurrentSlot(prev);
    setCropFile(groupFile);
    // Remove empty marker if it was marked empty
    setEmptySlots(p => { const s = new Set(p); s.delete(prev); return s; });
  };

  // ── Bulk identification ───────────────────────────────────────────────────
  const runBulkIdentification = async () => {
    setStep('analyzing');
    // Upload all images in parallel
    const uploadTasks = activeSlots.map(async (i) => {
      const obvFile = obverseFiles[i];
      const revFile = reverseFiles[i];
      if (!obvFile && !revFile) return;
      const [obvRes, revRes] = await Promise.all([
        obvFile ? base44.integrations.Core.UploadFile({ file: obvFile }) : Promise.resolve({ file_url: null }),
        revFile ? base44.integrations.Core.UploadFile({ file: revFile }) : Promise.resolve({ file_url: null }),
      ]);
      setObverseUrls(p => ({ ...p, [i]: obvRes.file_url }));
      setReverseUrls(p => ({ ...p, [i]: revRes.file_url }));
      return { i, obvUrl: obvRes.file_url, revUrl: revRes.file_url };
    });

    const uploaded = await Promise.all(uploadTasks);

    // Identify one at a time (to avoid rate limits)
    const newResults = {};
    for (const item of uploaded) {
      if (!item) continue;
      try {
        const identified = await identifyCoin(item.obvUrl, item.revUrl);
        newResults[item.i] = identified;
      } catch {
        newResults[item.i] = null;
      }
    }
    setResults(newResults);
    setStep('review');
  };

  const rerunSlot = async (slotIndex) => {
    setRerunningSlot(slotIndex);
    try {
      const identified = await identifyCoin(obverseUrls[slotIndex], reverseUrls[slotIndex]);
      setResults(p => ({ ...p, [slotIndex]: identified }));
    } catch {
      // keep null
    }
    setRerunningSlot(null);
  };

  const handleEditResult = (slotIndex, edits) => {
    setResults(p => ({ ...p, [slotIndex]: { ...p[slotIndex], ...edits } }));
  };

  // ── Save all ──────────────────────────────────────────────────────────────
  const handleSaveAll = async () => {
    setSaving(true);
    setStep('saving');
    for (const i of activeSlots) {
      const r = results[i];
      if (!r) continue;
      await createCoin({
        collection_id: collectionId,
        country: r.country || '',
        denomination: r.denomination || '',
        year: r.year || '',
        mint_mark: r.mint_mark || 'None',
        coin_series: r.coin_series || '',
        composition: r.composition || '',
        weight: r.weight || '',
        diameter: r.diameter || '',
        user_grade: r.suggested_grade || '',
        obverse_image: obverseUrls[i] || null,
        reverse_image: reverseUrls[i] || null,
        condition_notes: r.identification_notes || '',
        market_value: r.estimated_value ? { this_coin_estimated_value: r.estimated_value } : null,
      });
    }
    setSaving(false);
    onAdded();
  };

  // ── Instructions ──────────────────────────────────────────────────────────
  if (step === 'instructions') {
    return (
      <div className="space-y-4 mt-2">
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--cv-accent-bg)', border: '1px solid var(--cv-accent-border)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--cv-accent)' }}>How Grid Identification Works</p>
          {[
            ['Step 1 — Arrange coins', `Place your coins face-up (obverse) in a ${cols}×${rows} grid on a dark, flat surface. Keep them evenly spaced.`],
            ['Step 2 — Photo the fronts', 'Take one wide photo of all coins showing the obverse side. Make sure all coins are visible and well-lit.'],
            ['Step 3 — Crop each coin', 'You\'ll be guided to crop each coin\'s obverse one by one, left-to-right, top-to-bottom. Mark empty slots as "Empty."'],
            ['Step 4 — Flip the coins', 'Without changing their positions, flip all coins to show the reverse side. Keep the same grid arrangement.'],
            ['Step 5 — Photo the backs', 'Take a second wide photo of all coins showing the reverse side, in the same grid positions.'],
            ['Step 6 — Crop & Identify', 'Crop each reverse coin the same way. The AI will then identify every coin pair and present the results for review.'],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--cv-accent)' }} />
              <div>
                <span className="text-xs font-semibold" style={{ color: 'var(--cv-text)' }}>{title}: </span>
                <span className="text-xs" style={{ color: 'var(--cv-text-secondary)' }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 py-1">
          <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>Your grid: {cols} columns × {rows} rows = {total} slots</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setStep('setup')} variant="outline" className="flex-1 h-11 rounded-xl"
            style={{ borderColor: 'var(--cv-border)', color: 'var(--cv-text)' }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button onClick={() => setStep('obverse-upload')} className="flex-1 h-11 rounded-xl font-semibold gap-2"
            style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
            Start <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Setup ─────────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <div className="space-y-5 mt-2">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>Choose your grid layout</p>
          <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>How many coins will you be identifying? (2–10)</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[['Columns', 'cols', cols, 1, 5], ['Rows', 'rows', rows, 1, 4]].map(([label, axis, val, min, max]) => (
            <div key={axis} className="space-y-2">
              <p className="text-xs font-medium text-center" style={{ color: 'var(--cv-text-secondary)' }}>{label}</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => adjustGrid(axis, -1)} disabled={val <= min}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)', color: 'var(--cv-text)' }}>
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-2xl font-bold w-6 text-center" style={{ color: 'var(--cv-accent)' }}>{val}</span>
                <button onClick={() => adjustGrid(axis, +1)} disabled={val >= max || total >= 10}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)', color: 'var(--cv-text)' }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <GridPreview cols={cols} rows={rows} currentSlot={-1} croppedImages={{}} emptySlots={new Set()} />
          <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>{total} slot{total !== 1 ? 's' : ''} total</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={onBack} variant="outline" className="flex-1 h-11 rounded-xl"
            style={{ borderColor: 'var(--cv-border)', color: 'var(--cv-text)' }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button onClick={() => setStep('instructions')} className="flex-1 h-11 rounded-xl font-semibold gap-2"
            style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
            <Info className="w-4 h-4" /> How It Works
          </Button>
          <Button onClick={() => setStep('obverse-upload')} className="flex-1 h-11 rounded-xl font-semibold gap-2"
            style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Obverse upload ────────────────────────────────────────────────────────
  if (step === 'obverse-upload') {
    return (
      <div className="space-y-4 mt-2">
        <StepDots current={0} total={4} />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--cv-text)' }}>Step 1 — Photo the Obverse (Front)</p>
          <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>
            Place all coins face-up in a {cols}×{rows} grid and take one wide photo.
          </p>
        </div>
        <PhotoUploadSlot label={`Take photo of all ${total} coins — obverse side`} file={groupFile} onSelect={setGroupFile} />
        <div className="flex gap-2">
          <Button onClick={() => setStep('setup')} variant="outline" className="flex-1 h-11 rounded-xl"
            style={{ borderColor: 'var(--cv-border)', color: 'var(--cv-text)' }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button onClick={() => startCropping('obverse', groupFile)} disabled={!groupFile}
            className="flex-1 h-11 rounded-xl font-semibold gap-2"
            style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
            Crop Coins <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Reverse upload ────────────────────────────────────────────────────────
  if (step === 'reverse-upload') {
    const obvCount = Object.keys(obverseFiles).length;
    return (
      <div className="space-y-4 mt-2">
        <StepDots current={2} total={4} />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--cv-text)' }}>Step 2 — Flip & Photo the Reverse (Back)</p>
          <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>
            Flip all coins to show the reverse side, keeping the same grid positions. Take one wide photo.
          </p>
        </div>
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-xs" style={{ color: 'var(--cv-text-secondary)' }}>
            {obvCount} obverse image{obvCount !== 1 ? 's' : ''} captured. Now capture the reverse sides.
          </p>
        </div>
        <PhotoUploadSlot label={`Take photo of all ${total} coins — reverse side`} file={groupFile} onSelect={setGroupFile} />
        <Button onClick={() => startCropping('reverse', groupFile)} disabled={!groupFile}
          className="w-full h-11 rounded-xl font-semibold gap-2"
          style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
          Crop Reverse Sides <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // ── Obverse / Reverse cropping ────────────────────────────────────────────
  if ((step === 'obverse-crop' || step === 'reverse-crop') && cropFile) {
    const sideLabel = cropSide === 'obverse' ? 'Obverse' : 'Reverse';
    const row = Math.floor(currentSlot / cols) + 1;
    const col = (currentSlot % cols) + 1;
    const croppedSoFar = cropSide === 'obverse' ? obverseFiles : reverseFiles;

    return (
      <div className="space-y-3 mt-2">
        <StepDots current={cropSide === 'obverse' ? 1 : 3} total={4} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--cv-text)' }}>
              {sideLabel} — Slot {row}×{col}
            </p>
            <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>
              Coin {currentSlot + 1} of {total}
            </p>
          </div>
          <GridPreview cols={cols} rows={rows} currentSlot={currentSlot} croppedImages={croppedSoFar} emptySlots={emptySlots} />
        </div>

        <ImageCropper
          file={cropFile}
          onCropped={handleCropped}
          onCancel={() => {
            if (currentSlot === 0) {
              setStep(cropSide === 'obverse' ? 'obverse-upload' : 'reverse-upload');
            } else {
              goBackSlot();
            }
          }}
          initialShape="circle"
        />

        <Button onClick={handleEmptySlot} variant="outline"
          className="w-full h-10 rounded-xl gap-2 text-sm"
          style={{ borderColor: 'var(--cv-border)', color: 'var(--cv-text-muted)' }}>
          <SkipForward className="w-4 h-4" /> This slot is empty — skip it
        </Button>
      </div>
    );
  }

  // ── Analyzing ─────────────────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--cv-accent)' }} />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--cv-text)' }}>Identifying {activeSlots.length} coins...</p>
          <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>This may take a moment</p>
        </div>
      </div>
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────
  if (step === 'review') {
    const identified = activeSlots.filter(i => results[i] !== null).length;
    const failed = activeSlots.filter(i => results[i] === null).length;

    return (
      <div className="space-y-4 mt-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: 'var(--cv-text)' }}>Review Results</p>
          <div className="flex gap-2 text-xs">
            {identified > 0 && <span style={{ color: '#4ade80' }}>{identified} identified</span>}
            {failed > 0 && <span style={{ color: '#f87171' }}>{failed} failed</span>}
          </div>
        </div>

        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {Array.from({ length: total }, (_, i) => {
            const isEmpty = emptySlots.has(i);
            return (
              <ResultCard key={i} index={i}
                slot={{ empty: isEmpty, cols, obverseUrl: obverseUrls[i], reverseUrl: reverseUrls[i] }}
                result={isEmpty ? null : results[i]}
                onEdit={handleEditResult}
                onRerun={rerunSlot}
                rerunning={rerunningSlot === i}
              />
            );
          })}
        </div>

        <Button onClick={handleSaveAll}
          disabled={activeSlots.every(i => !results[i])}
          className="w-full h-11 rounded-xl font-semibold gap-2"
          style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
          <Check className="w-4 h-4" /> Add All to Collection
        </Button>
      </div>
    );
  }

  // ── Saving ────────────────────────────────────────────────────────────────
  if (step === 'saving') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--cv-accent)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>Saving coins to your collection...</p>
      </div>
    );
  }

  return null;
}