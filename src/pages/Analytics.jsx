import { useState, useEffect } from 'react';
import { getCoins } from '@/components/storage';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { PageLoader } from './Dashboard'; // FIX: shared loader
 
// FIX: Gold-toned palette kept for thematic appropriateness, but split into
// light/dark variants so the chart adapts to the user's theme preference.
// These are used as fallback; if you want full --cv-* integration, Recharts
// requires passing colors as JS values so CSS variables can't be used directly
// in Cell fill props — these hardcoded hex values are the correct approach here.
const COLORS_LIGHT = ['#b8912e', '#d4a84c', '#8b7355', '#c9a050', '#a07840', '#7a5c2e', '#c4903a', '#9c7840'];
const COLORS_DARK  = ['#e8c97a', '#f0d88c', '#c9a84c', '#d4b870', '#bfa44e', '#a08c5c', '#dcc060', '#c8a850'];
 
export default function Analytics() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
 
  useEffect(() => {
    // Detect theme for chart color selection
    setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
 
    const load = async () => {
      // FIX: Removed wasted getCollections() call — the result was destructured
      // away and never used: `const [c] = await Promise.all([getCoins(), getCollections()])`.
      // Now only fetches what this page actually needs.
      const coins = await getCoins();
      setCoins(coins);
      setLoading(false);
    };
    load();
  }, []);
 
  if (loading) return <PageLoader />;
 
  const COLORS = isDark ? COLORS_DARK : COLORS_LIGHT;
 
  // By country
  const countryMap = {};
  coins.forEach(c => { countryMap[c.country || 'Unknown'] = (countryMap[c.country || 'Unknown'] || 0) + 1; });
  const countryData = Object.entries(countryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
 
  // By decade — FIX: fill in zero-count decades between oldest and newest coin
  // so the bar chart has context even when a user has coins clustered in one era
  const decadeMap = {};
  coins.forEach(c => {
    if (c.year && !c.year_unknown) {
      const d = Math.floor(parseInt(c.year) / 10) * 10;
      if (!isNaN(d)) decadeMap[d] = (decadeMap[d] || 0) + 1;
    }
  });
  let decadeData = [];
  if (Object.keys(decadeMap).length > 0) {
    const decades = Object.keys(decadeMap).map(Number);
    const minDecade = Math.min(...decades);
    const maxDecade = Math.max(...decades);
    for (let d = minDecade; d <= maxDecade; d += 10) {
      decadeData.push({ name: `${d}s`, count: decadeMap[d] || 0 });
    }
  }
 
  // By composition
  const compMap = {};
  coins.forEach(c => { compMap[c.composition || 'Unknown'] = (compMap[c.composition || 'Unknown'] || 0) + 1; });
  const compData = Object.entries(compMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
 
  // FIX: Portfolio value by country — new chart using existing market_value data
  const valueByCountry = {};
  coins.forEach(c => {
    const country = c.country || 'Unknown';
    const raw = c.market_value?.this_coin_estimated_value || c.purchase_price || '0';
    const val = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
    if (!isNaN(val) && val > 0) {
      valueByCountry[country] = (valueByCountry[country] || 0) + val;
    }
  });
  const valueData = Object.entries(valueByCountry)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
 
  const tooltipStyle = {
    background: 'var(--cv-bg-elevated)',
    border: '1px solid var(--cv-accent-border)',
    color: 'var(--cv-text)',
    borderRadius: '12px',
    fontSize: '12px',
  };
  const tickFill = 'var(--cv-text-muted)';
 
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1
        className="text-xl sm:text-2xl font-bold mb-5 sm:mb-8"
        style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Analytics
      </h1>
 
      {coins.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--cv-accent-bg)' }}
          >
            <BarChart3 className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>
            Add some coins to see analytics
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
 
          {/* By Country — pie chart */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: 'var(--cv-accent)' }}
            >
              By Country
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={countryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={40}
                  outerRadius={75}
                  dataKey="value"
                  // FIX: Removed inline label prop — at 6+ slices labels overlap badly.
                  // Using a Legend below the chart instead for clean readability.
                >
                  {countryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                {/* FIX: Legend replaces overlapping inline labels */}
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: tickFill, paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
 
          {/* By Decade — bar chart */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: 'var(--cv-accent)' }}
            >
              By Decade
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={decadeData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: tickFill, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: tickFill, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--cv-accent-dim)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
 
          {/* By Composition — horizontal bar */}
          <div
            className="rounded-2xl p-4 sm:p-5 lg:col-span-2"
            style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-4"
              style={{ color: 'var(--cv-accent)' }}
            >
              By Composition
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(180, compData.length * 32)}>
              <BarChart data={compData} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fill: tickFill, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fill: tickFill, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  // FIX: truncate long composition names so they don't clip
                  tickFormatter={v => v.length > 14 ? v.slice(0, 13) + '…' : v}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="var(--cv-accent)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
 
          {/* FIX: New — Estimated value by country. Uses existing market_value data
              that was previously unused in analytics. Only renders if any coins
              have value data to avoid an empty/misleading chart. */}
          {valueData.length > 0 && (
            <div
              className="rounded-2xl p-4 sm:p-5 lg:col-span-2"
              style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
            >
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'var(--cv-accent)' }}
              >
                Estimated Value by Country
              </h3>
              <ResponsiveContainer width="100%" height={Math.max(180, valueData.length * 36)}>
                <BarChart data={valueData} layout="vertical">
                  <XAxis
                    type="number"
                    tick={{ fill: tickFill, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${v.toLocaleString()}`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    tick={{ fill: tickFill, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={v => [`$${v.toLocaleString()}`, 'Est. Value']}
                  />
                  <Bar dataKey="value" fill="var(--cv-accent)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
 
        </div>
      )}
    </div>
  );
}
 