import { useState } from 'react';
import { FileDown, BookOpen, HelpCircle, Info, Loader2, CheckCircle, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateCoinVaultPDF } from '@/lib/docsGenerator';

const SECTIONS = [
  { id: 'about', label: 'About', icon: Info },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'guide', label: 'User Guide', icon: BookOpen },
];

const FEATURES = [
  { icon: '🗂️', title: 'Smart Collections', desc: 'Organize coins into unlimited collections by country, era, metal, series, or any custom grouping.' },
  { icon: '🤖', title: 'AI Grading', desc: 'Upload a photo and receive an instant Sheldon-scale grade with confidence metrics and detailed analysis.' },
  { icon: '📊', title: 'Market Values', desc: 'Live price lookups powered by real-time search across PCGS, NGC, eBay, and major auction houses.' },
  { icon: '📖', title: 'Coin Album', desc: 'Track completion of 1,800+ series with an interactive album spanning every major world coin type.' },
  { icon: '🔍', title: 'AI Enrichment', desc: 'One tap to fetch designer, mintage figures, historical context, and numismatic significance for any coin.' },
  { icon: '📷', title: 'Coin Identifier', desc: 'Photograph an unknown coin and let AI identify the country, denomination, year, and series instantly.' },
  { icon: '📑', title: 'PDF & CSV Export', desc: 'Export any collection as a professional PDF report or spreadsheet-ready CSV with all metadata.' },
  { icon: '🔎', title: 'Barcode Scanner', desc: 'Scan PCGS/NGC certification barcodes to look up verified slabbed coin data in seconds.' },
];

const FAQS = [
  {
    q: 'How do I add my first coin?',
    a: 'First create a Collection from the Dashboard (tap "+ New Collection"). Then open that collection and tap "Add Coin" (or "Add" on mobile). Fill in the year, denomination, and optionally upload obverse/reverse photos. The AI will auto-enrich the coin in the background once saved.'
  },
  {
    q: 'What does the AI Grading feature do?',
    a: 'AI Grading analyzes your uploaded coin photo and assigns a Sheldon scale grade (e.g. VF-25, MS-63). It identifies surface marks, luster, strike quality, and eye appeal. Open any coin, tap the "Grade" button in the AI section, and the result appears within seconds. Note: AI grades are estimates — professional certification (PCGS/NGC) is recommended for high-value coins.'
  },
  {
    q: 'How accurate are the market values?',
    a: 'Market values are fetched in real time using AI-powered search across PCGS Price Guide, NGC, eBay completed sales, and major auction records. Values are estimates based on recent transactions for coins of comparable grade and condition. Use the Price Guide page to refresh all values at once, or tap "Market" on an individual coin detail page.'
  },
  {
    q: 'Can I use the app offline or at a coin show?',
    a: 'The app is installable as a PWA (Progressive Web App). On Android, Chrome will prompt "Add to Home Screen." On iOS, use Safari > Share > Add to Home Screen. Once installed, previously loaded pages render from cache. Note: AI features, market lookups, and cloud sync require an internet connection.'
  },
  {
    q: 'What is the Coin Album?',
    a: 'The Album tracks completion progress across 1,800+ coin series — from Lincoln Cents to Morgan Dollars to world issues. Each series shows which dates/mint marks you own vs. which are missing. Navigate to the Album tab, expand any series, and slots with your coins appear filled. Overall completion percentage is shown at the top.'
  },
  {
    q: 'How do I export my collection?',
    a: 'Open any Collection, tap the Export button (top right). Choose CSV for a spreadsheet-compatible file or PDF for a formatted inventory report with coin details and optional thumbnail images. The PDF export includes a cover page, summary statistics, and a per-coin table. CSV opens directly in Excel, Google Sheets, or Numbers.'
  },
  {
    q: 'What is the Barcode Scanner?',
    a: 'The Scanner (center button on mobile nav, or open from any collection) reads PCGS and NGC certification barcodes printed on coin slabs. Point your camera at the barcode strip on a certified slab and CoinVault retrieves the official grade, variety, and certification details automatically.'
  },
  {
    q: 'How do I set up my GitHub Models API key?',
    a: 'Navigate to Settings > GitHub API Key. A free GitHub account gives you access to GitHub Models (GPT-4o and Claude) at no cost for personal use. Create a token at github.com/settings/tokens, paste it into the field, and Save. This key powers AI Grading, Enrichment, and Market lookups. Without it, the app falls back to standard AI credits.'
  },
  {
    q: 'Can I filter and search my coins?',
    a: 'Yes — both the Catalog and individual Collection views have a full-featured filter bar. Search by any text (name, country, year, notes), then use advanced filters to narrow by Country, Series, Grade, Composition, and Year Range. Sort by newest, oldest, year, country, or estimated value. Active filters are shown with a count badge.'
  },
  {
    q: 'How do I change the app theme?',
    a: 'Go to Settings > Theme. CoinVault includes multiple premium themes: Classic (dark gold), Midnight Blue, Emerald, Rose, and Light. Tap any theme to preview it live, then tap "Set as Default" to persist it across sessions. Theme affects the entire app including navigation, cards, and accent colors.'
  },
];

