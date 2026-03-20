import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCoins } from '@/components/storage';
import { DollarSign, TrendingUp, TrendingDown, Minus, Coins } from 'lucide-react';

export default function PriceGuide() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const c = await getCoins();
      setCoins(c);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-[#c9a84c]/30 border-t-[#e8c97a] animate-spin" />
      </div>
    );
  }

  const valuedCoins = coins.filter(c => c.market_value?.this_coin_estimated_value);
  const totalValue = valuedCoins.reduce((sum, c) => {
    const val = parseFloat(c.market_value.this_coin_estimated_value.replace(/[^0-9.]/g, '') || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const TrendIcon = ({ trend }) => {
    if (trend === 'Rising') return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
    if (trend === 'Falling') return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
    return <Minus className="w-3.5 h-3.5 text-[#f5f0e8]/25" />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-[#e8c97a] mb-1.5" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Price Guide</h1>
      <p className="text-xs sm:text-sm text-[#f5f0e8]/35 mb-5 sm:mb-8">Run "Market" on each coin to populate values.</p>

      {/* Total */}
      <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5 mb-5 sm:mb-8" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-[#f5f0e8]/35 uppercase tracking-wide">Total Estimated Value</span>
            <p className="text-2xl sm:text-3xl font-bold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>${totalValue.toLocaleString()}</p>
          </div>
          <span className="text-[11px] text-[#f5f0e8]/25 shrink-0 hidden sm:block">{valuedCoins.length}/{coins.length} valued</span>
        </div>
      </div>

      {valuedCoins.length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <div className="w-16 h-16 rounded-full bg-[#c9a84c]/5 flex items-center justify-center mx-auto mb-4">
            <Coins className="w-7 h-7 text-[#c9a84c]/20" />
          </div>
          <p className="text-[#f5f0e8]/35 text-sm">No market values yet</p>
          <p className="text-[#f5f0e8]/20 text-xs mt-1">Go to a coin and tap "Market" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {valuedCoins.map(coin => (
            <Link key={coin.id} to={`/coins/${coin.id}`}
              className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-[#c9a84c]/10 p-3 sm:p-4 hover:border-[#c9a84c]/30 active:scale-[0.99] transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 bg-[#c9a84c]/5 flex items-center justify-center">
                {coin.obverse_image ? (
                  <img src={coin.obverse_image} alt="" className="w-full h-full object-contain" loading="lazy" />
                ) : (
                  <Coins className="w-5 h-5 text-[#c9a84c]/15" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[#f5f0e8] truncate">{coin.year} {coin.denomination}</h3>
                <p className="text-xs text-[#f5f0e8]/35 truncate">{coin.country}{coin.user_grade ? ` · ${coin.user_grade}` : ''}</p>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                <p className="text-sm font-bold text-green-400">{coin.market_value.this_coin_estimated_value}</p>
                <div className="flex items-center gap-1">
                  <TrendIcon trend={coin.market_value.price_trend} />
                  <span className="text-[11px] text-[#f5f0e8]/25">{coin.market_value.price_trend || 'N/A'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}