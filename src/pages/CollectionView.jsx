import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { getCoinsByCollection, createCoin, deleteCoin, updateCollection } from '@/components/storage';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ArrowLeft, Upload, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function CollectionView() {
  const urlParams = new URLSearchParams(window.location.search);
  const collectionId = urlParams.get('id');
  const [collection, setCollection] = useState(null);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newCoin, setNewCoin] = useState({
    country: '', denomination: '', year: '', mint_mark: 'None',
    composition: '', user_grade: '', purchase_price: '',
  });
  const [obverseFile, setObverseFile] = useState(null);
  const [reverseFile, setReverseFile] = useState(null);

  const load = async () => {
    setLoading(true);
    const collections = await base44.entities.Collection.filter({ id: collectionId });
    setCollection(collections[0] || null);
    const coinList = await getCoinsByCollection(collectionId);
    setCoins(coinList);
    setLoading(false);
  };

  useEffect(() => { if (collectionId) load(); }, [collectionId]);

  const uploadFile = async (file) => {
    if (!file) return null;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };

  const handleAddCoin = async () => {
    setUploading(true);
    const [obverseUrl, reverseUrl] = await Promise.all([
      uploadFile(obverseFile),
      uploadFile(reverseFile),
    ]);
    await createCoin({
      collection_id: collectionId,
      ...newCoin,
      obverse_image: obverseUrl,
      reverse_image: reverseUrl,
    });
    setNewCoin({ country: '', denomination: '', year: '', mint_mark: 'None', composition: '', user_grade: '', purchase_price: '' });
    setObverseFile(null);
    setReverseFile(null);
    setShowAdd(false);
    setUploading(false);
    load();
  };

  const handleDeleteCoin = async (id) => {
    await deleteCoin(id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-[#c9a84c]/30 border-t-[#e8c97a] animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-[#f5f0e8]/50">Collection not found.</p>
        <Link to="/dashboard" className="text-[#e8c97a] underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/dashboard" className="text-[#f5f0e8]/40 hover:text-[#e8c97a] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{collection.name}</h1>
          <p className="text-sm text-[#f5f0e8]/40">{coins.length} coins · {collection.type}</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a] gap-2">
              <Plus className="w-4 h-4" /> Add Coin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f1525] border-[#c9a84c]/20 text-[#f5f0e8] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#e8c97a]">Add Coin</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Country" value={newCoin.country} onChange={e => setNewCoin({ ...newCoin, country: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
                <Input placeholder="Denomination" value={newCoin.denomination} onChange={e => setNewCoin({ ...newCoin, denomination: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Year" value={newCoin.year} onChange={e => setNewCoin({ ...newCoin, year: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
                <Input placeholder="Mint Mark" value={newCoin.mint_mark} onChange={e => setNewCoin({ ...newCoin, mint_mark: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
              </div>
              <Input placeholder="Composition" value={newCoin.composition} onChange={e => setNewCoin({ ...newCoin, composition: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Grade" value={newCoin.user_grade} onChange={e => setNewCoin({ ...newCoin, user_grade: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
                <Input placeholder="Purchase Price" value={newCoin.purchase_price} onChange={e => setNewCoin({ ...newCoin, purchase_price: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#f5f0e8]/40 mb-1 block">Obverse Image</label>
                  <Input type="file" accept="image/*" onChange={e => setObverseFile(e.target.files[0])} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
                </div>
                <div>
                  <label className="text-xs text-[#f5f0e8]/40 mb-1 block">Reverse Image</label>
                  <Input type="file" accept="image/*" onChange={e => setReverseFile(e.target.files[0])} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]" />
                </div>
              </div>
              <Button onClick={handleAddCoin} disabled={uploading} className="w-full bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a]">
                {uploading ? 'Uploading...' : 'Add Coin'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coins */}
      {coins.length === 0 ? (
        <div className="text-center py-20">
          <Coins className="w-12 h-12 text-[#c9a84c]/30 mx-auto mb-4" />
          <p className="text-[#f5f0e8]/40">No coins yet. Add your first coin!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {coins.map(coin => (
            <div key={coin.id} className="group rounded-xl border border-[#c9a84c]/15 overflow-hidden hover:border-[#c9a84c]/40 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Link to={`/coins/${coin.id}`}>
                <div className="aspect-square bg-gradient-to-br from-[#c9a84c]/5 to-[#0a0e1a] flex items-center justify-center overflow-hidden">
                  {coin.obverse_image ? (
                    <img src={coin.obverse_image} alt="" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Coins className="w-8 h-8 text-[#c9a84c]/20" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-[#f5f0e8] truncate">{coin.year} {coin.denomination}</h3>
                  <p className="text-xs text-[#f5f0e8]/40 truncate">{coin.country}{coin.user_grade ? ` · ${coin.user_grade}` : ''}</p>
                </div>
              </Link>
              <div className="px-3 pb-2 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-[#f5f0e8]/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0f1525] border-[#c9a84c]/20 text-[#f5f0e8]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this coin?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#f5f0e8]/50">This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCoin(coin.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}