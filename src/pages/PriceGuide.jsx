import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
    if (trend === 'Rising') return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (trend === 'Falling') return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-[#f5f0e8]/30" />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-[#e8c97a] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Price Guide</h1>
      <p className="text-sm text-[#f5f0e8]/40 mb-8">Market values for your collection. Run "Market Value" on each coin's detail page to populate data.</p>

      {/* Total */}
      <div className="rounded-xl border border-[#c9a84c]/15 p-5 mb-8 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <DollarSign className="w-8 h-8 text-green-400" />
        <div>
          <span className="text-xs text-[#f5f0e8]/40">Total Estimated Value</span>
          <p className="text-3xl font-bold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>${totalValue.toLocaleString()}</p>
        </div>
        <span className="text-xs text-[#f5f0e8]/30 ml-auto">{valuedCoins.length} of {coins.length} coins valued</span>
      </div>

      {valuedCoins.length === 0 ? (
        <div className="text-center py-16">
          <Coins className="w-12 h-12 text-[#c9a84c]/30 mx-auto mb-4" />
          <p className="text-[#f5f0e8]/40">No market values yet. Go to a coin's detail page and click "Market Value".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {valuedCoins.map(coin => (
            <Link key={coin.id} to={createPageUrl('CoinDetail') + '?id=' + coin.id}
              className="flex items-center gap-4 rounded-xl border border-[#c9a84c]/15 p-4 hover:border-[#c9a84c]/40 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#c9a84c]/5 flex items-center justify-center">
                {coin.obverse_image ? (
                  <img src={coin.obverse_image} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Coins className="w-5 h-5 text-[#c9a84c]/20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[#f5f0e8] truncate">{coin.year} {coin.denomination}</h3>
                <p className="text-xs text-[#f5f0e8]/40 truncate">{coin.country}{coin.user_grade ? ` · ${coin.user_grade}` : ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-green-400">{coin.market_value.this_coin_estimated_value}</p>
                <div className="flex items-center gap-1 justify-end">
                  <TrendIcon trend={coin.market_value.price_trend} />
                  <span className="text-xs text-[#f5f0e8]/30">{coin.market_value.price_trend || 'N/A'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}