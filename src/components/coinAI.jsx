// CoinVault AI helpers — calls backend function to keep API key server-side
import { base44 } from '@/api/base44Client';

export const gradeCoin = async (obverseUrl, reverseUrl) => {
  const response = await base44.functions.invoke('coinAI', {
    action: 'grade',
    obverseUrl,
    reverseUrl,
  });
  return response.data.result;
};

export const enrichCoin = async (coinData) => {
  const response = await base44.functions.invoke('coinAI', {
    action: 'enrich',
    country: coinData.country,
    denomination: coinData.denomination,
    year: coinData.year,
    mintMark: coinData.mintMark || coinData.mint_mark,
    series: coinData.series || coinData.coin_series,
    composition: coinData.composition,
  });
  return response.data.result;
};

export const getMarketValue = async (coinData) => {
  const response = await base44.functions.invoke('coinAI', {
    action: 'marketValue',
    country: coinData.country,
    denomination: coinData.denomination,
    year: coinData.year,
    mintMark: coinData.mintMark || coinData.mint_mark,
    userGrade: coinData.userGrade || coinData.user_grade,
    series: coinData.series || coinData.coin_series,
  });
  return response.data.result;
};

export const hasApiKey = async () => {
  const settings = await base44.entities.UserSettings.list();
  return settings.length > 0 && !!settings[0].github_api_key;
};