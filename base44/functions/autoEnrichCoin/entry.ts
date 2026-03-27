import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// In-memory rate limiting (use Redis in production for distributed systems)
const rateLimits = new Map();

const checkAndIncrementRateLimit = (userId) => {
  const now = Math.floor(Date.now() / 60000); // Per-minute bucket
  const key = `${userId}:${now}`;
  const count = (rateLimits.get(key) || 0) + 1;
  
  if (count > 20) { // Max 20 LLM calls per user per minute
    throw new Error('Rate limit exceeded (20 LLM calls per minute)');
  }
  
  rateLimits.set(key, count);
  
  // Cleanup old entries to prevent memory leak
  if (rateLimits.size > 10000) {
    const cutoff = now - 5;
    for (const k of rateLimits.keys()) {
      const bucketTime = parseInt(k.split(':')[1]);
      if (bucketTime < cutoff) {
        rateLimits.delete(k);
      }
    }
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ═══════════════════════════════════════════════════════════════
    // ✅ SECURITY FIX #1: Verify user is authenticated
    // ═══════════════════════════════════════════════════════════════
    const user = base44.user;
    if (!user?.id) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body;
    try { body = await req.json(); } catch (e) { body = {}; }

    // Support both direct calls and entity automation triggers
    const coinId = body.coinId || body.event?.entity_id;
    const step = body.step || 'grade';
    
    if (!coinId) {
      return Response.json({ error: 'No coinId provided' }, { status: 400 });
    }

    console.log(`[autoEnrich] user=${user.id} coinId=${coinId} step=${step}`);

    // ═══════════════════════════════════════════════════════════════
    // ✅ SECURITY FIX #2: Fetch coin and verify user ownership
    // ═══════════════════════════════════════════════════════════════
    let coin = body.data || null;
    if (!coin) {
      const list = await base44.asServiceRole.entities.Coin.filter({
        created_by: user.id,  // ✅ Only fetch coins owned by this user
        id: coinId
      });
      coin = list[0];
    }
    
    if (!coin) {
      // Retry once after a short delay (race condition on create)
      await new Promise(r => setTimeout(r, 3000));
      const allCoins = await base44.asServiceRole.entities.Coin.list('-created_date', 200);
      coin = allCoins.find(c => c.id === coinId && c.created_by === user.id);
    }
    
    if (!coin) {
      // ✅ SECURITY: Return generic error (don't reveal if coin exists)
      console.warn(`[SECURITY] Coin access attempt: user=${user.id} coin=${coinId} result=not_found_or_unauthorized`);
      return Response.json(
        { error: 'Coin not found or access denied' },
        { status: 403 }
      );
    }

    // ✅ SECURITY FIX #3: Double-check user ownership
    if (coin.created_by !== user.id) {
      console.warn(`[SECURITY] Unauthorized coin access: user=${user.id} coin=${coinId} owner=${coin.created_by}`);
      return Response.json(
        { error: 'Forbidden: you do not have access to this coin' },
        { status: 403 }
      );
    }

    console.log(`Found: ${coin.year} ${coin.denomination}`);

    // Helper to update coin — always use service role (automation has no user JWT)
    const updateCoin = async (updates) => {
      await base44.asServiceRole.entities.Coin.update(coinId, updates);
    };

    // ═══════════════════════════════════════════════════════════════
    // ✅ SECURITY FIX #4: Restrict chaining to automation triggers only
    // ═══════════════════════════════════════════════════════════════
    const chainNext = (nextStep) => {
      // Only allow chaining from entity automation triggers
      const isAutomation = body.event?.automation_id;
      if (!isAutomation) {
        console.warn(`[SECURITY] User attempted to chain requests: user=${user.id} coin=${coinId}`);
        return; // Silently reject - don't expose the chaining mechanism
      }
      
      base44.asServiceRole.functions.invoke('autoEnrichCoin', { 
        coinId, 
        step: nextStep,
        user_id: user.id  // Pass context for logging
      })
        .catch(e => console.error('Chain failed:', e.message));
    };

    // Helper to call LLM with rate limiting
    const callLLM = async (params) => {
      // ✅ SECURITY FIX #5: Rate limit LLM calls per user
      checkAndIncrementRateLimit(user.id);
      return await base44.asServiceRole.integrations.Core.InvokeLLM(params);
    };

    // ── Step 1: AI Grade ──
    if (step === 'grade') {
      if (coin.ai_grade) {
        console.log('Already graded, chaining to enrich.');
        chainNext('enrich');
        return Response.json({ status: 'skipped_grade' });
      }
      if (!coin.obverse_image || !coin.reverse_image) {
        console.log('Missing images, skipping grade.');
        chainNext('enrich');
        return Response.json({ status: 'no_images' });
      }

      console.log('Grading...');
      const gradeResult = await callLLM({
        prompt: `You are an expert numismatist and professional coin grader. Analyze these two coin images (obverse and reverse) and provide a detailed grading assessment. Grade using the Sheldon scale (1-70). Analyze wear patterns, luster, strike quality, and surface preservation.`,
        file_urls: [coin.obverse_image, coin.reverse_image],
        response_json_schema: {
          type: "object",
          properties: {
            suggested_grade: { type: "string" },
            grade_description: { type: "string" },
            estimated_grade_range: { type: "string" },
            confidence: { type: "number" },
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

      const updates = { ai_grade: gradeResult };
      if (!coin.user_grade && gradeResult.suggested_grade) {
        updates.user_grade = gradeResult.suggested_grade;
      }
      await updateCoin(updates);
      console.log(`Graded: ${gradeResult.suggested_grade}`);
      chainNext('enrich');
      return Response.json({ status: 'graded', grade: gradeResult.suggested_grade });
    }

    // ── Step 2: Enrichment ──
    if (step === 'enrich') {
      if (coin.enrichment) {
        console.log('Already enriched, chaining to market.');
        chainNext('market');
        return Response.json({ status: 'skipped_enrich' });
      }

      const coinDesc = [
        coin.set_name,
        coin.country,
        coin.year,
        coin.denomination,
        coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
        coin.coin_series,
        coin.composition
      ].filter(Boolean).join(', ');

      console.log('Enriching: ' + coinDesc);
      const enrichResult = await callLLM({
        prompt: `You are an expert numismatist. Research and provide detailed historical and numismatic information about this coin: ${coinDesc}. Search PCGS CoinFacts, NGC, Numista, and other authoritative coin resources.`,
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

      await updateCoin({
        enrichment: enrichResult,
        enriched_at: new Date().toISOString()
      });
      console.log('Enrichment complete.');
      chainNext('market');
      return Response.json({ status: 'enriched' });
    }

    // ── Step 3: Market Value ──
    if (step === 'market') {
      if (coin.market_value) {
        console.log('Already has market value.');
        return Response.json({ status: 'already_complete' });
      }

      const grade = coin.user_grade || coin.ai_grade?.suggested_grade || '';
      const coinDesc = [
        coin.set_name,
        coin.country,
        coin.year,
        coin.denomination,
        coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
        grade,
        coin.coin_series,
        coin.composition
      ].filter(Boolean).join(', ');

      console.log('Market value: ' + coinDesc);
      const marketResult = await callLLM({
        prompt: `You are an expert numismatic price guide. Research current market values for this coin: ${coinDesc}. Search PCGS price guide, NGC price guide, Heritage Auctions recent sales, eBay sold listings. Be specific with dollar amounts.`,
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

      await updateCoin({
        market_value: marketResult,
        market_value_at: new Date().toISOString()
      });
      console.log('Market value: ' + marketResult.this_coin_estimated_value + '. Done!');
      return Response.json({
        status: 'complete',
        value: marketResult.this_coin_estimated_value
      });
    }

    return Response.json({ error: 'Invalid step' }, { status: 400 });
  } catch (error) {
    console.error('Auto-enrich error:', error.message);
    
    // Return appropriate status code based on error type
    let statusCode = 500;
    let errorMessage = error.message;
    
    if (error.message.includes('Rate limit')) {
      statusCode = 429; // Too Many Requests
      errorMessage = 'Rate limit exceeded. Please try again later.';
    }
    
    return Response.json({ error: errorMessage }, { status: statusCode });
  }
});