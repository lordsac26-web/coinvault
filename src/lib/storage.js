// CoinVault localStorage helpers

const KEYS = {
  COLLECTIONS: 'coinvault_collections',
  COINS: 'coinvault_coins',
  SETTINGS: 'coinvault_settings',
};

export const getSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || {
      currency: 'USD',
      defaultCountry: '',
      aiAutoEnrich: true,
      priceAutoRefresh: false,
    };
  } catch { return { currency: 'USD', defaultCountry: '', aiAutoEnrich: true, priceAutoRefresh: false }; }
};

export const saveSettings = (settings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const getCollections = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.COLLECTIONS)) || [];
  } catch { return []; }
};

export const saveCollections = (collections) => {
  localStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(collections));
};

export const createCollection = (data) => {
  const collections = getCollections();
  const newCollection = {
    id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: data.name,
    description: data.description || '',
    type: data.type || 'Custom',
    targetGoal: data.targetGoal || '',
    coverImage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  collections.push(newCollection);
  saveCollections(collections);
  return newCollection;
};

export const updateCollection = (id, updates) => {
  const collections = getCollections();
  const idx = collections.findIndex(c => c.id === id);
  if (idx !== -1) {
    collections[idx] = { ...collections[idx], ...updates, updatedAt: new Date().toISOString() };
    saveCollections(collections);
    return collections[idx];
  }
  return null;
};

export const deleteCollection = (id) => {
  const collections = getCollections().filter(c => c.id !== id);
  saveCollections(collections);
  // Also delete all coins in this collection
  const coins = getCoins().filter(c => c.collectionId !== id);
  saveCoins(coins);
};

export const getCoins = () => {
  try {
    return JSON.parse(localStorage.getItem(KEYS.COINS)) || [];
  } catch { return []; }
};

export const saveCoins = (coins) => {
  localStorage.setItem(KEYS.COINS, JSON.stringify(coins));
};

export const getCoinsByCollection = (collectionId) => {
  return getCoins().filter(c => c.collectionId === collectionId);
};

export const getCoinById = (id) => {
  return getCoins().find(c => c.id === id) || null;
};

export const createCoin = (data) => {
  const coins = getCoins();
  // Check if this is the first coin in the collection BEFORE adding
  const existingCoins = getCoinsByCollection(data.collectionId);
  const isFirstCoin = existingCoins.length === 0;

  const newCoin = {
    id: `coin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  coins.push(newCoin);
  saveCoins(coins);

  // Update collection cover if first coin with an image
  if (isFirstCoin && data.obverseImage) {
    updateCollection(data.collectionId, { coverImage: data.obverseImage });
  }

  return newCoin;
};

export const updateCoin = (id, updates) => {
  const coins = getCoins();
  const idx = coins.findIndex(c => c.id === id);
  if (idx !== -1) {
    coins[idx] = { ...coins[idx], ...updates, updatedAt: new Date().toISOString() };
    saveCoins(coins);
    return coins[idx];
  }
  return null;
};

export const deleteCoin = (id) => {
  const coins = getCoins().filter(c => c.id !== id);
  saveCoins(coins);
};

export const getPortfolioStats = () => {
  const coins = getCoins();
  const collections = getCollections();
  const totalValue = coins.reduce((sum, c) => {
    const val = parseFloat(c.marketValue?.this_coin_estimated_value?.replace(/[^0-9.]/g, '') || c.marketValue?.thisCoinsEstimatedValue?.replace(/[^0-9.]/g, '')) || parseFloat(c.purchasePrice) || 0;
    return sum + val;
  }, 0);
  const newest = [...coins].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  return {
    totalCoins: coins.length,
    totalCollections: collections.length,
    estimatedValue: totalValue,
    newestCoin: newest || null,
  };
};

export const exportAllData = () => {
  return {
    collections: getCollections(),
    coins: getCoins(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
};

export const importAllData = (data) => {
  if (!data || typeof data !== 'object') return;
  if (Array.isArray(data.collections)) saveCollections(data.collections);
  if (Array.isArray(data.coins)) saveCoins(data.coins);
  if (data.settings && typeof data.settings === 'object') saveSettings(data.settings);
};

export const exportToCSV = () => {
  const coins = getCoins();
  const headers = ['Name','Year','Mint','Denomination','Country','Grade','Composition','Weight','Diameter','Purchase Price','Purchase Date','Source','Estimated Value','Tags','Storage Location','Date Added'];
  const rows = coins.map(c => [
    `${c.year || ''} ${c.denomination || ''}`.trim(),
    c.year || '',
    c.mintMark || '',
    c.denomination || '',
    c.country || '',
    c.userGrade || c.aiGrade?.suggested_grade || '',
    c.composition || '',
    c.weight || '',
    c.diameter || '',
    c.purchasePrice || '',
    c.purchaseDate || '',
    c.whereAcquired || '',
    c.marketValue?.thisCoinsEstimatedValue || '',
    (c.tags || []).join('; '),
    c.storageLocation || '',
    c.createdAt || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  return csv;
};