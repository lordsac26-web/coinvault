import { useState, useEffect } from 'react';
import { getCoins, getCollections } from '@/components/storage';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#c9a84c', '#e8c97a', '#8b7355', '#d4a84c', '#f0d88c', '#a08c5c', '#bfa44e', '#9c8540'];

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

  // By country
  const countryMap = {};
  coins.forEach(c => {
    const country = c.country || 'Unknown';
    countryMap[country] = (countryMap[country] || 0) + 1;
  });
  const countryData = Object.entries(countryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

  // By decade
  const decadeMap = {};
  coins.forEach(c => {
    if (c.year && !c.year_unknown) {
      const decade = Math.floor(parseInt(c.year) / 10) * 10;
      if (!isNaN(decade)) decadeMap[`${decade}s`] = (decadeMap[`${decade}s`] || 0) + 1;
    }
  });
  const decadeData = Object.entries(decadeMap).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));

  // By composition
  const compMap = {};
  coins.forEach(c => {
    const comp = c.composition || 'Unknown';
    compMap[comp] = (compMap[comp] || 0) + 1;
  });
  const compData = Object.entries(compMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-[#e8c97a] mb-8" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Analytics</h1>

      {coins.length === 0 ? (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 text-[#c9a84c]/30 mx-auto mb-4" />
          <p className="text-[#f5f0e8]/40">Add some coins to see analytics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Country */}
          <div className="rounded-xl border border-[#c9a84c]/15 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-sm font-semibold text-[#e8c97a] mb-4">By Country</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={countryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name }) => name}>
                  {countryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1525', border: '1px solid rgba(201,168,76,0.2)', color: '#f5f0e8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* By Decade */}
          <div className="rounded-xl border border-[#c9a84c]/15 p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-sm font-semibold text-[#e8c97a] mb-4">By Decade</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={decadeData}>
                <XAxis dataKey="name" tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f1525', border: '1px solid rgba(201,168,76,0.2)', color: '#f5f0e8' }} />
                <Bar dataKey="count" fill="#c9a84c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By Composition */}
          <div className="rounded-xl border border-[#c9a84c]/15 p-5 lg:col-span-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3 className="text-sm font-semibold text-[#e8c97a] mb-4">By Composition</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={compData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'rgba(245,240,232,0.4)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f1525', border: '1px solid rgba(201,168,76,0.2)', color: '#f5f0e8' }} />
                <Bar dataKey="value" fill="#e8c97a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}