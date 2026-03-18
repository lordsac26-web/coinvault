import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getCoinById, updateCoin } from '@/components/storage';
import { gradeCoin, enrichCoin, getMarketValue, hasApiKey } from '@/components/coinAI';
import { base44 } from '@/api/base44Client';
import AIGradingCard from '@/components/AIGradingCard';
import CoinPhotoGuide from '@/components/CoinPhotoGuide';
import { ArrowLeft, Sparkles, BookOpen, DollarSign, Loader2, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CoinDetail() {
  const { id: coinId } = useParams();
  const [coin, setCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(null); // 'grade' | 'enrich' | 'market' | null
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link to={`/collections/${coin.collection_id}`} className="inline-flex items-center gap-2 text-[#f5f0e8]/40 hover:text-[#e8c97a] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to collection
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-bold text-[#e8c97a] mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {coin.year} {coin.denomination} {coin.country && `(${coin.country})`}
      </h1>

      {/* Images */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {['obverse_image', 'reverse_image'].map(key => (
          <div key={key} className="aspect-square rounded-xl border border-[#c9a84c]/15 overflow-hidden flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
            {coin[key] ? (
              <img src={coin[key]} alt={key.replace('_', ' ')} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="text-center">
                <Camera className="w-8 h-8 text-[#c9a84c]/20 mx-auto mb-2" />
                <span className="text-xs text-[#f5f0e8]/30">{key === 'obverse_image' ? 'Obverse' : 'Reverse'}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="rounded-xl border border-[#c9a84c]/15 p-5 mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="text-sm font-semibold text-[#e8c97a] mb-3">Coin Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              <span className="text-xs text-[#f5f0e8]/40">{label}</span>
              <p className="text-sm text-[#f5f0e8]">{value}</p>
            </div>
          ))}
        </div>
        {coin.personal_notes && (
          <div className="mt-4 pt-4 border-t border-[#c9a84c]/10">
            <span className="text-xs text-[#f5f0e8]/40">Notes</span>
            <p className="text-sm text-[#f5f0e8]/70 mt-1">{coin.personal_notes}</p>
          </div>
        )}
      </div>

      {/* AI Section */}
      {!apiKeyReady && (
        <div className="rounded-xl border border-amber-500/20 p-4 mb-6 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.05)' }}>
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300">AI features require an API key.</p>
            <Link to="/settings" className="text-xs text-[#e8c97a] underline">Configure in Settings</Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={handleGrade} disabled={!apiKeyReady || aiLoading || !coin.obverse_image || !coin.reverse_image}
          className="bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 gap-2">
          {aiLoading === 'grade' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Grade
        </Button>
        <Button onClick={handleEnrich} disabled={!apiKeyReady || aiLoading}
          className="bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 gap-2">
          {aiLoading === 'enrich' ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
          Enrich Data
        </Button>
        <Button onClick={handleMarketValue} disabled={!apiKeyReady || aiLoading}
          className="bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30 gap-2">
          {aiLoading === 'market' ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
          Market Value
        </Button>
        <Button variant="ghost" onClick={() => setShowPhotoGuide(!showPhotoGuide)} className="text-[#f5f0e8]/40 hover:text-[#e8c97a] gap-2">
          <Camera className="w-4 h-4" /> Photo Tips
        </Button>
      </div>

      {showPhotoGuide && <div className="mb-6"><CoinPhotoGuide onClose={() => setShowPhotoGuide(false)} /></div>}

      {/* AI Results */}
      <Tabs defaultValue="grading" className="space-y-4">
        <TabsList className="bg-white/5 border border-[#c9a84c]/10">
          <TabsTrigger value="grading" className="data-[state=active]:bg-[#c9a84c]/20 data-[state=active]:text-[#e8c97a]">Grading</TabsTrigger>
          <TabsTrigger value="enrichment" className="data-[state=active]:bg-[#c9a84c]/20 data-[state=active]:text-[#e8c97a]">Enrichment</TabsTrigger>
          <TabsTrigger value="market" className="data-[state=active]:bg-[#c9a84c]/20 data-[state=active]:text-[#e8c97a]">Market</TabsTrigger>
        </TabsList>

        <TabsContent value="grading">
          {coin.ai_grade ? (
            <AIGradingCard grading={coin.ai_grade} onAccept={handleAcceptGrade} userGrade={coin.user_grade} />
          ) : (
            <p className="text-sm text-[#f5f0e8]/30 py-8 text-center">No AI grading yet. Click "AI Grade" above.</p>
          )}
        </TabsContent>

        <TabsContent value="enrichment">
          {coin.enrichment ? (
            <div className="rounded-xl border border-[#c9a84c]/15 p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="text-lg font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{coin.enrichment.coin_full_name}</h3>
              {coin.enrichment.series_history && <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">{coin.enrichment.series_history}</p>}
              {coin.enrichment.historical_context && (
                <div>
                  <h4 className="text-xs font-semibold text-[#e8c97a] uppercase tracking-wider mb-1">Historical Context</h4>
                  <p className="text-sm text-[#f5f0e8]/70">{coin.enrichment.historical_context}</p>
                </div>
              )}
              {coin.enrichment.fun_facts?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#e8c97a] uppercase tracking-wider mb-2">Fun Facts</h4>
                  <ul className="space-y-1">
                    {coin.enrichment.fun_facts.map((f, i) => <li key={i} className="text-sm text-[#f5f0e8]/60">• {f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#f5f0e8]/30 py-8 text-center">No enrichment data yet. Click "Enrich Data" above.</p>
          )}
        </TabsContent>

        <TabsContent value="market">
          {coin.market_value ? (
            <div className="rounded-xl border border-[#c9a84c]/15 p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <span className="text-xs text-[#f5f0e8]/40">Estimated Value</span>
                  <p className="text-3xl font-bold text-green-400">{coin.market_value.this_coin_estimated_value}</p>
                </div>
                {coin.market_value.price_trend && (
                  <span className={`text-xs px-2 py-1 rounded ${coin.market_value.price_trend === 'Rising' ? 'bg-green-500/10 text-green-400' : coin.market_value.price_trend === 'Falling' ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-[#f5f0e8]/50'}`}>
                    {coin.market_value.price_trend}
                  </span>
                )}
              </div>
              {coin.market_value.retail_values?.by_grade && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#f5f0e8]/40 border-b border-[#c9a84c]/10">
                        <th className="text-left py-2">Grade</th>
                        <th className="text-right py-2">Low</th>
                        <th className="text-right py-2">High</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coin.market_value.retail_values.by_grade.map((g, i) => (
                        <tr key={i} className="border-b border-[#c9a84c]/5">
                          <td className="py-1.5 text-[#f5f0e8]/70">{g.grade}</td>
                          <td className="py-1.5 text-right text-[#f5f0e8]/50">{g.retail_low}</td>
                          <td className="py-1.5 text-right text-[#f5f0e8]/70">{g.retail_high}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#f5f0e8]/30 py-8 text-center">No market data yet. Click "Market Value" above.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}