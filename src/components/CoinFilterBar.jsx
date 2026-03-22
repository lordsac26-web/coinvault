import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function CoinFilterBar({ coins, collections, onFiltered, showSort = true }) {
  const [search, setSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterSeries, setFilterSeries] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterComposition, setFilterComposition] = useState('all');
  const [filterYearFrom, setFilterYearFrom] = useState('');
  const [filterYearTo, setFilterYearTo] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const countries = useMemo(() => [...new Set(coins.map(c => c.country).filter(Boolean))].sort(), [coins]);
  const series = useMemo(() => [...new Set(coins.map(c => c.coin_series).filter(Boolean))].sort(), [coins]);
  const grades = useMemo(() => [...new Set(coins.map(c => c.user_grade || (c.ai_grade?.suggested_grade)).filter(Boolean))].sort(), [coins]);
  const compositions = useMemo(() => [...new Set(coins.map(c => c.composition).filter(Boolean))].sort(), [coins]);

  const activeFilterCount = [
    filterCountry !== 'all', filterSeries !== 'all', filterGrade !== 'all',
    filterComposition !== 'all', filterYearFrom, filterYearTo,
  ].filter(Boolean).length;

  // Apply filters and pass results up
  useMemo(() => {
    const q = search.toLowerCase();
    let result = coins.filter(c => {
      const col = collections?.find(col => col.id === c.collection_id);
      const text = [c.country, c.denomination, c.year, c.coin_series, c.composition, c.mint_mark, c.personal_notes, c.set_name, col?.name]
        .filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !q || text.includes(q);
      const matchesCountry = filterCountry === 'all' || c.country === filterCountry;
      const matchesSeries = filterSeries === 'all' || c.coin_series === filterSeries;
      const gradeVal = c.user_grade || c.ai_grade?.suggested_grade;
      const matchesGrade = filterGrade === 'all' || gradeVal === filterGrade;
      const matchesComp = filterComposition === 'all' || c.composition === filterComposition;
      const yearNum = parseInt(c.year) || 0;
      const matchesYearFrom = !filterYearFrom || yearNum >= parseInt(filterYearFrom);
      const matchesYearTo = !filterYearTo || yearNum <= parseInt(filterYearTo);
      return matchesSearch && matchesCountry && matchesSeries && matchesGrade && matchesComp && matchesYearFrom && matchesYearTo;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === 'year') return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
      if (sortBy === 'year_desc') return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
      if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '');
      if (sortBy === 'value') {
        const va = parseFloat(String(a.market_value?.this_coin_estimated_value || '0').replace(/[^0-9.]/g, '')) || 0;
        const vb = parseFloat(String(b.market_value?.this_coin_estimated_value || '0').replace(/[^0-9.]/g, '')) || 0;
        return vb - va;
      }
      return 0;
    });

    onFiltered(result, { search, activeFilterCount });
  }, [coins, collections, search, filterCountry, filterSeries, filterGrade, filterComposition, filterYearFrom, filterYearTo, sortBy]);

  const clearAll = () => {
    setSearch('');
    setFilterCountry('all');
    setFilterSeries('all');
    setFilterGrade('all');
    setFilterComposition('all');
    setFilterYearFrom('');
    setFilterYearTo('');
    setSortBy('newest');
  };

  const selectStyle = {
    background: 'var(--cv-input-bg)',
    border: '1px solid var(--cv-accent-border)',
    color: 'var(--cv-text)',
  };

  const dropdownStyle = {
    background: 'var(--cv-bg-elevated)',
    border: '1px solid var(--cv-accent-border)',
  };

  return (
    <div className="space-y-3 mb-5">
      {/* Main row: search + toggle + sort */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--cv-text-faint)' }} />
          <Input
            placeholder="Search coins, notes, series..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
            style={selectStyle}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cv-text-faint)' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-10 px-3 rounded-xl gap-1.5 shrink-0"
          style={{
            ...(activeFilterCount > 0
              ? { background: 'var(--cv-accent-bg)', borderColor: 'var(--cv-accent)', color: 'var(--cv-accent)' }
              : { ...selectStyle }),
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'var(--cv-accent)', color: 'var(--cv-accent-text)' }}>
              {activeFilterCount}
            </span>
          )}
        </Button>

        {showSort && (
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-28 sm:w-36 h-10 rounded-xl text-sm shrink-0" style={selectStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={dropdownStyle}>
              {[['newest', 'Newest'], ['oldest', 'Oldest'], ['year', 'Year ↑'], ['year_desc', 'Year ↓'], ['country', 'Country'], ['value', 'Value ↓']].map(([v, l]) => (
                <SelectItem key={v} value={v} style={{ color: 'var(--cv-text)' }}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: 'var(--cv-text-secondary)' }}>Advanced Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs underline" style={{ color: 'var(--cv-accent)' }}>Clear all</button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Country */}
            {countries.length > 0 && (
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger className="h-9 rounded-lg text-xs" style={selectStyle}>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent style={dropdownStyle}>
                  <SelectItem value="all" style={{ color: 'var(--cv-text)' }}>All Countries</SelectItem>
                  {countries.map(c => <SelectItem key={c} value={c} style={{ color: 'var(--cv-text)' }}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {/* Series */}
            {series.length > 0 && (
              <Select value={filterSeries} onValueChange={setFilterSeries}>
                <SelectTrigger className="h-9 rounded-lg text-xs" style={selectStyle}>
                  <SelectValue placeholder="Series" />
                </SelectTrigger>
                <SelectContent style={dropdownStyle}>
                  <SelectItem value="all" style={{ color: 'var(--cv-text)' }}>All Series</SelectItem>
                  {series.map(s => <SelectItem key={s} value={s} style={{ color: 'var(--cv-text)' }}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {/* Grade */}
            {grades.length > 0 && (
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="h-9 rounded-lg text-xs" style={selectStyle}>
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent style={dropdownStyle}>
                  <SelectItem value="all" style={{ color: 'var(--cv-text)' }}>All Grades</SelectItem>
                  {grades.map(g => <SelectItem key={g} value={g} style={{ color: 'var(--cv-text)' }}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {/* Composition */}
            {compositions.length > 0 && (
              <Select value={filterComposition} onValueChange={setFilterComposition}>
                <SelectTrigger className="h-9 rounded-lg text-xs" style={selectStyle}>
                  <SelectValue placeholder="Composition" />
                </SelectTrigger>
                <SelectContent style={dropdownStyle}>
                  <SelectItem value="all" style={{ color: 'var(--cv-text)' }}>All Compositions</SelectItem>
                  {compositions.map(c => <SelectItem key={c} value={c} style={{ color: 'var(--cv-text)' }}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Year range */}
          <div className="flex items-center gap-2">
            <span className="text-xs shrink-0" style={{ color: 'var(--cv-text-muted)' }}>Year:</span>
            <Input
              placeholder="From"
              value={filterYearFrom}
              onChange={e => setFilterYearFrom(e.target.value)}
              className="h-9 rounded-lg text-xs flex-1"
              style={selectStyle}
              type="number"
            />
            <span className="text-xs" style={{ color: 'var(--cv-text-faint)' }}>–</span>
            <Input
              placeholder="To"
              value={filterYearTo}
              onChange={e => setFilterYearTo(e.target.value)}
              className="h-9 rounded-lg text-xs flex-1"
              style={selectStyle}
              type="number"
            />
          </div>
        </div>
      )}
    </div>
  );
}