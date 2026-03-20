export const ENTRY_TYPE_LABELS = {
  coin: 'Coin',
  proof_set: 'Proof Set',
  mint_set: 'Mint Set',
  bullion: 'Bullion',
  roll: 'Coin Roll',
  commemorative: 'Commemorative',
  paper_currency: 'Paper Currency',
};

export const isMultiImageType = (type) =>
  ['proof_set', 'mint_set', 'bullion', 'roll', 'commemorative', 'paper_currency'].includes(type);

export const getEntryLabel = (type) => ENTRY_TYPE_LABELS[type] || 'Item';