import { useState, useEffect } from 'react';
import { getCoins, getCollections } from '@/components/storage';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#c9a84c', '#e8c97a', '#8b7355', '#d4a84c', '#f0d88c', '#a08c5c', '#bfa44e', '#9c8540'];
const tooltipStyle = { background: '#0f1525', border: '1px solid rgba(201,168,76,0.15)', color: '#f5f0e8', borderRadius: '12px', fontSize: '12px' };

export default function Analytics() {
  const [coins, setCoins] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [c, cols] = await Promise.all([getCoins(), getCollections()]);
      setCoins(c);
      setCollections(cols);
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

  const countryMap = {};
  coins.forEach(c => { countryMap[c.country || 'Unknown'] = (countryMap[c.country || 'Unknown'] || 0) + 1; });
  const countryData = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const decadeMap = {};
  coins.forEach(c => {
    if (c.year && !c.year_unknown) {
      const decade = Math.floor(parseInt(c.year) / 10) * 10;
      if (!isNaN(decade)) decadeMap[`${decade}s`] = (decadeMap[`${decade}s`] || 0) + 1;
    }
  });
  const decadeData = Object.entries(decadeMap).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));

  const compMap = {};
  coins.forEach(c => { compMap[c.composition || 'Unknown'] = (compMap[c.composition || 'Unknown'] || 0) + 1; });
  const compData = Object.entries(compMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-[#e8c97a] mb-5 sm:mb-8" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Analytics</h1>

      {coins.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-full bg-[#c9a84c]/5 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7 text-[#c9a84c]/20" />
          </div>
          <p className="text-[#f5f0e8]/35 text-sm">Add some coins to see analytics</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* By Country */}
          <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-xs font-semibold text-[#e8c97a] uppercase tracking-wider mb-4">By Country</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={countryData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({ name }) => name} labelLine={false}>
                  {countryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* By Decade */}
          <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-xs font-semibold text-[#e8c97a] uppercase tracking-wider mb-4">By Decade</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={decadeData}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(245,240,232,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(245,240,232,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#c9a84c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By Composition */}
          <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5 lg:col-span-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-xs font-semibold text-[#e8c97a] uppercase tracking-wider mb-4">By Composition</h3>
            <ResponsiveContainer width="100%" height={Math.max(180, compData.length * 32)}>
              <BarChart data={compData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'rgba(245,240,232,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'rgba(245,240,232,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#e8c97a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}