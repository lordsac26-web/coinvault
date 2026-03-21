import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct calls and entity automation triggers
    const coinId = body.coinId || body.event?.entity_id;
    const step = body.step || 'grade'; // grade → enrich → market
    if (!coinId) {
      return Response.json({ error: 'No coinId provided' }, { status: 400 });
    }

    // Fetch the coin
    console.log(`Fetching coin ${coinId}, step=${step}`);
    let coin;
    try {
      coin = await base44.asServiceRole.entities.Coin.get(coinId);
    } catch (e) {
      console.log(`get() failed: ${e.message}, trying list...`);
      // Fallback: list all and find
      const allCoins = await base44.asServiceRole.entities.Coin.list();
      console.log(`Listed ${allCoins.length} coins`);
      coin = allCoins.find(c => c.id === coinId);
    }
    if (!coin) {
      return Response.json({ error: 'Coin not found' }, { status: 404 });
    }
    console.log(`Found coin: ${coin.year} ${coin.denomination}`);

    // ── Step 1: AI Grade ──
    if (step === 'grade') {
      if (coin.ai_grade) {
        console.log(`Coin ${coinId} already graded, moving to enrich.`);
        // Chain to next step
        base44.asServiceRole.functions.invoke('autoEnrichCoin', { coinId, step: 'enrich' }).catch(e => console.error('Chain error:', e));
        return Response.json({ status: 'skipped_grade', next: 'enrich' });
      }
      if (!coin.obverse_image || !coin.reverse_image) {
        console.log(`Coin ${coinId} missing images, skipping grade, moving to enrich.`);
        base44.asServiceRole.functions.invoke('autoEnrichCoin', { coinId, step: 'enrich' }).catch(e => console.error('Chain error:', e));
        return Response.json({ status: 'no_images', next: 'enrich' });
      }

      console.log(`Grading coin ${coinId}...`);
      const gradeResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert numismatist and professional coin grader. Analyze these two coin images (obverse and reverse) and provide a detailed grading assessment.
Grade using the Sheldon scale (1-70). Analyze wear patterns, luster, strike quality, and surface preservation.`,
        file_urls: [coin.obverse_image, coin.reverse_image],
        response_json_schema: {
          type: "object",
          properties: {
            suggested_grade: { type: "string", description: "Sheldon scale grade like VF-30, MS-65" },
            grade_description: { type: "string" },
            estimated_grade_range: { type: "string" },
            confidence: { type: "number" },
            obverse_analysis: {
              type: "object",
              properties: {
                wear_level: { type: "string" }, luster: { type: "string" },
                strike_quality: { type: "string" }, surface_preservation: { type: "string" },
                notable_marks: { type: "array", items: { type: "string" } }
              }
            },
            reverse_analysis: {
              type: "object",
              properties: {
                wear_level: { type: "string" }, luster: { type: "string" },
                strike_quality: { type: "string" }, surface_preservation: { type: "string" },
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

      const updates = { ai_grade: gradeResult };
      // Auto-accept grade
      if (!coin.user_grade && gradeResult.suggested_grade) {
        updates.user_grade = gradeResult.suggested_grade;
      }
      await base44.asServiceRole.entities.Coin.update(coinId, updates);
      console.log(`Grade complete: ${gradeResult.suggested_grade}. Chaining to enrich.`);

      // Chain to next step (fire-and-forget)
      base44.asServiceRole.functions.invoke('autoEnrichCoin', { coinId, step: 'enrich' }).catch(e => console.error('Chain error:', e));
      return Response.json({ status: 'graded', grade: gradeResult.suggested_grade, next: 'enrich' });
    }

    // ── Step 2: Enrichment ──
    if (step === 'enrich') {
      if (coin.enrichment) {
        console.log(`Coin ${coinId} already enriched, moving to market.`);
        base44.asServiceRole.functions.invoke('autoEnrichCoin', { coinId, step: 'market' }).catch(e => console.error('Chain error:', e));
        return Response.json({ status: 'skipped_enrich', next: 'market' });
      }

      const coinDesc = [
        coin.set_name, coin.country, coin.year, coin.denomination,
        coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
        coin.coin_series, coin.composition,
      ].filter(Boolean).join(', ');

      console.log(`Enriching coin ${coinId}: ${coinDesc}`);
      const enrichResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert numismatist. Research and provide detailed historical and numismatic information about this coin: ${coinDesc}.
Search PCGS CoinFacts, NGC, Numista, and other authoritative coin resources.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            coin_full_name: { type: "string" }, designer: { type: "string" },
            mintage: { type: "string" }, series_history: { type: "string" },
            historical_context: { type: "string" }, obverse_description: { type: "string" },
            reverse_description: { type: "string" }, edge_description: { type: "string" },
            known_varieties: { type: "array", items: { type: "string" } },
            fun_facts: { type: "array", items: { type: "string" } },
            collector_notes: { type: "string" }
          }
        },
        model: "gemini_3_flash"
      });

      await base44.asServiceRole.entities.Coin.update(coinId, {
        enrichment: enrichResult,
        enriched_at: new Date().toISOString(),
      });
      console.log(`Enrichment complete. Chaining to market.`);

      base44.asServiceRole.functions.invoke('autoEnrichCoin', { coinId, step: 'market' }).catch(e => console.error('Chain error:', e));
      return Response.json({ status: 'enriched', next: 'market' });
    }

    // ── Step 3: Market Value ──
    if (step === 'market') {
      if (coin.market_value) {
        console.log(`Coin ${coinId} already has market value, done.`);
        return Response.json({ status: 'already_complete' });
      }

      const grade = coin.user_grade || coin.ai_grade?.suggested_grade || '';
      const coinDesc = [
        coin.set_name, coin.country, coin.year, coin.denomination,
        coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
        grade, coin.coin_series, coin.composition,
      ].filter(Boolean).join(', ');

      console.log(`Getting market value for coin ${coinId}: ${coinDesc}`);
      const marketResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are an expert numismatic price guide. Research current market values for this coin: ${coinDesc}.
Search PCGS price guide, NGC price guide, Heritage Auctions recent sales, eBay sold listings. Be specific with dollar amounts.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            this_coin_estimated_value: { type: "string" },
            price_trend: { type: "string", enum: ["Rising", "Stable", "Falling"] },
            retail_values: {
              type: "object",
              properties: {
                by_grade: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { grade: { type: "string" }, retail_low: { type: "string" }, retail_high: { type: "string" } }
                  }
                }
              }
            },
            recent_auction_results: {
              type: "array",
              items: {
                type: "object",
                properties: { date: { type: "string" }, grade: { type: "string" }, price: { type: "string" }, auction_house: { type: "string" } }
              }
            },
            key_date_info: { type: "string" },
            market_notes: { type: "string" }
          }
        },
        model: "gemini_3_flash"
      });

      await base44.asServiceRole.entities.Coin.update(coinId, {
        market_value: marketResult,
        market_value_at: new Date().toISOString(),
      });
      console.log(`Market value complete: ${marketResult.this_coin_estimated_value}. All done!`);
      return Response.json({ status: 'complete', value: marketResult.this_coin_estimated_value });
    }

    return Response.json({ error: 'Invalid step' }, { status: 400 });
  } catch (error) {
    console.error('Auto-enrich failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});