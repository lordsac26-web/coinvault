// CoinVault data layer — Base44 entities
import { base44 } from '@/api/base44Client';

// ── Thumbnails (fire-and-forget) ──

const generateThumbnails = (coinId, obverseUrl, reverseUrl) => {
  base44.functions.invoke('generateThumbnail', {
    coinId,
    obverseUrl: obverseUrl || null,
    reverseUrl: reverseUrl || null,
  }).catch(err => console.warn('Thumbnail generation failed (non-critical):', err));
};

// ── Collections ──

export const getCollections = async () => {
  return await base44.entities.Collection.list('-created_date');
};

export const createCollection = async (data) => {
  return await base44.entities.Collection.create({
    name: data.name,
    description: data.description || '',
    type: data.type || 'Custom',
    target_goal: data.targetGoal || data.target_goal || '',
    cover_image: data.cover_image || null,
  });
};

export const updateCollection = async (id, updates) => {
  return await base44.entities.Collection.update(id, updates);
};

export const deleteCollection = async (id) => {
  const coins = await getCoinsByCollection(id);
  for (const coin of coins) {
    await base44.entities.Coin.delete(coin.id);
  }
  await base44.entities.Collection.delete(id);
};

// ── Coins ──

export const getCoins = async () => {
  return await base44.entities.Coin.list('-created_date');
};

export const getCoinsByCollection = async (collectionId) => {
  return await base44.entities.Coin.filter({ collection_id: collectionId }, '-created_date');
};

export const getCoinById = async (id) => {
  const coins = await base44.entities.Coin.filter({ id });
  return coins[0] || null;
};

export const createCoin = async (data) => {
  const existingCoins = await getCoinsByCollection(data.collectionId || data.collection_id);
  const isFirstCoin = existingCoins.length === 0;

  const obImg = data.obverseImage || data.obverse_image || null;
  const revImg = data.reverseImage || data.reverse_image || null;

  const coin = await base44.entities.Coin.create({
    collection_id: data.collectionId || data.collection_id,
    country: data.country || '',
    denomination: data.denomination || '',
    year: data.year || '',
    year_unknown: data.yearUnknown || data.year_unknown || false,
    mint_mark: data.mintMark || data.mint_mark || 'None',
    coin_series: data.coinSeries || data.coin_series || '',
    composition: data.composition || '',
    diameter: data.diameter || '',
    weight: data.weight || '',
    user_grade: data.userGrade || data.user_grade || '',
    obverse_image: obImg,
    reverse_image: revImg,
    purchase_price: data.purchasePrice || data.purchase_price || '',
    purchase_date: data.purchaseDate || data.purchase_date || '',
    where_acquired: data.whereAcquired || data.where_acquired || 'Dealer',
    condition_notes: data.conditionNotes || data.condition_notes || '',
    personal_notes: data.personalNotes || data.personal_notes || '',
    storage_location: data.storageLocation || data.storage_location || '',
    tags: data.tags || [],
    ai_grade: data.aiGrade || data.ai_grade || null,
    enrichment: data.enrichment || null,
    market_value: data.market_value || null,
  });

  if (isFirstCoin && obImg) {
    const colId = data.collectionId || data.collection_id;
    await updateCollection(colId, { cover_image: obImg });
  }

  // Generate thumbnails in the background (non-blocking)
  if (obImg || revImg) {
    generateThumbnails(coin.id, obImg, revImg);
  }

  return coin;
};

export const updateCoin = async (id, updates) => {
  return await base44.entities.Coin.update(id, updates);
};

export const deleteCoin = async (id) => {
  await base44.entities.Coin.delete(id);
};

// ── Value parsing helper ──

// Parse a value string like "$22", "$15-$25", "~$1,200", "$1.2k" into a number
export const parseEstimatedValue = (str) => {
  if (!str) return 0;
  const s = String(str).trim();
  // If it's a range like "$15-$25" or "$100 - $150", average the two ends
  const rangeMatch = s.match(/\$?\s*([\d,.]+)\s*[-–to]+\s*\$?\s*([\d,.]+)/i);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(/,/g, ''));
    const high = parseFloat(rangeMatch[2].replace(/,/g, ''));
    if (!isNaN(low) && !isNaN(high)) return (low + high) / 2;
  }
  // Handle "k" suffix like "$1.2k" → 1200
  const kMatch = s.match(/([\d,.]+)\s*k/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(/,/g, ''));
    return isNaN(val) ? 0 : val * 1000;
  }
  // Standard: strip everything except digits and decimal, take first number
  const cleaned = s.replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
};

// ── Stats ──

export const getPortfolioStats = async () => {
  const coins = await getCoins();
  const collections = await getCollections();
  const totalValue = coins.reduce((sum, c) => {
    const raw = c.market_value?.this_coin_estimated_value || c.purchase_price || '';
    return sum + parseEstimatedValue(raw);
  }, 0);
  const newest = coins.length > 0 ? coins[0] : null;
  return {
    totalCoins: coins.length,
    totalCollections: collections.length,
    estimatedValue: totalValue,
    newestCoin: newest,
  };
};

// ── Settings ──

export const getSettings = async () => {
  const settings = await base44.entities.UserSettings.list();
  if (settings.length > 0) return settings[0];
  return await base44.entities.UserSettings.create({
    currency: 'USD',
    default_country: '',
    ai_auto_enrich: true,
    price_auto_refresh: false,
  });
};

export const saveSettings = async (id, updates) => {
  return await base44.entities.UserSettings.update(id, updates);
};

// ── Export ──

export const exportAllData = async () => {
  const collections = await getCollections();
  const coins = await getCoins();
  const settings = await getSettings();
  return { collections, coins, settings, exportedAt: new Date().toISOString(), version: '2.0' };
};

export const exportToCSV = async () => {
  const coins = await getCoins();
  const headers = ['Name','Year','Mint','Denomination','Country','Grade','Composition','Weight','Diameter','Purchase Price','Purchase Date','Source','Estimated Value','Tags','Storage Location','Date Added'];
  const rows = coins.map(c => [
    `${c.year || ''} ${c.denomination || ''}`.trim(),
    c.year || '', c.mint_mark || '', c.denomination || '', c.country || '',
    c.user_grade || c.ai_grade?.suggested_grade || '', c.composition || '',
    c.weight || '', c.diameter || '', c.purchase_price || '', c.purchase_date || '',
    c.where_acquired || '', c.market_value?.this_coin_estimated_value || '',
    (c.tags || []).join('; '), c.storage_location || '', c.created_date || '',
  ]);
  return [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
};