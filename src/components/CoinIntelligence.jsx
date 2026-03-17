import { useState } from 'react';
import { Loader2, RefreshCw, BookOpen, BarChart2, Layers, Palette, Clock } from 'lucide-react';
import { enrichCoin, hasApiKey } from '../lib/anthropic';
import { updateCoin } from '../lib/storage';

const tabList = [
  { key: 'history', label: 'History', icon: BookOpen },
  { key: 'mintage', label: 'Mintage', icon: BarChart2 },
  { key: 'varieties', label: 'Varieties', icon: Layers },
  { key: 'design', label: 'About the Design', icon: Palette },
];

const rarityColors = {
  'Common': 'bg-slate-500/20 text-slate-300',
  'Scarce': 'bg-blue-500/20 text-blue-300',
  'Rare': 'bg-purple-500/20 text-purple-300',
  'Very Rare': 'bg-amber-500/20 text-amber-300',
  'Extremely Rare': 'bg-red-500/20 text-red-300',
};

export default function CoinIntelligence({ coin, onUpdate }) {
  const [activeTab, setActiveTab] = useState('history');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const data = coin.enrichment;

  const fetchEnrichment = async () => {
    if (!hasApiKey()) { setError('Add your Anthropic API key in Settings to enable AI features.'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await enrichCoin({ country: coin.country, denomination: coin.denomination, year: coin.year, mintMark: coin.mintMark, series: coin.coinSeries, composition: coin.composition });
      const updated = updateCoin(coin.id, { enrichment: result, enrichedAt: new Date().toISOString() });
      onUpdate(updated);
    } catch (e) {
      setError('Enrichment failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!data && !loading) {
    return (
      <div className="rounded-2xl border border-[#c9a84c]/20 p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <BookOpen className="w-10 h-10 text-[#c9a84c]/40 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#f5f0e8]/60 mb-1">Coin Intelligence Not Yet Loaded</h3>
        <p className="text-sm text-[#f5f0e8]/30 mb-4">Fetch historical data, mintage figures, varieties, and more.</p>
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <button onClick={fetchEnrichment} className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 transition-opacity">
          Load Coin Intelligence
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#c9a84c]/20 p-12 flex flex-col items-center gap-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {/* Spinning coin animation */}
        <div className="w-16 h-16 rounded-full border-4 border-[#c9a84c]/40 border-t-[#e8c97a] animate-spin" />
        <p className="text-sm text-[#f5f0e8]/50">Researching coin history and mintage data...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#c9a84c]/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
      {/* Tabs */}
      <div className="flex border-b border-[#c9a84c]/15">
        {tabList.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeTab === key ? 'border-[#c9a84c] text-[#e8c97a]' : 'border-transparent text-[#f5f0e8]/40 hover:text-[#f5f0e8]/70'}`}>
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {activeTab === 'history' && (
          <div className="space-y-4">
            {data.coin_full_name && <h3 className="text-lg font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{data.coin_full_name}</h3>}
            {data.series_history && (
              <div>
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Series History</h4>
                <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">{data.series_history}</p>
              </div>
            )}
            {data.this_year_notes && (
              <div className="bg-[#c9a84c]/5 rounded-xl p-4 border border-[#c9a84c]/15">
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">This Year ({coin.year})</h4>
                <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">{data.this_year_notes}</p>
              </div>
            )}
            {data.historical_context && (
              <div>
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Historical Context</h4>
                <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">{data.historical_context}</p>
              </div>
            )}
            {data.fun_facts?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Fun Facts</h4>
                <ul className="space-y-2">
                  {data.fun_facts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#f5f0e8]/70">
                      <span className="text-[#c9a84c] mt-1">✦</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mintage' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {data.rarity_rating && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${rarityColors[data.rarity_rating] || rarityColors['Common']}`}>
                  {data.rarity_rating}
                </span>
              )}
              {data.key_date && <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300">Key Date</span>}
              {data.mintage_data?.total_mintage && (
                <span className="text-sm text-[#f5f0e8]/60">Total: <strong className="text-[#f5f0e8]">{data.mintage_data.total_mintage}</strong></span>
              )}
            </div>

            {data.mintage_data?.by_mint?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Mintage by Mint</h4>
                <div className="space-y-2">
                  {data.mintage_data.by_mint.map((m, i) => {
                    const val = parseInt(m.mintage?.replace(/[^0-9]/g, '')) || 0;
                    const maxVal = Math.max(...data.mintage_data.by_mint.map(x => parseInt(x.mintage?.replace(/[^0-9]/g, '')) || 0));
                    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-[#f5f0e8]/50 w-24 shrink-0">{m.mint} ({m.mint_mark || 'P'})</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] rounded-full" style={{ width: `${pct}%`, transition: 'width 0.8s ease' }} />
                        </div>
                        <span className="text-xs text-[#f5f0e8]/70 w-28 text-right shrink-0">{m.mintage}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.mintage_data?.proof_mintage && data.mintage_data.proof_mintage !== 'N/A' && (
              <div className="text-sm text-[#f5f0e8]/60">
                Proof Mintage: <strong className="text-[#f5f0e8]">{data.mintage_data.proof_mintage}</strong>
              </div>
            )}

            {data.series_years && (
              <div className="text-sm text-[#f5f0e8]/60">Series Years: <strong className="text-[#f5f0e8]">{data.series_years}</strong></div>
            )}

            {data.notable_examples && (
              <div className="bg-white/[0.03] rounded-xl p-4 border border-[#c9a84c]/10">
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Notable Examples</h4>
                <p className="text-sm text-[#f5f0e8]/70">{data.notable_examples}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'varieties' && (
          <div className="space-y-4">
            {data.known_varieties?.length > 0 ? (
              <div>
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-3">Known Varieties</h4>
                <div className="space-y-2">
                  {data.known_varieties.map((v, i) => (
                    <div key={i} className="flex items-start gap-2 py-2 px-3 bg-white/[0.03] rounded-lg border border-[#c9a84c]/10">
                      <span className="text-[#c9a84c] text-xs mt-0.5">▸</span>
                      <span className="text-sm text-[#f5f0e8]/70">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-sm text-[#f5f0e8]/40">No known varieties on record.</p>}

            {data.error_varieties?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Error Varieties</h4>
                <div className="space-y-2">
                  {data.error_varieties.map((v, i) => (
                    <div key={i} className="flex items-start gap-2 py-2 px-3 bg-amber-500/5 rounded-lg border border-amber-500/15">
                      <span className="text-amber-400 text-xs mt-0.5">⚠</span>
                      <span className="text-sm text-[#f5f0e8]/70">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'design' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {data.designer && (
                <div className="bg-white/[0.03] rounded-xl p-4 border border-[#c9a84c]/10">
                  <p className="text-xs text-[#c9a84c] font-semibold uppercase tracking-wider mb-1">Designer</p>
                  <p className="text-sm text-[#f5f0e8]">{data.designer}</p>
                </div>
              )}
              {data.engraver && (
                <div className="bg-white/[0.03] rounded-xl p-4 border border-[#c9a84c]/10">
                  <p className="text-xs text-[#c9a84c] font-semibold uppercase tracking-wider mb-1">Engraver</p>
                  <p className="text-sm text-[#f5f0e8]">{data.engraver}</p>
                </div>
              )}
            </div>
            {data.obverse_description && (
              <div>
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Obverse</h4>
                <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">{data.obverse_description}</p>
              </div>
            )}
            {data.reverse_description && (
              <div>
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Reverse</h4>
                <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">{data.reverse_description}</p>
              </div>
            )}
            {data.composition_history && (
              <div>
                <h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-2">Composition History</h4>
                <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">{data.composition_history}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#c9a84c]/10">
        {coin.enrichedAt && (
          <div className="flex items-center gap-1.5 text-xs text-[#f5f0e8]/30">
            <Clock className="w-3 h-3" />
            Last enriched: {new Date(coin.enrichedAt).toLocaleDateString()}
          </div>
        )}
        <button onClick={fetchEnrichment} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors ml-auto">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>
    </div>
  );
}