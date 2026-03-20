// CoinVault AI helpers — uses Base44 built-in InvokeLLM with internet search
import { base44 } from '@/api/base44Client';

export const gradeCoin = async (obverseUrl, reverseUrl) => {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert numismatist and professional coin grader. Analyze these two coin images (obverse and reverse) and provide a detailed grading assessment.

Grade using the Sheldon scale (1-70). Analyze wear patterns, luster, strike quality, and surface preservation.

Provide your analysis in the exact JSON structure below. Be thorough but concise.`,
    file_urls: [obverseUrl, reverseUrl],
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
        grading_rationale: { type: "string", description: "Detailed explanation of the grade" },
        red_flags: { type: "array", items: { type: "string" }, description: "Any concerns like cleaning, damage, etc." },
        professional_submission_recommended: { type: "boolean" }
      }
    },
    model: "gemini_3_flash"
  });
  return result;
};

export const enrichCoin = async (coinData) => {
  const coinDesc = [
    coinData.country, coinData.year, coinData.denomination,
    coinData.mint_mark && coinData.mint_mark !== 'None' ? `Mint: ${coinData.mint_mark}` : '',
    coinData.coin_series, coinData.composition
  ].filter(Boolean).join(', ');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert numismatist. Research and provide detailed historical and numismatic information about this coin: ${coinDesc}.

Search for information from numismatic databases, PCGS CoinFacts, NGC, Numista, and other authoritative coin resources. Provide accurate mintage figures, designer information, and historical context.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        coin_full_name: { type: "string", description: "Full official name of the coin" },
        designer: { type: "string" },
        mintage: { type: "string", description: "Number minted" },
        series_history: { type: "string", description: "History of the coin series" },
        historical_context: { type: "string", description: "What was happening historically when this coin was minted" },
        obverse_description: { type: "string" },
        reverse_description: { type: "string" },
        edge_description: { type: "string" },
        known_varieties: { type: "array", items: { type: "string" } },
        fun_facts: { type: "array", items: { type: "string" } },
        collector_notes: { type: "string", description: "Tips for collectors about this specific coin" }
      }
    },
    model: "gemini_3_flash"
  });
  return result;
};

export const getMarketValue = async (coinData) => {
  const coinDesc = [
    coinData.country, coinData.year, coinData.denomination,
    coinData.mint_mark && coinData.mint_mark !== 'None' ? `Mint: ${coinData.mint_mark}` : '',
    coinData.user_grade, coinData.coin_series
  ].filter(Boolean).join(', ');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert numismatic price guide. Research current market values for this coin: ${coinDesc}.

Search PCGS price guide, NGC price guide, Heritage Auctions recent sales, eBay sold listings, and other numismatic marketplaces for current pricing data. Provide retail values across multiple grades, recent auction results, and market trends.

Be specific with dollar amounts. Use recent real-world data.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        this_coin_estimated_value: { type: "string", description: "Estimated value for this specific coin in its grade, e.g. '$125'" },
        price_trend: { type: "string", enum: ["Rising", "Stable", "Falling"], description: "Current market trend" },
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
              },
              description: "Price ranges for common grades"
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
          },
          description: "Recent notable auction sales"
        },
        key_date_info: { type: "string", description: "Is this a key date, semi-key, or common date?" },
        market_notes: { type: "string", description: "Any relevant market observations" }
      }
    },
    model: "gemini_3_flash"
  });
  return result;
};

export const analyzeItem = async (imageUrls, entryType) => {
  const typePrompts = {
    proof_set: {
      label: 'proof set',
      detail: 'This is a proof set, typically in a hard plastic/acrylic case with individually seated coins. Identify every coin/denomination included.',
    },
    mint_set: {
      label: 'mint set',
      detail: 'This is a mint set, typically in soft plastic/cellophane packaging. Identify every coin/denomination included.',
    },
    bullion: {
      label: 'bullion coin or bar',
      detail: 'This is a bullion item (gold, silver, platinum, or palladium coin/bar/round). Identify the metal, purity, weight, and mint/manufacturer.',
    },
    roll: {
      label: 'roll of coins',
      detail: 'This is a roll (or partial roll) of coins. Identify the denomination, year(s) visible, mint mark, and estimate how many coins are in the roll.',
    },
    commemorative: {
      label: 'commemorative coin or medal',
      detail: 'This is a commemorative coin or medal. Identify the event/theme it commemorates, issuing authority, and any special features.',
    },
    paper_currency: {
      label: 'paper currency / banknote',
      detail: 'This is paper currency (banknote, silver certificate, federal reserve note, etc.). Identify the denomination, series year, serial number if visible, seal color, and any notable features.',
    },
  };

  const cfg = typePrompts[entryType] || typePrompts.proof_set;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert numismatist and collectibles appraiser. Analyze these photos of a ${cfg.label}.
${cfg.detail}

Determine:
1. A descriptive name for this item
2. The year / date
3. The country of origin
4. Mint mark (if applicable)
5. Composition / material
6. Overall condition assessment
7. Individual pieces included (if it's a set or roll)
8. Estimated market value

Provide accurate details based on what you can see in the images.`,
    file_urls: imageUrls,
    response_json_schema: {
      type: "object",
      properties: {
        set_name: { type: "string", description: "Full descriptive name of the item" },
        year: { type: "string" },
        country: { type: "string" },
        mint_mark: { type: "string" },
        composition: { type: "string", description: "Material/composition (e.g. 'Silver .999', 'Clad', 'Paper')" },
        weight: { type: "string", description: "Weight if applicable (e.g. '1 oz', '31.1g')" },
        condition_notes: { type: "string", description: "Overall condition assessment" },
        coins_included: {
          type: "array",
          items: {
            type: "object",
            properties: {
              denomination: { type: "string" },
              description: { type: "string" }
            }
          },
          description: "Individual coins/items included (for sets and rolls)"
        },
        estimated_value: { type: "string", description: "Rough estimated value like '$35'" },
        notes: { type: "string", description: "Any additional observations" }
      }
    },
    model: "gemini_3_flash"
  });
  return result;
};