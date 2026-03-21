import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct calls and entity automation triggers
    const coinId = body.coinId || body.event?.entity_id;
    if (!coinId) {
      return Response.json({ error: 'No coinId provided' }, { status: 400 });
    }

    // Fetch the coin
    const coins = await base44.asServiceRole.entities.Coin.filter({ id: coinId });
    const coin = coins[0];
    if (!coin) {
      return Response.json({ error: 'Coin not found' }, { status: 404 });
    }

    // Skip if already fully processed (all 3 fields populated)
    if (coin.ai_grade && coin.enrichment && coin.market_value) {
      console.log(`Coin ${coinId} already fully enriched, skipping.`);
      return Response.json({ status: 'already_enriched' });
    }

    const updates = {};

    // ── Step 1: AI Grade (needs both images) ──
    if (!coin.ai_grade && coin.obverse_image && coin.reverse_image) {
      console.log(`Grading coin ${coinId}...`);
      const gradeResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert numismatist and professional coin grader. Analyze these two coin images (obverse and reverse) and provide a detailed grading assessment.
Grade using the Sheldon scale (1-70). Analyze wear patterns, luster, strike quality, and surface preservation.
Provide your analysis in the exact JSON structure below. Be thorough but concise.`,
        file_urls: [coin.obverse_image, coin.reverse_image],
        response_json_schema: {
          type: "object",
          properties: {
            suggested_grade: { type: "string", description: "Sheldon scale grade like VF-30, MS-65, etc." },
            grade_description: { type: "string", description: "Brief description like 'Choice Very Fine'" },
            estimated_grade_range: { type: "string", description: "Range like 'VF-25 to VF-35'" },
            confidence: { type: "number", description: "Confidence percentage 0-100" },
            obverse_analysis: {
              type: "object",
              properties: {
                wear_level: { type: "string" },
                luster: { type: "string" },
                strike_quality: { type: "string" },
                surface_preservation: { type: "string" },
                notable_marks: { type: "array", items: { type: "string" } }
              }
            },
            reverse_analysis: {
              type: "object",
              properties: {
                wear_level: { type: "string" },
                luster: { type: "string" },
                strike_quality: { type: "string" },
                surface_preservation: { type: "string" },
                notable_marks: { type: "array", items: { type: "string" } }
              }
            },
            grading_rationale: { type: "string" },
            red_flags: { type: "array", items: { type: "string" } },
            professional_submission_recommended: { type: "boolean" }
          }
        },
        model: "gemini_3_flash"
      });
      updates.ai_grade = gradeResult;
      // Auto-accept: set user_grade to AI suggested grade if user hasn't set one
      if (!coin.user_grade && gradeResult.suggested_grade) {
        updates.user_grade = gradeResult.suggested_grade;
      }
      console.log(`Grade complete: ${gradeResult.suggested_grade}`);
    }

    // ── Step 2: Enrichment ──
    if (!coin.enrichment) {
      const coinDesc = [
        coin.set_name, coin.country, coin.year, coin.denomination,
        coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
        coin.coin_series, coin.composition,
        coin.entry_type && coin.entry_type !== 'coin' ? `Type: ${coin.entry_type.replace('_', ' ')}` : '',
      ].filter(Boolean).join(', ');

      console.log(`Enriching coin ${coinId}...`);
      const enrichResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert numismatist. Research and provide detailed historical and numismatic information about this coin: ${coinDesc}.
Search for information from numismatic databases, PCGS CoinFacts, NGC, Numista, and other authoritative coin resources. Provide accurate mintage figures, designer information, and historical context.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            coin_full_name: { type: "string" },
            designer: { type: "string" },
            mintage: { type: "string" },
            series_history: { type: "string" },
            historical_context: { type: "string" },
            obverse_description: { type: "string" },
            reverse_description: { type: "string" },
            edge_description: { type: "string" },
            known_varieties: { type: "array", items: { type: "string" } },
            fun_facts: { type: "array", items: { type: "string" } },
            collector_notes: { type: "string" }
          }
        },
        model: "gemini_3_flash"
      });
      updates.enrichment = enrichResult;
      updates.enriched_at = new Date().toISOString();
      console.log(`Enrichment complete.`);
    }

    // ── Step 3: Market Value ──
    if (!coin.market_value) {
      // Use the grade we just set (or existing grade) for better value estimate
      const grade = updates.user_grade || coin.user_grade || updates.ai_grade?.suggested_grade || coin.ai_grade?.suggested_grade || '';
      const coinDesc = [
        coin.set_name, coin.country, coin.year, coin.denomination,
        coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
        grade, coin.coin_series, coin.composition,
        coin.entry_type && coin.entry_type !== 'coin' ? `Type: ${coin.entry_type.replace('_', ' ')}` : '',
      ].filter(Boolean).join(', ');

      console.log(`Getting market value for coin ${coinId}...`);
      const marketResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert numismatic price guide. Research current market values for this coin: ${coinDesc}.
Search PCGS price guide, NGC price guide, Heritage Auctions recent sales, eBay sold listings, and other numismatic marketplaces for current pricing data. Provide retail values across multiple grades, recent auction results, and market trends.
Be specific with dollar amounts. Use recent real-world data.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            this_coin_estimated_value: { type: "string", description: "Estimated value for this specific coin in its grade" },
            price_trend: { type: "string", enum: ["Rising", "Stable", "Falling"] },
            retail_values: {
              type: "object",
              properties: {
                by_grade: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      grade: { type: "string" },
                      retail_low: { type: "string" },
                      retail_high: { type: "string" }
                    }
                  }
                }
              }
            },
            recent_auction_results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  grade: { type: "string" },
                  price: { type: "string" },
                  auction_house: { type: "string" }
                }
              }
            },
            key_date_info: { type: "string" },
            market_notes: { type: "string" }
          }
        },
        model: "gemini_3_flash"
      });
      updates.market_value = marketResult;
      updates.market_value_at = new Date().toISOString();
      console.log(`Market value complete: ${marketResult.this_coin_estimated_value}`);
    }

    // Save all updates at once
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Coin.update(coinId, updates);
      console.log(`Coin ${coinId} updated with ${Object.keys(updates).length} fields.`);
    }

    return Response.json({
      status: 'success',
      coinId,
      fieldsUpdated: Object.keys(updates),
    });
  } catch (error) {
    console.error('Auto-enrich failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});