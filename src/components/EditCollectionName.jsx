import { useState } from 'react';
import { updateCollection } from '@/components/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Check, Loader2 } from 'lucide-react';

export default function EditCollectionName({ collection, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(collection.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === collection.name) { setOpen(false); return; }
    setSaving(true);
    await updateCollection(collection.id, { name: trimmed });
    setSaving(false);
    setOpen(false);
    onUpdated();
  };

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setName(collection.name); setOpen(true); }}
        className="p-1 -m-1 rounded transition-colors opacity-40 hover:opacity-100"
        style={{ color: 'var(--cv-text-muted)' }}
        aria-label="Edit collection name"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <Dialog open={open} onOpenChange={v => { if (!v) setOpen(false); }}>
        <DialogContent
          className="mx-4 sm:mx-auto rounded-2xl"
          style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
              Rename Collection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              autoFocus
              className="h-11 rounded-xl"
              style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}
            />
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full h-11 rounded-xl font-semibold gap-2"
              style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}