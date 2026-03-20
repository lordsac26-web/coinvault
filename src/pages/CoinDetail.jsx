import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCoinById, updateCoin } from '@/components/storage';
import { gradeCoin, enrichCoin, getMarketValue, hasApiKey } from '@/components/coinAI';
import AIGradingCard from '@/components/AIGradingCard';
import CoinPhotoGuide from '@/components/CoinPhotoGuide';
import { ArrowLeft, Sparkles, BookOpen, DollarSign, Loader2, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CoinDetail() {
  const { id: coinId } = useParams();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(null);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [showPhotoGuide, setShowPhotoGuide] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const c = await getCoinById(coinId);
      setCoin(c);
      const keyOk = await hasApiKey();
      setApiKeyReady(keyOk);
      setLoading(false);
    };
    if (coinId) load();
  }, [coinId]);

  const handleGrade = async () => {
    if (!coin.obverse_image || !coin.reverse_image) return;
    setAiLoading('grade');
    const result = await gradeCoin(coin.obverse_image, coin.reverse_image);
    await updateCoin(coin.id, { ai_grade: result });
    setCoin({ ...coin, ai_grade: result });
    setAiLoading(null);
  };

  const handleEnrich = async () => {
    setAiLoading('enrich');
    const result = await enrichCoin(coin);
    await updateCoin(coin.id, { enrichment: result, enriched_at: new Date().toISOString() });
    setCoin({ ...coin, enrichment: result });
    setAiLoading(null);
  };

  const handleMarketValue = async () => {
    setAiLoading('market');
    const result = await getMarketValue(coin);
    await updateCoin(coin.id, { market_value: result, market_value_at: new Date().toISOString() });
    setCoin({ ...coin, market_value: result });
    setAiLoading(null);
  };

  const handleAcceptGrade = async (grade) => {
    await updateCoin(coin.id, { user_grade: grade });
    setCoin({ ...coin, user_grade: grade });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-[#c9a84c]/30 border-t-[#e8c97a] animate-spin" />
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-[#f5f0e8]/50">Coin not found.</p>
        <Link to="/dashboard" className="text-[#e8c97a] underline mt-4 inline-block">Back</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <Link to={`/collections/${coin.collection_id}`} className="inline-flex items-center gap-2 text-[#f5f0e8]/40 hover:text-[#e8c97a] active:text-[#e8c97a] mb-4 sm:mb-6 transition-colors py-1">
        <ArrowLeft className="w-4 h-4" /> Back to collection
      </Link>

      <h1 className="text-xl sm:text-2xl font-bold text-[#e8c97a] mb-5" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {coin.year} {coin.denomination} {coin.country && `(${coin.country})`}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {['obverse_image', 'reverse_image'].map(key => (
          <div key={key} className="aspect-square rounded-2xl border border-[#c9a84c]/10 overflow-hidden flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
            {coin[key] ? (
              <img src={coin[key]} alt={key.replace('_', ' ')} className="w-full h-full object-contain p-4 sm:p-6" />
            ) : (
              <div className="text-center">
                <Camera className="w-8 h-8 text-[#c9a84c]/15 mx-auto mb-2" />
                <span className="text-xs text-[#f5f0e8]/25">{key === 'obverse_image' ? 'Obverse' : 'Reverse'}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5 mb-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="text-sm font-semibold text-[#e8c97a] mb-3">Coin Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          {[
            ['Country', coin.country],
            ['Denomination', coin.denomination],
            ['Year', coin.year_unknown ? 'Unknown' : coin.year],
            ['Mint Mark', coin.mint_mark],
            ['Series', coin.coin_series],
            ['Composition', coin.composition],
            ['Weight', coin.weight],
            ['Diameter', coin.diameter],
            ['Grade', coin.user_grade],
            ['Purchase Price', coin.purchase_price ? `$${coin.purchase_price}` : ''],
            ['Purchase Date', coin.purchase_date],
            ['Acquired From', coin.where_acquired],
            ['Storage', coin.storage_location],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label}>
              <span className="text-[11px] text-[#f5f0e8]/35 uppercase tracking-wide">{label}</span>
              <p className="text-sm text-[#f5f0e8] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        {coin.personal_notes && (
          <div className="mt-4 pt-4 border-t border-[#c9a84c]/8">
            <span className="text-[11px] text-[#f5f0e8]/35 uppercase tracking-wide">Notes</span>
            <p className="text-sm text-[#f5f0e8]/65 mt-1 leading-relaxed">{coin.personal_notes}</p>
          </div>
        )}
      </div>

      {!apiKeyReady && (
        <div className="rounded-2xl border border-amber-500/15 p-4 mb-5 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.04)' }}>
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300">AI features require an API key.</p>
            <Link to="/settings" className="text-xs text-[#e8c97a] underline mt-1 inline-block">Configure in Settings</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-5">
        <Button onClick={handleGrade} disabled={!apiKeyReady || aiLoading || !coin.obverse_image || !coin.reverse_image}
          className="bg-purple-600/15 text-purple-300 border border-purple-500/25 hover:bg-purple-600/25 gap-2 h-10 rounded-xl text-sm font-medium">
          {aiLoading === 'grade' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Grade
        </Button>
        <Button onClick={handleEnrich} disabled={!apiKeyReady || aiLoading}
          className="bg-blue-600/15 text-blue-300 border border-blue-500/25 hover:bg-blue-600/25 gap-2 h-10 rounded-xl text-sm font-medium">
          {aiLoading === 'enrich' ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
          Enrich
        </Button>
        <Button onClick={handleMarketValue} disabled={!apiKeyReady || aiLoading}
          className="bg-green-600/15 text-green-300 border border-green-500/25 hover:bg-green-600/25 gap-2 h-10 rounded-xl text-sm font-medium">
          {aiLoading === 'market' ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
          Market
        </Button>
        <Button variant="ghost" onClick={() => setShowPhotoGuide(!showPhotoGuide)} className="text-[#f5f0e8]/35 hover:text-[#e8c97a] gap-2 h-10 rounded-xl text-sm">
          <Camera className="w-4 h-4" /> Tips
        </Button>
      </div>

      {showPhotoGuide && <div className="mb-5"><CoinPhotoGuide onClose={() => setShowPhotoGuide(false)} /></div>}

      <Tabs defaultValue="grading" className="space-y-3">
        <TabsList className="bg-white/5 border border-[#c9a84c]/8 rounded-xl h-10 p-1 w-full sm:w-auto">
          <TabsTrigger value="grading" className="data-[state=active]:bg-[#c9a84c]/15 data-[state=active]:text-[#e8c97a] rounded-lg text-xs sm:text-sm flex-1 sm:flex-none">Grading</TabsTrigger>
          <TabsTrigger value="enrichment" className="data-[state=active]:bg-[#c9a84c]/15 data-[state=active]:text-[#e8c97a] rounded-lg text-xs sm:text-sm flex-1 sm:flex-none">Enrichment</TabsTrigger>
          <TabsTrigger value="market" className="data-[state=active]:bg-[#c9a84c]/15 data-[state=active]:text-[#e8c97a] rounded-lg text-xs sm:text-sm flex-1 sm:flex-none">Market</TabsTrigger>
        </TabsList>

        <TabsContent value="grading">
          {coin.ai_grade ? (
            <AIGradingCard grading={coin.ai_grade} onAccept={handleAcceptGrade} userGrade={coin.user_grade} />
          ) : (
            <p className="text-sm text-[#f5f0e8]/25 py-10 text-center">No AI grading yet. Tap "AI Grade" above.</p>
          )}
        </TabsContent>

        <TabsContent value="enrichment">
          {coin.enrichment ? (
            <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-lg font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{coin.enrichment.coin_full_name}</h3>
              {coin.enrichment.series_history && <p className="text-sm text-[#f5f0e8]/65 leading-relaxed">{coin.enrichment.series_history}</p>}
              {coin.enrichment.historical_context && (
                <div>
                  <h4 className="text-[11px] font-semibold text-[#e8c97a] uppercase tracking-wider mb-1.5">Historical Context</h4>
                  <p className="text-sm text-[#f5f0e8]/65 leading-relaxed">{coin.enrichment.historical_context}</p>
                </div>
              )}
              {coin.enrichment.fun_facts?.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-[#e8c97a] uppercase tracking-wider mb-2">Fun Facts</h4>
                  <ul className="space-y-1.5">
                    {coin.enrichment.fun_facts.map((f, i) => <li key={i} className="text-sm text-[#f5f0e8]/55 leading-relaxed">• {f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#f5f0e8]/25 py-10 text-center">No enrichment data yet. Tap "Enrich" above.</p>
          )}
        </TabsContent>

        <TabsContent value="market">
          {coin.market_value ? (
            <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[11px] text-[#f5f0e8]/35 uppercase tracking-wide">Estimated Value</span>
                  <p className="text-2xl sm:text-3xl font-bold text-green-400">{coin.market_value.this_coin_estimated_value}</p>
                </div>
                {coin.market_value.price_trend && (
                  <span className={`text-xs px-2.5 py-1 rounded-lg ${coin.market_value.price_trend === 'Rising' ? 'bg-green-500/10 text-green-400' : coin.market_value.price_trend === 'Falling' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-[#f5f0e8]/50'}`}>
                    {coin.market_value.price_trend}
                  </span>
                )}
              </div>
              {coin.market_value.retail_values?.by_grade && (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#f5f0e8]/35 border-b border-[#c9a84c]/8">
                        <th className="text-left py-2.5 font-medium">Grade</th>
                        <th className="text-right py-2.5 font-medium">Low</th>
                        <th className="text-right py-2.5 font-medium">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coin.market_value.retail_values.by_grade.map((g, i) => (
                        <tr key={i} className="border-b border-[#c9a84c]/5">
                          <td className="py-2 text-[#f5f0e8]/65">{g.grade}</td>
                          <td className="py-2 text-right text-[#f5f0e8]/45">{g.retail_low}</td>
                          <td className="py-2 text-right text-[#f5f0e8]/65">{g.retail_high}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#f5f0e8]/25 py-10 text-center">No market data yet. Tap "Market" above.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}