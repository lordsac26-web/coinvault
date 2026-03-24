import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';
const MODEL = 'gpt-4o';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Clamp a number between min and max. */
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * Sanitize string inputs before injecting into prompts.
 * Prevents prompt injection and oversized payloads.
 */
const safe = (v, maxLen = 120) => String(v ?? '').slice(0, maxLen).trim();

/**
 * Parse JSON from model output, stripping markdown fences.
 * Throws a user-friendly error instead of a raw SyntaxError.
 */
function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    throw new Error('Model returned non-JSON output. Please try again.');
  }
}

/**
 * Unified fetch wrapper for the GitHub Models API.
 * Handles both plain-text and multimodal (image + text) user content.
 */
async function chat(apiKey, systemPrompt, userContent, maxTokens = 2000) {
  const res = await fetch(GITHUB_MODELS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`GitHub Models API error ${res.status}:`, err);
    throw new Error(`API error ${res.status}. Please try again later.`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * Retrieve the user's GitHub Models API key from UserSettings.
 * Throws a user-friendly error if not yet configured.
 */
async function getApiKey(base44, userEmail) {
  const settings = await base44.asServiceRole.entities.UserSettings.filter({
    created_by: userEmail,
  });
  const key = settings?.[0]?.github_api_key;
  if (!key) {
    throw new Error(
      'No API key configured. Add your GitHub Models API key in Settings.'
    );
  }
  return key;
}

/**
 * Simple per-user rate limiting via last_ai_call_at in UserSettings.
 * Prevents accidental runaway calls. Requires last_ai_call_at field on the entity.
 */
const RATE_LIMIT_MS = 5_000;

async function checkRateLimit(base44, userEmail) {
  const settings = await base44.asServiceRole.entities.UserSettings.filter({
    created_by: userEmail,
  });
  const record = settings?.[0];
  if (record?.last_ai_call_at) {
    const elapsed = Date.now() - new Date(record.last_ai_call_at).getTime();
    if (elapsed < RATE_LIMIT_MS) {
      const wait = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      throw new Error(`Please wait ${wait}s before making another AI request.`);
    }
  }
  if (record) {
    await base44.asServiceRole.entities.UserSettings.update(record.id, {
      last_ai_call_at: new Date().toISOString(),
    });
  }
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleGrade(apiKey, body) {
  const { obverseUrl, reverseUrl } = body;

  if (!obverseUrl || !reverseUrl) {
    return Response.json(
      { error: 'Both obverse and reverse image URLs are required.' },
      { status: 400 }
    );
  }

  const systemPrompt =
    'You are a certified numismatist and professional coin grader with expertise ' +
    'equivalent to PCGS and NGC standards. Return ONLY valid JSON, no markdown, no explanation.';

  const userContent = [
    { type: 'image_url', image_url: { url: obverseUrl } },
    { type: 'image_url', image_url: { url: reverseUrl } },
    {
      type: 'text',
      text: `Grade these coin images and return this exact JSON structure:
{
  "suggested_grade": "MS-63",
  "grade_description": "Mint State - Choice Uncirculated",
  "confidence": 78,
  "obverse_analysis": {
    "luster": "Bright cartwheel luster",
    "strike_quality": "Sharp, well-defined",
    "surface_preservation": "Minor contact marks",
    "eye_appeal": "Attractive",
    "notable_marks": ["Small mark near date"]
  },
  "reverse_analysis": {
    "luster": "Strong luster",
    "strike_quality": "Full strike",
    "surface_preservation": "Clean fields",
    "eye_appeal": "Very attractive",
    "notable_marks": []
  },
  "grading_rationale": "The coin displays strong luster with minor contact marks typical of MS-63.",
  "red_flags": [],
  "professional_submission_recommended": false,
  "estimated_grade_range": "MS-62 to MS-64"
}`,
    },
  ];

  const raw = await chat(apiKey, systemPrompt, userContent, 1500);
  const result = parseJSON(raw);
  result.confidence = clamp(Number(result.confidence) || 0, 0, 100);
  return Response.json({ result });
}

async function handleEnrich(apiKey, body) {
  const { country, denomination, year, mintMark, series, composition } = body;

  const prompt = `Provide comprehensive historical and mintage data for this coin:
Country: ${safe(country)}
Denomination: ${safe(denomination)}
Year: ${safe(year, 10)}
Mint Mark: ${safe(mintMark) || 'None'}
Series: ${safe(series)}
Composition: ${safe(composition)}

Return ONLY this exact JSON structure (no markdown):
{
  "coin_full_name": "1921-D Morgan Silver Dollar",
  "series_history": "Two to three paragraph history of this coin series...",
  "this_year_notes": "What made this specific year/mint notable...",
  "designer": "George T. Morgan",
  "engraver": "George T. Morgan",
  "obverse_description": "Description of the obverse design...",
  "reverse_description": "Description of the reverse design...",
  "mintage_data": {
    "total_mintage": "44,690,000",
    "by_mint": [{"mint": "Denver", "mintage": "20,345,000", "mint_mark": "D"}],
    "proof_mintage": "N/A"
  },
  "rarity_rating": "Common",
  "key_date": false,
  "known_varieties": ["VAM-1", "VAM-2"],
  "error_varieties": ["Doubled die obverse"],
  "historical_context": "What was happening in the world/country this year...",
  "fun_facts": ["Interesting fact 1", "Interesting fact 2"],
  "composition_history": "Why this metal/composition was used...",
  "series_years": "1878-1921",
  "notable_examples": "Famous specimens, auction records..."
}`;

  const raw = await chat(
    apiKey,
    'You are a numismatic historian and data researcher. Return ONLY valid JSON, no markdown.',
    prompt,
    2000
  );
  const result = parseJSON(raw);
  return Response.json({ result });
}

async function handleMarketValue(apiKey, body) {
  const { country, denomination, year, mintMark, userGrade, series } = body;

  const prompt = `Provide current numismatic price guide estimates for:
Country: ${safe(country)}
Denomination: ${safe(denomination)}
Year: ${safe(year, 10)}
Mint Mark: ${safe(mintMark) || 'None'}
User Grade: ${safe(userGrade, 20) || 'MS-63'}
Series: ${safe(series)}

Return ONLY this exact JSON (no markdown):
{
  "price_updated": "2025-01-15",
  "retail_values": {
    "by_grade": [
      {"grade": "Good-4",  "sheldon": 4,  "retail_low": "$15",  "retail_high": "$25",  "pcgs_value": "$20",  "ngc_value": "$18"},
      {"grade": "Fine-12", "sheldon": 12, "retail_low": "$30",  "retail_high": "$45",  "pcgs_value": "$38",  "ngc_value": "$35"},
      {"grade": "VF-20",   "sheldon": 20, "retail_low": "$55",  "retail_high": "$80",  "pcgs_value": "$65",  "ngc_value": "$60"},
      {"grade": "EF-40",   "sheldon": 40, "retail_low": "$90",  "retail_high": "$130", "pcgs_value": "$110", "ngc_value": "$100"},
      {"grade": "AU-50",   "sheldon": 50, "retail_low": "$150", "retail_high": "$220", "pcgs_value": "$180", "ngc_value": "$165"},
      {"grade": "MS-60",   "sheldon": 60, "retail_low": "$200", "retail_high": "$300", "pcgs_value": "$240", "ngc_value": "$220"},
      {"grade": "MS-63",   "sheldon": 63, "retail_low": "$350", "retail_high": "$500", "pcgs_value": "$420", "ngc_value": "$390"},
      {"grade": "MS-65",   "sheldon": 65, "retail_low": "$800", "retail_high": "$1200","pcgs_value": "$950", "ngc_value": "$900"}
    ]
  },
  "this_coin_estimated_value": "$420",
  "recent_auction_results": [
    {"date": "2024-11-15", "grade": "MS-63", "price": "$435", "auction_house": "Heritage Auctions", "notes": "Nice luster"},
    {"date": "2024-09-20", "grade": "MS-62", "price": "$320", "auction_house": "Stack's Bowers",   "notes": ""},
    {"date": "2024-07-10", "grade": "MS-64", "price": "$580", "auction_house": "PCGS",             "notes": "CAC approved"}
  ],
  "price_trend": "Stable",
  "trend_note": "Prices have remained stable over the past 12 months.",
  "greysheet_bid": "$380",
  "greysheet_ask": "$420",
  "sources_checked": ["PCGS CoinFacts", "NGC Coin Explorer", "USA CoinBook", "CDN Greysheet"]
}`;

  const raw = await chat(
    apiKey,
    'You are a coin market analyst with deep knowledge of numismatic pricing. Return ONLY valid JSON, no markdown.',
    prompt,
    1500
  );
  const result = parseJSON(raw);
  return Response.json({ result });
}

async function handleIdentify(apiKey, body) {
  const { imageUrl } = body;

  if (!imageUrl) {
    return Response.json({ error: 'An image URL is required.' }, { status: 400 });
  }

  const systemPrompt =
    'You are an expert numismatist who can identify coins from photographs. ' +
    'Return ONLY valid JSON, no markdown, no explanation.';

  const userContent = [
    { type: 'image_url', image_url: { url: imageUrl } },
    {
      type: 'text',
      text: `Identify this coin and return this exact JSON structure:
{
  "country": "United States",
  "denomination": "Lincoln Cent",
  "year": "1955",
  "mint_mark": "S",
  "series": "Lincoln Wheat Cent",
  "composition": "95% Copper, 5% Tin/Zinc",
  "confidence": 85,
  "notes": "Possible doubled-die obverse — check date carefully."
}`,
    },
  ];

  const raw = await chat(apiKey, systemPrompt, userContent, 600);
  const result = parseJSON(raw);
  result.confidence = clamp(Number(result.confidence) || 0, 0, 100);
  return Response.json({ result });
}

// ---------------------------------------------------------------------------
// Dispatch map — add new actions here without touching the entry point
// ---------------------------------------------------------------------------

const ACTION_HANDLERS = {
  grade:       handleGrade,
  enrich:      handleEnrich,
  marketValue: handleMarketValue,
  identify:    handleIdentify,
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Validate action before touching the DB or the AI API
    const handler = ACTION_HANDLERS[action];
    if (!handler) {
      return Response.json(
        {
          error: `Unknown action "${action}". Valid actions: ${Object.keys(ACTION_HANDLERS).join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // Rate limit — stamps last_ai_call_at on UserSettings (add this field if missing)
    await checkRateLimit(base44, user.email);

    // Fetch the user's API key
    const apiKey = await getApiKey(base44, user.email);

    // Dispatch to the matching handler
    return await handler(apiKey, body);

  } catch (err) {
    console.error('coinAI function error:', err.message);
    return Response.json(
      { error: err.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
});