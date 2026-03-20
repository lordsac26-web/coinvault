import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCollections, getCoins, createCollection, deleteCollection } from '@/components/storage';
import { Plus, Trash2, FolderOpen, Coins, DollarSign, Star, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`} style={{ background: 'currentColor', opacity: 0.12 }}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
        <span className="text-xs font-medium" style={{ color: 'var(--cv-text-secondary)' }}>{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--cv-text)', fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</p>
    </div>
  );
}

function CollectionCard({ col, coinCount, onDelete }) {
  return (
    <div className="group rounded-2xl overflow-hidden transition-all active:scale-[0.98]" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
      <Link to={`/collections/${col.id}`} className="block">
        <div className="h-28 sm:h-36 flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, var(--cv-gradient-from), var(--cv-gradient-to))` }}>
          {col.cover_image ? (
            <img src={col.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Coins className="w-10 h-10" style={{ color: 'var(--cv-text-faint)' }} />
          )}
        </div>
        <div className="p-3.5 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: 'var(--cv-text)' }}>{col.name}</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--cv-text-muted)' }}>{coinCount} coin{coinCount !== 1 ? 's' : ''} · {col.type}</p>
          {col.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {col.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}>
                  {tag}
                </span>
              ))}
              {col.tags.length > 3 && (
                <span className="text-[10px] py-0.5" style={{ color: 'var(--cv-text-faint)' }}>+{col.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </Link>
      <div className="px-3.5 pb-3 flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-1.5 -m-1.5 hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100" style={{ color: 'var(--cv-text-faint)' }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="mx-4" style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{col.name}"?</AlertDialogTitle>
              <AlertDialogDescription style={{ color: 'var(--cv-text-secondary)' }}>This will delete the collection and all {coinCount} coins in it.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)', color: 'var(--cv-text)' }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(col.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [collections, setCollections] = useState([]);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newCol, setNewCol] = useState({ name: '', description: '', type: 'Custom' });
  const [activeTag, setActiveTag] = useState(null);

  const load = async () => {
    setLoading(true);
    const [cols, allCoins] = await Promise.all([getCollections(), getCoins()]);
    setCollections(cols);
    setCoins(allCoins);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalValue = coins.reduce((sum, c) => {
    const val = parseFloat(c.market_value?.this_coin_estimated_value?.replace(/[^0-9.]/g, '') || c.purchase_price || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleCreate = async () => {
    if (!newCol.name.trim()) return;
    await createCollection(newCol);
    setNewCol({ name: '', description: '', type: 'Custom' });
    setShowCreate(false);
    load();
  };

  const handleDelete = async (id) => { await deleteCollection(id); load(); };

  // Gather all unique tags across collections
  const allTags = [...new Set(collections.flatMap(c => c.tags || []))].sort();
  const filteredCollections = activeTag
    ? collections.filter(c => (c.tags || []).includes(activeTag))
    : collections;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--cv-spinner-track)', borderTopColor: 'var(--cv-spinner-head)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Collections" value={collections.length} icon={FolderOpen} color="text-blue-400" />
        <StatCard label="Total Coins" value={coins.length} icon={Coins} color="text-amber-400" />
        <StatCard label="Est. Value" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} color="text-green-400" />
        <StatCard label="Graded" value={coins.filter(c => c.user_grade || c.ai_grade).length} icon={Star} color="text-purple-400" />
      </div>

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>My Collections</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-9 px-3 sm:px-4 text-sm font-semibold rounded-xl" style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Collection</span><span className="sm:hidden">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:mx-auto rounded-2xl" style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Collection name" value={newCol.name} onChange={e => setNewCol({ ...newCol, name: e.target.value })}
                className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
              <Textarea placeholder="Description (optional)" value={newCol.description} onChange={e => setNewCol({ ...newCol, description: e.target.value })}
                className="rounded-xl min-h-[80px]" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
              <Select value={newCol.type} onValueChange={v => setNewCol({ ...newCol, type: v })}>
                <SelectTrigger className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)' }}>
                  {['By Country', 'By Type', 'By Era', 'By Series', 'By Metal', 'Proof Sets', 'Mint Sets', 'Bullion', 'Rolls', 'Commemoratives', 'Paper Currency', 'Custom'].map(t => (
                    <SelectItem key={t} value={t} style={{ color: 'var(--cv-text)' }}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} className="w-full h-11 rounded-xl font-semibold" style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <div className="flex items-center gap-1 mr-1">
            <Tag className="w-3.5 h-3.5" style={{ color: 'var(--cv-text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--cv-text-muted)' }}>Filter:</span>
          </div>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={activeTag === tag
                ? { background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)', border: '1px solid var(--cv-accent)' }
                : { background: 'var(--cv-bg-card)', color: 'var(--cv-text-secondary)', border: '1px solid var(--cv-border)' }
              }>
              {tag}
              {activeTag === tag && <X className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}

      {filteredCollections.length === 0 && collections.length > 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No collections match "{activeTag}"</p>
          <button onClick={() => setActiveTag(null)} className="text-xs mt-2 underline" style={{ color: 'var(--cv-accent)' }}>Clear filter</button>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--cv-accent-bg)' }}>
            <FolderOpen className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No collections yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--cv-text-faint)' }}>Tap "New" to create your first collection</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredCollections.map(col => (
            <CollectionCard key={col.id} col={col} coinCount={coins.filter(c => c.collection_id === col.id).length} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}