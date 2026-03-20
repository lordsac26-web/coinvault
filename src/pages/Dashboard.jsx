import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCollections, getCoins, createCollection, deleteCollection } from '@/components/storage';
import { Plus, Trash2, FolderOpen, Coins, DollarSign, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`} style={{ background: 'currentColor', opacity: 0.12 }}>
          <Icon className={`w-3.5 h-3.5 ${color}`} />
        </div>
        <span className="text-xs text-[#f5f0e8]/45 font-medium">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-[#f5f0e8] tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</p>
    </div>
  );
}

function CollectionCard({ col, coinCount, onDelete }) {
  return (
    <div className="group rounded-2xl border border-[#c9a84c]/10 overflow-hidden hover:border-[#c9a84c]/30 transition-all active:scale-[0.98]" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <Link to={`/collections/${col.id}`} className="block">
        <div className="h-28 sm:h-36 bg-gradient-to-br from-[#c9a84c]/8 to-[#0a0e1a] flex items-center justify-center overflow-hidden">
          {col.cover_image ? (
            <img src={col.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Coins className="w-10 h-10 text-[#c9a84c]/15" />
          )}
        </div>
        <div className="p-3.5 sm:p-4">
          <h3 className="font-semibold text-[#f5f0e8] text-sm sm:text-base truncate">{col.name}</h3>
          <p className="text-xs text-[#f5f0e8]/35 mt-1">{coinCount} coin{coinCount !== 1 ? 's' : ''} · {col.type}</p>
        </div>
      </Link>
      <div className="px-3.5 pb-3 flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-1.5 -m-1.5 text-[#f5f0e8]/15 hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100">
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#0f1525] border-[#c9a84c]/20 text-[#f5f0e8] mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{col.name}"?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#f5f0e8]/50">
                This will delete the collection and all {coinCount} coins in it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(col.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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

  const handleDelete = async (id) => {
    await deleteCollection(id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-[#c9a84c]/30 border-t-[#e8c97a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Collections" value={collections.length} icon={FolderOpen} color="text-blue-400" />
        <StatCard label="Total Coins" value={coins.length} icon={Coins} color="text-[#e8c97a]" />
        <StatCard label="Est. Value" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} color="text-green-400" />
        <StatCard label="Graded" value={coins.filter(c => c.user_grade || c.ai_grade).length} icon={Star} color="text-purple-400" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>My Collections</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a] gap-1.5 h-9 px-3 sm:px-4 text-sm font-semibold rounded-xl">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Collection</span><span className="sm:hidden">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f1525] border-[#c9a84c]/20 text-[#f5f0e8] mx-4 sm:mx-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Collection name" value={newCol.name} onChange={e => setNewCol({ ...newCol, name: e.target.value })}
                className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl" />
              <Textarea placeholder="Description (optional)" value={newCol.description} onChange={e => setNewCol({ ...newCol, description: e.target.value })}
                className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] rounded-xl min-h-[80px]" />
              <Select value={newCol.type} onValueChange={v => setNewCol({ ...newCol, type: v })}>
                <SelectTrigger className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f1525] border-[#c9a84c]/20">
                  {['By Country', 'By Type', 'By Era', 'By Series', 'By Metal', 'Custom'].map(t => (
                    <SelectItem key={t} value={t} className="text-[#f5f0e8]">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} className="w-full bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a] h-11 rounded-xl font-semibold">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections */}
      {collections.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-full bg-[#c9a84c]/5 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-7 h-7 text-[#c9a84c]/25" />
          </div>
          <p className="text-[#f5f0e8]/35 text-sm">No collections yet</p>
          <p className="text-[#f5f0e8]/20 text-xs mt-1">Tap "New" to create your first collection</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {collections.map(col => (
            <CollectionCard
              key={col.id}
              col={col}
              coinCount={coins.filter(c => c.collection_id === col.id).length}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}