const GUIDE_SECTIONS = [
  {
    title: '1. Getting Started',
    platform: 'both',
    steps: [
      { heading: 'Installing the App', body: 'Desktop: Access CoinVault directly in your browser at any time. Mobile: In Chrome (Android) or Safari (iOS), navigate to the app URL. Android shows an "Add to Home Screen" banner automatically. iOS: tap the Share icon then "Add to Home Screen." The app installs with its own icon, launches full-screen, and works without a browser toolbar.', tip: null },
      { heading: 'Creating Your First Collection', body: 'Navigate to the Dashboard (Collections tab on mobile). Tap "+ New Collection" or "+ New." Enter a name, optional description, and choose a collection type (By Country, By Era, By Series, By Metal, Proof Sets, Bullion, etc.). Tap Create. Your collection appears in the grid immediately.', tip: 'Tip: Use descriptive names like "US Silver Dollars" or "British Pre-Decimal" for easy sorting later.' },
      { heading: 'Adding Your First Coin', body: 'Open your collection by tapping its card. Tap "Add Coin" (desktop) or "Add" (mobile). Fill in at minimum the Year and Denomination fields — these are required. Optionally upload obverse and reverse photos by tapping the photo slots. Tap "Add Coin" to save.', tip: null },
    ]
  },
  {
    title: '2. The Dashboard',
    platform: 'both',
    steps: [
      { heading: 'Stat Cards', body: 'Four cards at the top show: Collections count, Total Coins, Estimated Portfolio Value (based on market data), and Graded Coins count with percentage. These update in real time as you add and value coins.', tip: null },
      { heading: 'Collection Cards', body: 'Each collection shows a cover image (auto-set to your first coin\'s photo), coin count, collection type, and up to 3 AI-generated tags. Tap a card to open the collection. Use the pencil icon to rename, the trash icon to delete.', tip: null },
      { heading: 'Tag Filtering', body: 'If your collections have AI-generated tags, a filter row appears below the header. Tap a tag to filter collections by that label. On mobile, the tag row scrolls horizontally — swipe right to see all available tags. An active tag shows in gold with an × to clear it.', tip: 'Mobile tip: Swipe the tag row right to reveal more filter chips beyond the screen edge.' },
      { heading: 'Bottom Panels (Activity, Country, Grades)', body: 'Below the collection grid, three analytics panels show Recent Activity (last coins added), By Country (bar chart of your geographic spread), and Top Grades (grade distribution with average values per grade tier).', tip: null },
    ]
  },
  {
    title: '3. Managing Coins',
    platform: 'both',
    steps: [
      { heading: 'Adding via Photo Identifier', body: 'Inside a collection, tap the camera/scan button labeled "Identify." Upload or take a photo of a coin. The AI identifies country, denomination, year, mint mark, and series automatically. Review the pre-filled form and tap "Add to Collection."', tip: null },
      { heading: 'Adding a Set or Proof Set', body: 'Tap the "Set" button (box icon) inside a collection. Upload photos of the set packaging. AI identifies all coins within the set. Review the contents list, enter a purchase price, and save. Sets display with a "Set" badge in the collection grid.', tip: null },
      { heading: 'Editing a Coin', body: 'Open any coin\'s detail page by tapping its card. Tap the edit (pencil) icon at the top. Update any field including photos, grade, storage location, personal notes, purchase price, or condition. AI fields (grade, enrichment, market value) can also be re-triggered from the edit view.', tip: null },
      { heading: 'Coin Detail Page Tabs', body: 'A coin\'s detail page has four AI action buttons: Grade (AI Sheldon grading), Enrich (historical data), Market (current value), and Share (create a shareable image card). Each shows its result in an expandable panel below. Results are saved and persist between sessions.', tip: null },
    ]
  },
  {
    title: '4. AI Features',
    platform: 'both',
    steps: [
      { heading: 'AI Grading', body: 'Open a coin with at least one photo uploaded. Tap "Grade." The AI analyzes surface preservation, luster, strike, and eye appeal. You receive: a suggested grade (e.g. VF-30), confidence percentage, obverse/reverse breakdown, red flags, and recommended professional services for coins worth submitting. Tap "Accept" to apply the grade to your coin.', tip: 'Tip: Photo quality greatly affects grading accuracy. Use good lighting and photograph straight-on for best results.' },
      { heading: 'AI Enrichment', body: 'Tap "Enrich" on any coin to fetch: designer/engraver, mint of issue, alloy composition, diameter/weight specs, mintage figures, key dates/varieties, population data, and historical context. This data is sourced from numismatic databases via live AI search and saved permanently to the coin record.', tip: null },
      { heading: 'Market Value Lookup', body: 'Tap "Market" to fetch current retail and auction market data for your specific coin in its graded condition. Results include an estimated value range, recent auction comparables, price trend (Rising/Stable/Falling), and dealer retail references. All 73 coins can be refreshed at once from the Price Guide page using "Refresh All."', tip: 'Tip: Market lookups use AI credits. Refresh strategically — monthly is typically sufficient for most collections.' },
      { heading: 'Rate Limiting', body: 'AI features have a built-in cooldown to prevent accidental overuse. If you trigger multiple AI actions quickly, a short wait period applies. The cooldown resets automatically and is typically under 1 minute.', tip: null },
    ]
  },
  {
    title: '5. Catalog',
    platform: 'both',
    steps: [
      { heading: 'Browsing All Coins', body: 'The Catalog (accessible via top nav on desktop, bottom nav on mobile) shows all coins across all collections in a visual grid. By default sorted Newest first. Each card shows the coin image, year, denomination, country, collection name, and grade badge.', tip: null },
      { heading: 'Search and Filters', body: 'Type in the search bar to match any text field — denomination, country, year, series, notes, or set name. Open Filters (sliders icon) for advanced filtering by Country, Series, Grade, Composition, and Year Range. Active filter count shows as a gold badge. "Clear all" resets everything.', tip: null },
      { heading: 'Sorting', body: 'Use the sort dropdown (top right of filter bar) to order by: Newest, Oldest, Year Ascending, Year Descending, Country, or Value (highest first). Sort persists while you have the Catalog open.', tip: 'Desktop tip: The Catalog displays 5 columns at 1280px+ width, providing a dense, magazine-style inventory view.' },
    ]
  },
  {
    title: '6. Price Guide',
    platform: 'both',
    steps: [
      { heading: 'Overview', body: 'The Price Guide page shows all coins that have had a Market Value lookup performed. The total estimated portfolio value is displayed prominently at the top. Each coin row shows its image, name, current estimated value, and price trend arrow.', tip: null },
      { heading: 'Refreshing All Prices', body: 'Tap "Refresh All" to queue a batch update of every valued coin. CoinVault processes coins in groups of 3 and shows live progress (e.g. "12/73"). This uses AI credits proportional to coin count. After completion, a summary shows how many coins were updated.', tip: 'Tip: Use "Refresh All" after major market events or once per month to keep values current.' },
    ]
  },
  {
    title: '7. Coin Album',
    platform: 'both',
    steps: [
      { heading: 'Series Browser', body: 'The Album lists all supported coin series (1,800+ slots across 50+ series). Each row shows the series name, year range, coins you\'ve collected vs. total slots, and a circular completion percentage. An overall completion bar sits at the top.', tip: null },
      { heading: 'Expanding a Series', body: 'Tap any series row to expand it. Individual pages appear, each representing a year or date-mint combination. Filled slots show your coin\'s obverse thumbnail. Empty slots appear as outlined circles. Tap any filled slot to navigate directly to that coin\'s detail page.', tip: null },
      { heading: 'Filtering by Collection', body: 'Use the "All Collections" dropdown in the Album header to filter album progress to a specific collection. This lets you see exactly which dates are represented within a single collecting focus.', tip: 'Mobile tip: The Album is optimized for portrait use. Expand series one at a time to avoid performance lag on large series like Lincoln Cents.' },
    ]
  },
  {
    title: '8. Exporting & Sharing',
    platform: 'both',
    steps: [
      { heading: 'CSV Export', body: 'Open any Collection > Export > Download CSV. The file includes all coin fields: name, year, denomination, country, mint mark, series, composition, weight, diameter, grade (user and AI), purchase price, purchase date, estimated value, price trend, tags, storage location, notes, and date added. Opens directly in Excel, Google Sheets, or Numbers.', tip: null },
      { heading: 'PDF Report', body: 'Open any Collection > Export > Download PDF Report. Toggle "Include thumbnails" to add coin images to the report. The PDF includes a cover page (collection name, date, total value), summary statistics, and a detailed per-coin inventory table. Suitable for insurance documentation or dealer trade lists.', tip: null },
      { heading: 'Share Card', body: 'Open any coin\'s detail page. Tap the Share button. A styled card is generated showing the coin image, name, grade, and estimated value. On mobile you can share directly to Messages, WhatsApp, or social media. On desktop, download as a PNG or copy to clipboard.', tip: null },
      { heading: 'Full Data Export (JSON)', body: 'In Settings, scroll to Data Management > Export JSON. This exports your entire vault — all collections, coins, and settings — as a structured JSON file. Useful for backup or migration. Import is not yet supported in-app; contact support for migration assistance.', tip: null },
    ]
  },
  {
    title: '9. Settings',
    platform: 'both',
    steps: [
      { heading: 'Currency', body: 'Set your preferred display currency (e.g. USD, GBP, EUR). This affects how market values and portfolio totals are labeled. Note: AI-sourced values are returned in USD by default — currency is a display label, not an automatic conversion.', tip: null },
      { heading: 'Themes', body: 'Choose from multiple premium visual themes. Tap any theme card to preview instantly, then "Set as Default" to persist it. Themes change the entire color palette including nav, cards, accents, and backgrounds.', tip: null },
      { heading: 'GitHub API Key', body: 'Paste your free GitHub Models API token here to power all AI features. Get a free token at github.com/settings/tokens. Without a key, the app uses shared AI credits which may be rate-limited during peak hours.', tip: 'Tip: GitHub Models tokens are free for personal use and give access to GPT-4o and Claude. No credit card required.' },
      { heading: 'AI Auto-Enrich Toggle', body: 'When enabled, newly added coins are automatically submitted for enrichment in the background. Disable this if you prefer manual control or want to conserve AI credits.', tip: null },
    ]
  },
  {
    title: '10. Navigation Reference',
    platform: 'both',
    steps: [
      { heading: 'Desktop Navigation (top bar)', body: 'Collections — Dashboard with your collection grid and stats\nCatalog — All coins across all collections with search/filter\nAnalytics — Visual charts: by country (pie), by decade (bar), by composition, by value\nPrices — Market value overview and batch refresh\nAlbum — Series completion tracker\nSettings — Preferences, theme, API key\nSpot — Toggle live gold/silver spot price widget (draggable overlay)', tip: null },
      { heading: 'Mobile Navigation (bottom bar)', body: 'Collections — Dashboard\nCatalog — Full coin catalog\nScan (center gold button) — Opens the barcode/certification scanner\nAnalytics — Charts and breakdowns\nAlbum — Series completion tracker\nSettings — Accessible via the person icon in the top-left of the mobile header\nSearch — Tap the magnifying glass icon in the top-right mobile header', tip: 'Mobile tip: The gold Scan button is always visible in the center of the bottom nav for quick scanner access at coin shows.' },
    ]
  },
];

