import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';
import { updateCoin } from '@/components/storage';
import { identifyCoin } from '@/components/coinAI';

const FIELDS = [
  { key: 'country', label: 'Country' },
  { key: 'denomination', label: 'Denomination' },
  { key: 'year', label: 'Year' },
  { key: 'mint_mark', label: 'Mint Mark' },
  { key: 'coin_series', label: 'Series' },
  { key: 'composition', label: 'Composition' },
  { key: 'weight', label: 'Weight' },
  { key: 'diameter', label: 'Diameter' },
  { key: 'user_grade', label: 'Grade' },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'purchase_date', label: 'Purchase Date', type: 'date' },
  { key: 'where_acquired', label: 'Acquired From' },
  { key: 'storage_location', label: 'Storage Location' },
];

const inputStyle = {
  background: 'var(--cv-input-bg)',
  border: '1px solid var(--cv-accent-border)',
  color: 'var(--cv-text)',
};

export default function EditCoinDialog({ coin, open, onOpenChange, onSaved }) {
  const [form, setForm] = useState(() => {
    const init = {};
    FIELDS.forEach(f => { init[f.key] = coin?.[f.key] || ''; });
    init.personal_notes = coin?.personal_notes || '';
    init.condition_notes = coin?.condition_notes || '';
    init.set_name = coin?.set_name || '';
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [identifying, setIdentifying] = useState(false);

  const handleAIIdentify = async () => {
    const obverse = coin?.obverse_image;
    const reverse = coin?.reverse_image;
    if (!obverse && !reverse) return;
    setIdentifying(true);
    const images = [obverse, reverse].filter(Boolean);
    const result = await identifyCoin(images[0], images[1] || images[0]);
    const mapping = {
      country: result.country,
      denomination: result.denomination,
      year: result.year,
      mint_mark: result.mint_mark,
      coin_series: result.coin_series,
      composition: result.composition,
      weight: result.weight,
      diameter: result.diameter,
      user_grade: result.suggested_grade,
    };
    setForm(prev => {
      const next = { ...prev };
      for (const [key, val] of Object.entries(mapping)) {
        if (val) next[key] = val;
      }
      if (result.identification_notes) {
        next.condition_notes = [prev.condition_notes, result.identification_notes].filter(Boolean).join('\n');
      }
      return next;
    });
    setIdentifying(false);
  };

  const hasImages = coin?.obverse_image || coin?.reverse_image;

  const handleSave = async () => {
    setSaving(true);
    const patch = {};
    FIELDS.forEach(f => {
      if (form[f.key] !== (coin?.[f.key] || '')) patch[f.key] = form[f.key];
    });
    if (form.personal_notes !== (coin?.personal_notes || '')) patch.personal_notes = form.personal_notes;
    if (form.condition_notes !== (coin?.condition_notes || '')) patch.condition_notes = form.condition_notes;
    if (form.set_name !== (coin?.set_name || '')) patch.set_name = form.set_name;

    if (Object.keys(patch).length > 0) {
      await updateCoin(coin.id, patch);
    }
    setSaving(false);
    onSaved(patch);
    onOpenChange(false);
  };

  const isSet = coin?.entry_type && coin.entry_type !== 'coin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl"
        style={{
          background: 'var(--cv-bg-elevated)',
          border: '1px solid var(--cv-accent-border)',
          color: 'var(--cv-text)',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Edit Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {/* AI Identify button */}
          {hasImages && (
            <Button
              onClick={handleAIIdentify}
              disabled={identifying}
              variant="outline"
              className="w-full h-10 rounded-xl font-semibold gap-2 text-sm"
              style={{
                background: identifying ? 'var(--cv-accent-bg)' : 'transparent',
                borderColor: 'var(--cv-accent-border)',
                color: 'var(--cv-accent)',
              }}
            >
              {identifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {identifying ? 'Identifying coin...' : 'AI Identify & Fill'}
            </Button>
          )}
          {isSet && (
            <div>
              <label className="text-[11px] uppercase tracking-wide mb-1 block" style={{ color: 'var(--cv-text-muted)' }}>Name</label>
              <Input value={form.set_name} onChange={e => setForm({ ...form, set_name: e.target.value })}
                className="h-11 rounded-xl" style={inputStyle} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-[11px] uppercase tracking-wide mb-1 block" style={{ color: 'var(--cv-text-muted)' }}>{f.label}</label>
                <Input
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="h-10 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide mb-1 block" style={{ color: 'var(--cv-text-muted)' }}>Condition Notes</label>
            <Textarea value={form.condition_notes} onChange={e => setForm({ ...form, condition_notes: e.target.value })}
              className="rounded-xl text-sm min-h-[60px]" style={inputStyle} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wide mb-1 block" style={{ color: 'var(--cv-text-muted)' }}>Personal Notes</label>
            <Textarea value={form.personal_notes} onChange={e => setForm({ ...form, personal_notes: e.target.value })}
              className="rounded-xl text-sm min-h-[60px]" style={inputStyle} />
          </div>
          <Button onClick={handleSave} disabled={saving}
            className="w-full h-11 rounded-xl font-semibold gap-2"
            style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}