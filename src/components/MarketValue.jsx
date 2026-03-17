import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, DollarSign, AlertCircle } from 'lucide-react';
import { getMarketValue, hasApiKey } from '../lib/anthropic';
import { updateCoin } from '../lib/storage';

const trendIcon = {
  Rising: <TrendingUp className="w-4 h-4 text-green-400" />,
  Declining: <TrendingDown className="w-4 h-4 text-red-400" />,
  Stable: <Minus className="w-4 h-4 text-slate-400" />,
  Volatile: <TrendingUp className="w-4 h-4 text-amber-400" />,
};

const trendColor = {
  Rising: 'text-green-400',
  Declining: 'text-red-400',
  Stable: 'text-slate-400',
  Volatile: 'text-amber-400',
};

export default function MarketValue({ coin, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const data = coin.marketValue;

  const fetchPrices = async () => {
    if (!hasApiKey()) { setError('Add your Anthropic API key in Settings to enable AI features.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await getMarketValue({ country: coin.country, denomination: coin.denomination, year: coin.year, mintMark: coin.mintMark, userGrade: coin.userGrade, series: coin.coinSeries });
      const updated = updateCoin(coin.id, { marketValue: result, marketValueAt: new Date().toISOString() });
      onUpdate(updated);
    } catch (e) {
      setError('Price fetch failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const userGrade = coin.userGrade || '';
  const userGradeData = data?.retail_values?.by_grade?.find(g => g.grade === userGrade || g.grade.includes(userGrade.split('-')[0]));

  if (!data && !loading) {
    return (
      <div className="rounded-2xl border border-[#c9a84c]/20 p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <DollarSign className="w-10 h-10 text-[#c9a84c]/40 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#f5f0e8]/60 mb-1">Market Value Not Fetched</h3>
        <p className="text-sm text-[#f5f0e8]/30 mb-4">Get current pricing from PCGS, NGC, CDN and recent auctions.</p>
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <button onClick={fetchPrices} className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 transition-opacity">
          Fetch Market Value
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#c9a84c]/20 p-12 flex flex-col items-center gap-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="w-16 h-16 rounded-full border-4 border-[#c9a84c]/40 border-t-[#e8c97a] animate-spin" />
        <p className="text-sm text-[#f5f0e8]/50">Searching price guides and auction records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero value */}
      <div className="rounded-2xl border border-[#c9a84c]/30 p-6 text-center bg-gradient-to-br from-[#c9a84c]/10 to-transparent">
        <p className="text-xs text-[#f5f0e8]/40 uppercase tracking-wider mb-1">Estimated Value ({coin.userGrade})</p>
        <p className="text-4xl font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {data.this_coin_estimated_value || data.thisCoinsEstimatedValue || 'N/A'}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {data.price_trend && trendIcon[data.price_trend]}
          <span className={`text-sm font-medium ${data.price_trend ? trendColor[data.price_trend] : 'text-slate-400'}`}>
            {data.price_trend || 'Stable'}
          </span>
          {data.trend_note && <span className="text-xs text-[#f5f0e8]/40">— {data.trend_note}</span>}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[#f5f0e8]/40">
          {data.greysheet_bid && <span>CDN Bid: <strong className="text-[#f5f0e8]/60">{data.greysheet_bid}</strong></span>}
          {data.greysheet_ask && <span>CDN Ask: <strong className="text-[#f5f0e8]/60">{data.greysheet_ask}</strong></span>}
        </div>
      </div>

      {/* Price table */}
      {data.retail_values?.by_grade?.length > 0 && (
        <div className="rounded-2xl border border-[#c9a84c]/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-4 py-3 border-b border-[#c9a84c]/10">
            <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider">Price by Grade</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#c9a84c]/10">
                  <th className="text-left px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">Grade</th>
                  <th className="text-right px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">Low</th>
                  <th className="text-right px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">High</th>
                  <th className="text-right px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">PCGS</th>
                  <th className="text-right px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">NGC</th>
                </tr>
              </thead>
              <tbody>
                {data.retail_values.by_grade.map((row, i) => {
                  const isUserGrade = userGrade && (row.grade === userGrade || (userGradeData && row.grade === userGradeData.grade));
                  return (
                    <tr key={i} className={`border-b border-white/5 transition-colors ${isUserGrade ? 'bg-[#c9a84c]/10' : 'hover:bg-white/[0.02]'}`}>
                      <td className={`px-4 py-2.5 font-medium ${isUserGrade ? 'text-[#e8c97a]' : 'text-[#f5f0e8]/70'}`}>
                        {row.grade} {isUserGrade && <span className="text-xs text-[#c9a84c]">◀ yours</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#f5f0e8]/60">{row.retail_low}</td>
                      <td className="px-4 py-2.5 text-right text-[#f5f0e8]/60">{row.retail_high}</td>
                      <td className="px-4 py-2.5 text-right text-[#f5f0e8]/70">{row.pcgs_value}</td>
                      <td className="px-4 py-2.5 text-right text-[#f5f0e8]/70">{row.ngc_value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Auction results */}
      {data.recent_auction_results?.length > 0 && (
        <div className="rounded-2xl border border-[#c9a84c]/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="px-4 py-3 border-b border-[#c9a84c]/10">
            <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider">Recent Auction Results</h4>
          </div>
          <div className="divide-y divide-white/5">
            {data.recent_auction_results.map((r, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#f5f0e8]">{r.price}</span>
                    <span className="text-xs text-[#f5f0e8]/40">{r.grade}</span>
                  </div>
                  <div className="text-xs text-[#f5f0e8]/40">{r.auction_house} · {r.date}</div>
                  {r.notes && <div className="text-xs text-[#f5f0e8]/30 italic">{r.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources + disclaimer */}
      <div className="space-y-2">
        {data.sources_checked?.length > 0 && (
          <p className="text-xs text-[#f5f0e8]/30">Sources: {data.sources_checked.join(', ')}</p>
        )}
        <div className="flex items-start gap-1.5 text-xs text-[#f5f0e8]/30 bg-white/[0.02] rounded-lg p-3 border border-white/5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#f5f0e8]/20" />
          Prices are estimates from public sources and AI analysis. Actual value may vary. Not financial advice.
        </div>
      </div>

      {/* Update button */}
      <div className="flex items-center justify-between">
        {coin.marketValueAt && <p className="text-xs text-[#f5f0e8]/30">Updated: {new Date(coin.marketValueAt).toLocaleDateString()}</p>}
        <button onClick={fetchPrices} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors ml-auto">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Update Prices
        </button>
      </div>
    </div>
  );
}