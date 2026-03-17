import { useState } from 'react';
import { Loader2, DollarSign } from 'lucide-react';
import { getMarketValue, hasApiKey } from '../lib/anthropic';
import { SHELDON_GRADES, COUNTRIES } from '../lib/sampleData';

export default function PriceGuide() {
  const [form, setForm] = useState({ country: '\uD83C\uDDFA\uD83C\uDDF8 United States', denomination: '', year: '', mintMark: 'None', userGrade: 'MS-63' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFetch = async () => {
    const keyExists = await hasApiKey();
    if (!keyExists) { setError('Add your GitHub Models API key in Settings.'); return; }
    if (!form.denomination) { setError('Enter a denomination.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    const data = await getMarketValue(form);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Price Guide</h1>
        <p className="text-sm text-[#f5f0e8]/40 mt-1">AI-powered pricing from PCGS, NGC, CDN, and live auction data</p>
      </div>

      <div className="rounded-2xl border border-[#c9a84c]/20 p-6 mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <div><label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Country</label><input list="pg-countries" value={form.country} onChange={e => set('country', e.target.value)} className="w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-sm text-[#f5f0e8] focus:outline-none focus:border-[#c9a84c]/60" /><datalist id="pg-countries">{COUNTRIES.map(c => <option key={c} value={c} />)}</datalist></div>
          <div><label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Denomination *</label><input value={form.denomination} onChange={e => set('denomination', e.target.value)} placeholder="e.g. Morgan Dollar" className="w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/60" /></div>
          <div><label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Year</label><input type="number" value={form.year} onChange={e => set('year', e.target.value)} placeholder="e.g. 1921" className="w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/60" /></div>
          <div><label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Mint Mark</label><select value={form.mintMark} onChange={e => set('mintMark', e.target.value)} className="w-full bg-[#111827] border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-sm text-[#f5f0e8] focus:outline-none">{['None', 'P', 'D', 'S', 'O', 'CC', 'W'].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div><label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Your Grade</label><select value={form.userGrade} onChange={e => set('userGrade', e.target.value)} className="w-full bg-[#111827] border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-sm text-[#f5f0e8] focus:outline-none">{SHELDON_GRADES.map(g => <option key={g.grade} value={g.grade}>{g.grade}</option>)}</select></div>
          <div className="flex items-end"><button onClick={handleFetch} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}{loading ? 'Searching...' : 'Get Prices'}</button></div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {loading && (
        <div className="rounded-2xl border border-[#c9a84c]/20 p-12 flex flex-col items-center gap-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-16 h-16 rounded-full border-4 border-[#c9a84c]/40 border-t-[#e8c97a] animate-spin" />
          <p className="text-sm text-[#f5f0e8]/50">Searching price guides and auction records...</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#c9a84c]/30 p-6 text-center bg-gradient-to-br from-[#c9a84c]/10 to-transparent">
            <p className="text-xs text-[#f5f0e8]/40 uppercase tracking-wider mb-1">Estimated Value ({form.userGrade})</p>
            <p className="text-4xl font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{result.this_coin_estimated_value || 'N/A'}</p>
          </div>

          {result.retail_values?.by_grade?.length > 0 && (
            <div className="rounded-2xl border border-[#c9a84c]/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="px-4 py-3 border-b border-[#c9a84c]/10"><h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider">Price by Grade</h4></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[#c9a84c]/10">
                    <th className="text-left px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">Grade</th>
                    <th className="text-right px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">Retail Low</th>
                    <th className="text-right px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">Retail High</th>
                    <th className="text-right px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">PCGS</th>
                    <th className="text-right px-4 py-2 text-xs text-[#f5f0e8]/40 font-medium">NGC</th>
                  </tr></thead>
                  <tbody>
                    {result.retail_values.by_grade.map((row, i) => (
                      <tr key={i} className={`border-b border-white/5 ${row.grade === form.userGrade ? 'bg-[#c9a84c]/10' : 'hover:bg-white/[0.02]'}`}>
                        <td className={`px-4 py-2.5 font-medium ${row.grade === form.userGrade ? 'text-[#e8c97a]' : 'text-[#f5f0e8]/70'}`}>{row.grade} {row.grade === form.userGrade && <span className="text-xs text-[#c9a84c]">&laquo;</span>}</td>
                        <td className="px-4 py-2.5 text-right text-[#f5f0e8]/60">{row.retail_low}</td>
                        <td className="px-4 py-2.5 text-right text-[#f5f0e8]/60">{row.retail_high}</td>
                        <td className="px-4 py-2.5 text-right text-[#f5f0e8]/70">{row.pcgs_value}</td>
                        <td className="px-4 py-2.5 text-right text-[#f5f0e8]/70">{row.ngc_value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.recent_auction_results?.length > 0 && (
            <div className="rounded-2xl border border-[#c9a84c]/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="px-4 py-3 border-b border-[#c9a84c]/10"><h4 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider">Recent Auction Results</h4></div>
              <div className="divide-y divide-white/5">
                {result.recent_auction_results.map((r, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2"><span className="text-sm font-medium text-[#f5f0e8]">{r.price}</span><span className="text-xs text-[#f5f0e8]/40">{r.grade}</span></div>
                      <div className="text-xs text-[#f5f0e8]/40">{r.auction_house} &middot; {r.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-[#f5f0e8]/30 text-center">Prices are estimates from public sources and AI analysis. Not financial advice.</p>
        </div>
      )}
    </div>
  );
}