export default function Docs() {
  const [activeSection, setActiveSection] = useState('about');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setDone(false);
    try {
      await generateCoinVaultPDF();
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Documentation
          </h1>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>
            About, FAQ &amp; full user guide — export as production-ready PDF
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="shrink-0 gap-2 h-10 px-4 rounded-xl font-semibold"
          style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)', border: 'none' }}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> :
           done ? <CheckCircle className="w-4 h-4" /> :
           <FileDown className="w-4 h-4" />}
          {generating ? 'Generating…' : done ? 'Downloaded!' : 'Export PDF Suite'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)' }}>
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeSection === id
              ? { background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }
              : { color: 'var(--cv-text-muted)' }}>
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* About */}
      {activeSection === 'about' && (
        <div className="space-y-5">
          <div className="rounded-2xl p-6" style={{ border: '1px solid var(--cv-accent-border)', background: 'var(--cv-bg-card)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'var(--cv-accent-bg)' }}>🪙</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>CoinVault</h2>
                <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>Premium Coin Collecting & Portfolio Management · v2.0</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--cv-text)' }}>
              CoinVault is a premium numismatic portfolio app built for serious collectors. Organize your entire coin collection with AI-powered grading, live market valuations, and album-style completion tracking — all in one beautifully designed application accessible on any device.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--cv-text-secondary)' }}>
              Whether you collect US type coins, world issues, proof sets, bullion, or paper currency, CoinVault provides the tools professionals use: Sheldon-scale AI grading, real-time PCGS/NGC price lookups, PDF export for insurance or dealers, and a 1,800+ slot album tracker.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f.title} className="flex gap-3 rounded-xl p-4" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
                <span className="text-xl mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--cv-text)' }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--cv-text-muted)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid var(--cv-accent-border)' }}>
            <span className="text-lg">✅</span>
            <p className="text-sm" style={{ color: 'var(--cv-text-secondary)' }}>
              <strong style={{ color: 'var(--cv-accent)' }}>Works on all devices.</strong> CoinVault is a Progressive Web App (PWA) installable on iPhone, Android, Mac, and Windows. No App Store download required. Full desktop and mobile support with adaptive layouts for each platform.
            </p>
          </div>
        </div>
      )}

      {/* FAQ */}
      {activeSection === 'faq' && (
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <div key={i} className="rounded-xl p-4" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
              <div className="flex gap-3">
                <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>{i + 1}</span>
                <div>
                  <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--cv-text)' }}>{item.q}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--cv-text-secondary)' }}>{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Guide */}
      {activeSection === 'guide' && (
        <div className="space-y-6">
          {GUIDE_SECTIONS.map((sec, si) => (
            <div key={si} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cv-border)' }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'var(--cv-accent-dim)' }}>
                <h2 className="text-sm font-bold" style={{ color: 'var(--cv-accent-text)', fontFamily: "'Playfair Display', Georgia, serif" }}>{sec.title}</h2>
                <div className="ml-auto flex items-center gap-1.5">
                  {(sec.platform === 'both' || sec.platform === 'mobile') && <Smartphone className="w-3.5 h-3.5" style={{ color: 'var(--cv-accent-text)', opacity: 0.7 }} />}
                  {(sec.platform === 'both' || sec.platform === 'desktop') && <Monitor className="w-3.5 h-3.5" style={{ color: 'var(--cv-accent-text)', opacity: 0.7 }} />}
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--cv-border)' }}>
                {sec.steps.map((step, si2) => (
                  <div key={si2} className="px-5 py-4" style={{ background: 'var(--cv-bg-card)' }}>
                    <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--cv-text)' }}>{step.heading}</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--cv-text-secondary)' }}>{step.body}</p>
                    {step.tip && (
                      <div className="mt-2.5 flex gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid var(--cv-accent-border)' }}>
                        <span className="text-xs" style={{ color: 'var(--cv-accent)' }}>💡</span>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--cv-text-muted)' }}>{step.tip}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}