import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCoins } from '@/components/storage';
import { DollarSign, TrendingUp, TrendingDown, Minus, Coins } from 'lucide-react';

export default function PriceGuide() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const load = async () => { const c = await getCoins(); setCoins(c); setLoading(false); }; load(); }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--cv-spinner-track)', borderTopColor: 'var(--cv-spinner-head)' }} /></div>;

  const valuedCoins = coins.filter(c => c.market_value?.this_coin_estimated_value);
  const totalValue = valuedCoins.reduce((sum, c) => { const val = parseFloat(c.market_value.this_coin_estimated_value.replace(/[^0-9.]/g, '') || 0); return sum + (isNaN(val) ? 0 : val); }, 0);

  const TrendIcon = ({ trend }) => {
    if (trend === 'Rising') return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
    if (trend === 'Falling') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
    return <Minus className="w-3.5 h-3.5" style={{ color: 'var(--cv-text-faint)' }} />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-1.5" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>Price Guide</h1>
      <p className="text-xs sm:text-sm mb-5 sm:mb-8" style={{ color: 'var(--cv-text-muted)' }}>Run "Market" on each coin to populate values.</p>
      <div className="rounded-2xl p-4 sm:p-5 mb-5 sm:mb-8" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0"><DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" /></div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--cv-text-muted)' }}>Total Estimated Value</span>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--cv-text)', fontFamily: "'Playfair Display', Georgia, serif" }}>${totalValue.toLocaleString()}</p>
          </div>
          <span className="text-[11px] shrink-0 hidden sm:block" style={{ color: 'var(--cv-text-faint)' }}>{valuedCoins.length}/{coins.length} valued</span>
        </div>
      </div>
      {valuedCoins.length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--cv-accent-bg)' }}><Coins className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} /></div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No market values yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--cv-text-faint)' }}>Go to a coin and tap "Market" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {valuedCoins.map(coin => (
            <Link key={coin.id} to={`/coins/${coin.id}`} className="flex items-center gap-3 sm:gap-4 rounded-2xl p-3 sm:p-4 active:scale-[0.99] transition-all" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'var(--cv-accent-bg)' }}>
                {coin.obverse_image ? <img src={coin.obverse_image} alt="" className="w-full h-full object-contain" loading="lazy" /> : <Coins className="w-5 h-5" style={{ color: 'var(--cv-text-faint)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate" style={{ color: 'var(--cv-text)' }}>{coin.year} {coin.denomination}</h3>
                <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>{coin.country}{coin.user_grade ? ` · ${coin.user_grade}` : ''}</p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                <p className="text-sm font-bold text-green-400">{coin.market_value.this_coin_estimated_value}</p>
                <div className="flex items-center gap-1"><TrendIcon trend={coin.market_value.price_trend} /><span className="text-[11px]" style={{ color: 'var(--cv-text-faint)' }}>{coin.market_value.price_trend || 'N/A'}</span></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}