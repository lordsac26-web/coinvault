import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Fetch market value for a single coin using AI + internet search
async function fetchCoinMarketValue(base44, coin) {
  const coinDesc = [
    coin.set_name,
    coin.country,
    coin.year,
    coin.denomination,
    coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
    coin.user_grade || (coin.ai_grade?.suggested_grade),
    coin.coin_series,
    coin.composition,
  ].filter(Boolean).join(', ');

  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a numismatic price guide expert. Search for current market values for this coin: ${coinDesc}.

Search PCGS price guide, NGC price guide, Heritage Auctions, and eBay sold listings for current pricing. Return accurate, up-to-date values.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        this_coin_estimated_value: { type: 'string', description: 'Estimated value for this specific coin in its condition, e.g. "$45"' },
        price_trend: { type: 'string', enum: ['Rising', 'Stable', 'Falling'] },
        retail_values: {
          type: 'object',
          properties: {
            by_grade: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  grade: { type: 'string' },
                  retail_low: { type: 'string' },
                  retail_high: { type: 'string' },
                },
              },
            },
          },
        },
        recent_auction_results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              grade: { type: 'string' },
              price: { type: 'string' },
              auction_house: { type: 'string' },
            },
          },
        },
        key_date_info: { type: 'string' },
        market_notes: { type: 'string' },
      },
    },
    model: 'gemini_3_flash',
  });

  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { coinIds, staleOnly } = await req.json();

    // Fetch all user coins, optionally filtered by IDs
    let coins = await base44.entities.Coin.filter({ created_by: user.email });

    if (coinIds && coinIds.length > 0) {
      coins = coins.filter(c => coinIds.includes(c.id));
    } else if (staleOnly) {
      // Only refresh coins that have no market value OR haven't been refreshed in 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      coins = coins.filter(c => !c.market_value_at || c.market_value_at < sevenDaysAgo);
    }

    if (coins.length === 0) {
      return Response.json({ updated: 0, message: 'No coins to refresh' });
    }

    // Cap at 20 coins per call to stay within time limits
    const batch = coins.slice(0, 20);
    let updated = 0;
    const errors = [];

    for (const coin of batch) {
      try {
        // Skip coins with no identifying info
        if (!coin.denomination && !coin.set_name && !coin.country) continue;

        const marketValue = await fetchCoinMarketValue(base44, coin);

        await base44.asServiceRole.entities.Coin.update(coin.id, {
          market_value: marketValue,
          market_value_at: new Date().toISOString(),
        });
        updated++;
      } catch (err) {
        errors.push({ coinId: coin.id, error: err.message });
      }
    }

    return Response.json({
      updated,
      total: batch.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});