import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collectionId } = await req.json();
    if (!collectionId) {
      return Response.json({ error: 'collectionId is required' }, { status: 400 });
    }

    // Fetch coins for this collection (RLS ensures user can only see their own)
    const coins = await base44.entities.Coin.filter({ collection_id: collectionId });

    if (coins.length === 0) {
      return Response.json({ tags: [] });
    }

    // Build a summary of all coins for the AI to analyze
    const coinSummaries = coins.map(c => ({
      year: c.year || 'Unknown',
      country: c.country || 'Unknown',
      denomination: c.denomination || '',
      composition: c.composition || '',
      grade: c.user_grade || c.ai_grade?.suggested_grade || '',
      mint_mark: c.mint_mark || '',
      series: c.coin_series || '',
      market_value: c.market_value?.this_coin_estimated_value || '',
      price_trend: c.market_value?.price_trend || '',
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert numismatist. Analyze this collection of ${coins.length} coins and suggest relevant category tags.

Coin data:
${JSON.stringify(coinSummaries, null, 2)}

Generate tags based on these categories:
- **Metal type**: e.g. "Gold", "Silver", "Copper", "Platinum", "Clad"
- **Era**: e.g. "Pre-1900", "Pre-1950", "Modern", "Ancient", "Medieval"
- **Grade quality**: e.g. "High Grade", "Mint State", "Circulated", "Proof"
- **Rarity/value**: e.g. "Key Date", "Rare", "High Value", "Budget Friendly"
- **Region**: e.g. "US Coins", "European", "World Coins", "British"
- **Type**: e.g. "Commemorative", "Bullion", "Error Coins", "Type Set"
- **Trend**: e.g. "Trending Up", "Stable Market"

Only suggest tags that genuinely apply based on the actual coin data. Be selective — suggest 3-10 tags max. Use short, clear labels.`,
      response_json_schema: {
        type: "object",
        properties: {
          tags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string", description: "Short tag label" },
                reason: { type: "string", description: "Brief reason why this tag applies" }
              }
            }
          }
        }
      },
      model: "gemini_3_flash"
    });

    return Response.json({
      tags: (result.tags || []).map(t => ({
        label: t.label,
        reason: t.reason,
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});