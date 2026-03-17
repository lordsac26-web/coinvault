import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getCollections, getCoins, createCollection, deleteCollection } from '@/components/storage';
import { Plus, Trash2, FolderOpen, Coins, DollarSign, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Collections', value: collections.length, icon: FolderOpen, color: 'text-blue-400' },
          { label: 'Total Coins', value: coins.length, icon: Coins, color: 'text-[#e8c97a]' },
          { label: 'Est. Value', value: `$${totalValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
          { label: 'Graded', value: coins.filter(c => c.user_grade || c.ai_grade).length, icon: Star, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[#c9a84c]/15 p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-[#f5f0e8]/50">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>My Collections</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a] gap-2">
              <Plus className="w-4 h-4" /> New Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f1525] border-[#c9a84c]/20 text-[#f5f0e8]">
            <DialogHeader>
              <DialogTitle className="text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="Collection name" value={newCol.name} onChange={e => setNewCol({ ...newCol, name: e.target.value })}
                className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
              <Textarea placeholder="Description (optional)" value={newCol.description} onChange={e => setNewCol({ ...newCol, description: e.target.value })}
                className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
              <Select value={newCol.type} onValueChange={v => setNewCol({ ...newCol, type: v })}>
                <SelectTrigger className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f1525] border-[#c9a84c]/20">
                  {['By Country', 'By Type', 'By Era', 'By Series', 'By Metal', 'Custom'].map(t => (
                    <SelectItem key={t} value={t} className="text-[#f5f0e8]">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreate} className="w-full bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a]">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collection grid */}
      {collections.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-12 h-12 text-[#c9a84c]/30 mx-auto mb-4" />
          <p className="text-[#f5f0e8]/40">No collections yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(col => {
            const colCoins = coins.filter(c => c.collection_id === col.id);
            return (
              <div key={col.id} className="group rounded-xl border border-[#c9a84c]/15 overflow-hidden hover:border-[#c9a84c]/40 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <Link to={createPageUrl('CollectionView') + '?id=' + col.id}>
                  <div className="h-32 bg-gradient-to-br from-[#c9a84c]/10 to-[#0a0e1a] flex items-center justify-center overflow-hidden">
                    {col.cover_image ? (
                      <img src={col.cover_image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Coins className="w-10 h-10 text-[#c9a84c]/20" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#f5f0e8] truncate">{col.name}</h3>
                    <p className="text-xs text-[#f5f0e8]/40 mt-1">{colCoins.length} coins · {col.type}</p>
                  </div>
                </Link>
                <div className="px-4 pb-3 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-[#f5f0e8]/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#0f1525] border-[#c9a84c]/20 text-[#f5f0e8]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{col.name}"?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#f5f0e8]/50">
                          This will delete the collection and all {colCoins.length} coins in it. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(col.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}