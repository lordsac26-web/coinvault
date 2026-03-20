import { useState, useEffect } from 'react';
import { getCoins, getCollections } from '@/components/storage';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#c9a84c', '#e8c97a', '#8b7355', '#d4a84c', '#f0d88c', '#a08c5c', '#bfa44e', '#9c8540'];

export default function Analytics() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const load = async () => { const [c] = await Promise.all([getCoins(), getCollections()]); setCoins(c); setLoading(false); }; load(); }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--cv-spinner-track)', borderTopColor: 'var(--cv-spinner-head)' }} /></div>;

  const countryMap = {}; coins.forEach(c => { countryMap[c.country || 'Unknown'] = (countryMap[c.country || 'Unknown'] || 0) + 1; });
  const countryData = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const decadeMap = {}; coins.forEach(c => { if (c.year && !c.year_unknown) { const d = Math.floor(parseInt(c.year) / 10) * 10; if (!isNaN(d)) decadeMap[`${d}s`] = (decadeMap[`${d}s`] || 0) + 1; } });
  const decadeData = Object.entries(decadeMap).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  const compMap = {}; coins.forEach(c => { compMap[c.composition || 'Unknown'] = (compMap[c.composition || 'Unknown'] || 0) + 1; });
  const compData = Object.entries(compMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const tooltipStyle = { background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)', borderRadius: '12px', fontSize: '12px' };
  const tickFill = 'var(--cv-text-muted)';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-8" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>Analytics</h1>
      {coins.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--cv-accent-bg)' }}><BarChart3 className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} /></div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>Add some coins to see analytics</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-2xl p-4 sm:p-5" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--cv-accent)' }}>By Country</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart><Pie data={countryData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({ name }) => name} labelLine={false}>{countryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl p-4 sm:p-5" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--cv-accent)' }}>By Decade</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={decadeData}><XAxis dataKey="name" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="count" fill="var(--cv-accent-dim)" radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl p-4 sm:p-5 lg:col-span-2" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--cv-accent)' }}>By Composition</h3>
            <ResponsiveContainer width="100%" height={Math.max(180, compData.length * 32)}>
              <BarChart data={compData} layout="vertical"><XAxis type="number" tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" width={100} tick={{ fill: tickFill, fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" fill="var(--cv-accent)" radius={[0, 6, 6, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}