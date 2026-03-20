import { useState } from 'react';
import { Tag, Sparkles, Loader2, X, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { updateCollection } from '@/components/storage';
import { toast } from 'sonner';

export default function CollectionTags({ collection, onUpdate, coinCount }) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const tags = collection.tags || [];

  const handleSuggestTags = async () => {
    if (coinCount === 0) {
      toast.error('Add some coins first to generate tags');
      return;
    }
    setSuggesting(true);
    const response = await base44.functions.invoke('suggestCollectionTags', { collectionId: collection.id });
    setSuggestions(response.data.tags || []);
    setSuggesting(false);
  };

  const handleAcceptTag = async (label) => {
    if (tags.includes(label)) return;
    const newTags = [...tags, label];
    await updateCollection(collection.id, { tags: newTags });
    onUpdate({ ...collection, tags: newTags });
    setSuggestions(prev => prev?.filter(s => s.label !== label) || null);
  };

  const handleRemoveTag = async (label) => {
    const newTags = tags.filter(t => t !== label);
    await updateCollection(collection.id, { tags: newTags });
    onUpdate({ ...collection, tags: newTags });
  };

  const handleAcceptAll = async () => {
    if (!suggestions?.length) return;
    const newLabels = suggestions.map(s => s.label).filter(l => !tags.includes(l));
    const newTags = [...tags, ...newLabels];
    await updateCollection(collection.id, { tags: newTags });
    onUpdate({ ...collection, tags: newTags });
    setSuggestions(null);
  };

  return (
    <div className="rounded-2xl p-4 sm:p-5 mb-5" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4" style={{ color: 'var(--cv-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--cv-accent)' }}>Tags</h3>
        </div>
        <Button
          size="sm"
          onClick={handleSuggestTags}
          disabled={suggesting}
          className="gap-1.5 h-8 px-3 rounded-lg text-xs font-medium"
          style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}
        >
          {suggesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {suggesting ? 'Analyzing...' : 'AI Suggest'}
        </Button>
      </div>

      {/* Current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}>
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {tags.length === 0 && !suggestions && (
        <p className="text-xs" style={{ color: 'var(--cv-text-faint)' }}>
          No tags yet. Tap "AI Suggest" to auto-generate tags based on your coins.
        </p>
      )}

      {/* AI Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--cv-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--cv-text-muted)' }}>Suggestions</span>
            <button onClick={handleAcceptAll} className="text-[11px] font-medium hover:underline" style={{ color: 'var(--cv-accent)' }}>
              Accept all
            </button>
          </div>
          <div className="space-y-1.5">
            {suggestions.map(s => (
              <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg transition-colors"
                style={{ background: 'var(--cv-input-bg)' }}>
                <button onClick={() => handleAcceptTag(s.label)}
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: tags.includes(s.label) ? 'var(--cv-accent-dim)' : 'var(--cv-bg-card)', border: '1px solid var(--cv-accent-border)' }}>
                  {tags.includes(s.label) ? (
                    <Check className="w-3.5 h-3.5" style={{ color: 'var(--cv-accent-text)' }} />
                  ) : (
                    <Plus className="w-3.5 h-3.5" style={{ color: 'var(--cv-text-muted)' }} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium" style={{ color: 'var(--cv-text)' }}>{s.label}</span>
                  <p className="text-[11px] truncate" style={{ color: 'var(--cv-text-muted)' }}>{s.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions && suggestions.length === 0 && (
        <p className="text-xs mt-2" style={{ color: 'var(--cv-text-faint)' }}>
          No additional tags suggested. Your collection may need more coins for better analysis.
        </p>
      )}
    </div>
  );
}