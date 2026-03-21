import { useState, useEffect, useMemo } from 'react';
import { getCoins, getCollections } from '@/components/storage';
import { BookOpen, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { PageLoader } from './Dashboard';
import AlbumSeriesRow from '@/components/album/AlbumSeriesRow';

// Well-known US coin series with year ranges and mint marks
const KNOWN_SERIES = {
  'Lincoln Wheat Cent': { range: [1909, 1958], mints: ['P', 'D', 'S'] },
  'Lincoln Memorial Cent': { range: [1959, 2008], mints: ['P', 'D', 'S'] },
  'Lincoln Shield Cent': { range: [2010, 2025], mints: ['P', 'D'] },
  'Jefferson Nickel': { range: [1938, 2025], mints: ['P', 'D', 'S'] },
  'Buffalo Nickel': { range: [1913, 1938], mints: ['P', 'D', 'S'] },
  'Roosevelt Dime': { range: [1946, 2025], mints: ['P', 'D', 'S'] },
  'Mercury Dime': { range: [1916, 1945], mints: ['P', 'D', 'S'] },
  'Barber Dime': { range: [1892, 1916], mints: ['P', 'D', 'S', 'O'] },
  'Washington Quarter': { range: [1932, 1998], mints: ['P', 'D', 'S'] },
  'State Quarters': { range: [1999, 2008], mints: ['P', 'D', 'S'] },
  'Standing Liberty Quarter': { range: [1916, 1930], mints: ['P', 'D', 'S'] },
  'Barber Quarter': { range: [1892, 1916], mints: ['P', 'D', 'S', 'O'] },
  'Kennedy Half Dollar': { range: [1964, 2025], mints: ['P', 'D', 'S'] },
  'Walking Liberty Half Dollar': { range: [1916, 1947], mints: ['P', 'D', 'S'] },
  'Franklin Half Dollar': { range: [1948, 1963], mints: ['P', 'D', 'S'] },
  'Barber Half Dollar': { range: [1892, 1915], mints: ['P', 'D', 'S', 'O'] },
  'Morgan Dollar': { range: [1878, 1921], mints: ['P', 'D', 'S', 'O', 'CC'] },
  'Peace Dollar': { range: [1921, 1935], mints: ['P', 'D', 'S'] },
  'Eisenhower Dollar': { range: [1971, 1978], mints: ['P', 'D', 'S'] },
  'Susan B. Anthony Dollar': { range: [1979, 1999], mints: ['P', 'D', 'S'] },
  'Sacagawea Dollar': { range: [2000, 2008], mints: ['P', 'D', 'S'] },
  'American Silver Eagle': { range: [1986, 2025], mints: ['P', 'S', 'W'] },
  'Indian Head Cent': { range: [1859, 1909], mints: ['P', 'S'] },
  'Victoria Jubilee Head (1887-1892)': { range: [1887, 1892], mints: null },
};

// Normalize a mint mark to a short letter code
function normMint(m) {
  if (!m || m === 'None' || m.toLowerCase().includes('none') || m.toLowerCase().includes('philadelphia')) return 'P';
  const letter = m.match(/^([A-Z]+)/)?.[1];
  return letter || m;
}

// Try to match a coin's series to a known series template
function findKnownSeries(seriesName) {
  if (!seriesName) return null;
  const lower = seriesName.toLowerCase();
  for (const [name, data] of Object.entries(KNOWN_SERIES)) {
    if (lower.includes(name.toLowerCase()) || name.toLowerCase().includes(lower)) {
      return { name, ...data };
    }
  }
  return null;
}

export default function Album() {
  const [coins, setCoins] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCollection, setFilterCollection] = useState('all');
  const [aiSeries, setAiSeries] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [c, cols] = await Promise.all([getCoins(), getCollections()]);
      setCoins(c);
      setCollections(cols);
      setLoading(false);
    };
    load();
  }, []);

  // Only include coin-type entries (not sets, rolls, etc.)
  const filteredCoins = useMemo(() => {
    let result = coins.filter(c => !c.entry_type || c.entry_type === 'coin');
    if (filterCollection !== 'all') {
      result = result.filter(c => c.collection_id === filterCollection);
    }
    return result;
  }, [coins, filterCollection]);

  // Group coins by series
  const seriesGroups = useMemo(() => {
    const groups = {};
    for (const coin of filteredCoins) {
      const series = coin.coin_series || 'Uncategorized';
      if (!groups[series]) groups[series] = [];
      groups[series].push(coin);
    }

    // Build album data for each series
    return Object.entries(groups).map(([seriesName, seriesCoins]) => {
      const known = findKnownSeries(seriesName);

      // If we matched a known series, use its range and mints
      if (known) {
        return {
          name: seriesName,
          coins: seriesCoins,
          yearRange: known.range,
          mintMarks: known.mints,
        };
      }

      // Check AI-generated data
      if (aiSeries?.[seriesName]) {
        const ai = aiSeries[seriesName];
        return {
          name: seriesName,
          coins: seriesCoins,
          yearRange: ai.range,
          mintMarks: ai.mints,
        };
      }

      // Fallback: derive range from actual coins
      const years = seriesCoins.map(c => parseInt(c.year)).filter(y => !isNaN(y));
      if (years.length === 0) return null;
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const mints = [...new Set(seriesCoins.map(c => normMint(c.mint_mark)))].sort();

      return {
        name: seriesName,
        coins: seriesCoins,
        yearRange: [minYear, maxYear],
        mintMarks: mints.length > 1 ? mints : null,
      };
    }).filter(Boolean).sort((a, b) => a.yearRange[0] - b.yearRange[0]);
  }, [filteredCoins, aiSeries]);

  // AI-assisted series range lookup for unknown series
  const unknownSeries = useMemo(() => {
    return seriesGroups
      .filter(sg => !findKnownSeries(sg.name) && !aiSeries?.[sg.name] && sg.name !== 'Uncategorized')
      .map(sg => sg.name);
  }, [seriesGroups, aiSeries]);

  const handleAiLookup = async () => {
    if (unknownSeries.length === 0) return;
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a numismatic expert. For each of these coin series, provide the full year range they were minted and the mint marks used. Series list:\n${unknownSeries.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      response_json_schema: {
        type: "object",
        properties: {
          series: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                year_start: { type: "number" },
                year_end: { type: "number" },
                mint_marks: { type: "array", items: { type: "string" }, description: "Single letter codes like P, D, S" },
              }
            }
          }
        }
      },
      model: "gemini_3_flash"
    });
    const map = {};
    for (const s of result.series || []) {
      const matched = unknownSeries.find(n => n.toLowerCase() === s.name?.toLowerCase());
      if (matched && s.year_start && s.year_end) {
        map[matched] = {
          range: [s.year_start, s.year_end],
          mints: s.mint_marks?.length > 1 ? s.mint_marks : null,
        };
      }
    }
    setAiSeries(prev => ({ ...prev, ...map }));
    setAiLoading(false);
  };

  if (loading) return <PageLoader />;

  const totalSlots = seriesGroups.reduce((sum, sg) => {
    const mints = sg.mintMarks?.length || 1;
    return sum + (sg.yearRange[1] - sg.yearRange[0] + 1) * mints;
  }, 0);
  const filledSlots = seriesGroups.reduce((sum, sg) => sum + sg.coins.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold"
            style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Coin Album
          </h1>
          {seriesGroups.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--cv-text-muted)' }}>
              {filledSlots} of {totalSlots} slots filled across {seriesGroups.length} series
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unknownSeries.length > 0 && (
            <button
              onClick={handleAiLookup}
              disabled={aiLoading}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}
            >
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
              {aiLoading ? 'Looking up...' : `Expand ${unknownSeries.length} series`}
            </button>
          )}
          <Select value={filterCollection} onValueChange={setFilterCollection}>
            <SelectTrigger
              className="w-40 sm:w-48 h-9 rounded-xl text-sm"
              style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)' }}>
              <SelectItem value="all" style={{ color: 'var(--cv-text)' }}>All Collections</SelectItem>
              {collections.map(c => (
                <SelectItem key={c.id} value={c.id} style={{ color: 'var(--cv-text)' }}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall progress bar */}
      {seriesGroups.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium" style={{ color: 'var(--cv-text-muted)' }}>
              Overall Completion
            </span>
            <span className="text-[11px] font-bold" style={{ color: 'var(--cv-accent)' }}>
              {totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--cv-bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0}%`,
                background: 'linear-gradient(90deg, var(--cv-accent-dim), var(--cv-accent))',
              }}
            />
          </div>
        </div>
      )}

      {/* Series rows */}
      {seriesGroups.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--cv-accent-bg)' }}
          >
            <BookOpen className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>
            {coins.length === 0
              ? 'Add coins to see your album'
              : 'No coins with series information found'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--cv-text-faint)' }}>
            Coins need a "Series" field to appear in the album view
          </p>
        </div>
      ) : (
        seriesGroups.map(sg => (
          <AlbumSeriesRow
            key={sg.name}
            seriesName={sg.name}
            coins={sg.coins}
            yearRange={sg.yearRange}
            mintMarks={sg.mintMarks}
          />
        ))
      )}
    </div>
  );
}