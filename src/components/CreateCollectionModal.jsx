import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { COLLECTION_TYPES } from '../lib/sampleData';
import { createCollection } from '../lib/storage';

export default function CreateCollectionModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', type: 'Custom', targetGoal: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const col = await createCollection(form);
    setSaving(false);
    onCreated(col);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-[#c9a84c]/30 p-6 relative"
        style={{ background: 'rgba(17,24,39,0.98)', boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.15)' }}>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-[#f5f0e8]/40 hover:text-[#f5f0e8] transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#c9a84c]/20 flex items-center justify-center">
            <FolderPlus className="w-5 h-5 text-[#e8c97a]" />
          </div>
          <h2 className="text-xl font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            New Collection
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Collection Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Morgan Silver Dollars"
              className="w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this collection..." rows={2}
              className="w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Collection Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full bg-[#111827] border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm">
              {COLLECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Target Goal <span className="normal-case text-[#f5f0e8]/30">(optional)</span></label>
            <input value={form.targetGoal} onChange={e => setForm({ ...form, targetGoal: e.target.value })}
              placeholder="e.g. Complete Lincoln Cent set 1909-1958"
              className="w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#f5f0e8]/20 text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:border-[#f5f0e8]/40 transition-colors text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}