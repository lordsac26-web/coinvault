import { useState, useEffect } from 'react';
import { getCoins, getCollections } from '../lib/storage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';

const GOLD_PALETTE = ['#c9a84c', '#e8c97a', '#a07830', '#f5d88a', '#7a5c28', '#d4af6a', '#b8942e', '#f0c860'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#c9a84c]/30 px-3 py-2 text-xs" style={{ background: 'rgba(13,18,32,0.95)' }}>
      <p className="text-[#e8c97a] font-medium">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Analytics() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setCoins(await getCoins());
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  const gradeDist = coins.reduce((acc, c) => {
    if (c.user_grade) acc[c.user_grade] = (acc[c.user_grade] || 0) + 1;
    return acc;
  }, {});
  const gradeData = Object.entries(gradeDist).map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => { const s = g => parseInt(g.grade.replace(/[^0-9]/g, '')) || 0; return s(a) - s(b); });

  const countryDist = coins.reduce((acc, c) => {
    const country = c.country?.replace(/^\S+\s/, '') || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});
  const countryData = Object.entries(countryDist).map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 8);

  const metaDist = coins.reduce((acc, c) => {
    const m = c.composition || 'Unknown';
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const metalData = Object.entries(metaDist).map(([name, value]) => ({ name, value }));

  const sorted = [...coins].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  let running = 0;
  const portfolioData = sorted.map(c => {
    running += parseFloat(c.purchase_price) || 0;
    return { date: new Date(c.created_date).toLocaleDateString(), value: running };
  });

  const top5 = [...coins].sort((a, b) => (parseFloat(b.purchase_price) || 0) - (parseFloat(a.purchase_price) || 0)).slice(0, 5);
  const totalPaid = coins.reduce((s, c) => s + (parseFloat(c.purchase_price) || 0), 0);
  const totalEst = coins.reduce((s, c) => {
    const v = parseFloat(c.market_value?.this_coin_estimated_value?.replace(/[^0-9.]/g, '') || c.purchase_price || 0);
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  const noData = coins.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Analytics</h1>
        <p className="text-sm text-[#f5f0e8]/40 mt-1">Portfolio insights and collection intelligence</p>
      </div>

      {noData ? (
        <div className="rounded-2xl border border-[#c9a84c]/20 p-16 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <TrendingUp className="w-12 h-12 text-[#c9a84c]/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#f5f0e8]/50 mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>No data yet</h3>
          <p className="text-sm text-[#f5f0e8]/30">Add coins to see analytics</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Coins', value: coins.length },
              { label: 'Total Invested', value: `$${totalPaid.toLocaleString()}` },
              { label: 'Est. Portfolio Value', value: `$${totalEst.toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-[#c9a84c]/20 p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs text-[#f5f0e8]/40 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</p>
              </div>
            ))}
          </div>

          {portfolioData.length > 1 && (
            <div className="rounded-2xl border border-[#c9a84c]/20 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-semibold text-[#e8c97a] mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Portfolio Value Over Time</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={portfolioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#c9a84c" strokeWidth={2} dot={{ fill: '#e8c97a', r: 3 }} name="Value ($)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#c9a84c]/20 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-semibold text-[#e8c97a] mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Grade Distribution</h3>
              {gradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="grade" tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#c9a84c" radius={[3, 3, 0, 0]} name="Coins" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-[#f5f0e8]/30 text-center py-8">No graded coins yet</p>}
            </div>

            <div className="rounded-2xl border border-[#c9a84c]/20 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-semibold text-[#e8c97a] mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>By Metal / Composition</h3>
              {metalData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={160}>
                    <PieChart>
                      <Pie data={metalData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                        {metalData.map((_, i) => <Cell key={i} fill={GOLD_PALETTE[i % GOLD_PALETTE.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {metalData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: GOLD_PALETTE[i % GOLD_PALETTE.length] }} />
                        <span className="text-[#f5f0e8]/60 truncate">{d.name}</span>
                        <span className="ml-auto text-[#f5f0e8]/40">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p className="text-sm text-[#f5f0e8]/30 text-center py-8">No composition data yet</p>}
            </div>

            <div className="rounded-2xl border border-[#c9a84c]/20 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-semibold text-[#e8c97a] mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>By Country</h3>
              {countryData.length > 0 ? (
                <div className="space-y-2">
                  {countryData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-xs text-[#f5f0e8]/50 w-28 truncate shrink-0">{d.name}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(d.value / countryData[0].value) * 100}%`, background: GOLD_PALETTE[i % GOLD_PALETTE.length] }} />
                      </div>
                      <span className="text-xs text-[#f5f0e8]/40 w-4 text-right shrink-0">{d.value}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-[#f5f0e8]/30 text-center py-8">No country data yet</p>}
            </div>

            <div className="rounded-2xl border border-[#c9a84c]/20 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-sm font-semibold text-[#e8c97a] mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Top 5 Most Valuable</h3>
              <div className="space-y-3">
                {top5.map((coin, i) => (
                  <div key={coin.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-[#c9a84c]/30 text-[#e8c97a]' : 'bg-white/5 text-[#f5f0e8]/40'}`}>{i + 1}</div>
                    {coin.obverse_image && <img src={coin.obverse_image} alt="" className="w-8 h-8 rounded-full object-cover border border-[#c9a84c]/30 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#f5f0e8] truncate">{coin.year} {coin.denomination}</p>
                      <p className="text-xs text-[#f5f0e8]/40">{coin.user_grade || '\u2014'}</p>
                    </div>
                    <span className="text-sm font-medium text-[#c9a84c] shrink-0">${coin.purchase_price || '?'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}