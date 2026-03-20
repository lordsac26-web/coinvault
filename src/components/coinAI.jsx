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