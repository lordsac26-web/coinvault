import { jsPDF } from 'jspdf';

// ─── Design tokens ────────────────────────────────────────────────────────────
const GOLD       = [201, 168, 76];
const GOLD_LIGHT = [240, 220, 150];
const GOLD_DIM   = [60,  48,  14];
const DARK_BG    = [10,  14,  26];
const DARK_CARD  = [18,  24,  42];
const DARK_CARD2 = [24,  30,  50];
const WHITE      = [245, 240, 232];
const MUTED      = [160, 150, 130];
const FAINT      = [90,  82,  65];
const GREEN      = [59,  109, 17];
const BLUE       = [24,  95,  165];
const PURPLE     = [83,  74,  183];
const RED_SOFT   = [180, 60,  60];

// ─── Page geometry ────────────────────────────────────────────────────────────
const W = 210, H = 297; // A4 mm
const ML = 16, MR = 16, MT = 14, MB = 14;
const CW = W - ML - MR; // content width = 178

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rgb(doc, r, g, b) { doc.setFillColor(r, g, b); }
function textRgb(doc, r, g, b) { doc.setTextColor(r, g, b); }

function rect(doc, x, y, w, h, r = 0) {
  if (r > 0) doc.roundedRect(x, y, w, h, r, r, 'F');
  else doc.rect(x, y, w, h, 'F');
}

function drawPageChrome(doc, pageNum, totalPages, section) {
  // Dark background
  rgb(doc, ...DARK_BG); rect(doc, 0, 0, W, H);

  // Subtle noise overlay (dots pattern)
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0);
  for (let i = 0; i < 40; i++) {
    const x = (i * 37.3) % W;
    const y = (i * 53.7) % H;
    doc.setFillColor(255, 255, 255, 0.015);
    doc.circle(x, y, 0.3, 'F');
  }

  // Top header bar
  rgb(doc, ...DARK_CARD); rect(doc, 0, 0, W, 12);
  // Gold left accent on header
  rgb(doc, ...GOLD); rect(doc, 0, 0, 3, 12);

  // Logo mark in header
  rgb(doc, ...GOLD); doc.circle(ML + 3.5, 6, 3, 'F');
  rgb(doc, ...DARK_BG); doc.circle(ML + 3.5, 6, 1.5, 'F');
  textRgb(doc, ...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('COINVAULT', ML + 9, 6.8);

  // Section label in header
  textRgb(doc, ...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(section.toUpperCase(), W / 2, 6.8, { align: 'center' });

  // Page number in header
  textRgb(doc, ...FAINT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(`${pageNum} / ${totalPages}`, W - MR, 6.8, { align: 'right' });

  // Bottom footer bar
  rgb(doc, ...DARK_CARD); rect(doc, 0, H - 8, W, 8);
  // Gold bottom accent line
  rgb(doc, ...GOLD); rect(doc, 0, H - 8, W, 0.5);
  textRgb(doc, ...FAINT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('CoinVault Documentation Suite  |  coinvault.app  |  Confidential', W / 2, H - 3.5, { align: 'center' });
}

function sectionHeading(doc, y, text, color = GOLD) {
  textRgb(doc, ...color);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(text, ML, y);
  // Underline
  rgb(doc, ...color);
  rect(doc, ML, y + 1.5, CW, 0.5);
  return y + 9;
}

function subheading(doc, y, text, color = WHITE) {
  textRgb(doc, ...color);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(text, ML, y);
  return y + 6;
}

function bodyText(doc, y, text, maxW = CW, color = MUTED, size = 8.5) {
  textRgb(doc, ...color);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, ML, y);
  return y + lines.length * (size * 0.42);
}

function callout(doc, y, text, type = 'tip') {
  const colors = { tip: GOLD, info: BLUE, warn: [180, 100, 20] };
  const bgColors = { tip: [40, 32, 8], info: [8, 22, 42], warn: [40, 24, 8] };
  const icons = { tip: 'TIP', info: 'INFO', warn: 'NOTE' };
  const c = colors[type] || GOLD;
  const bg = bgColors[type] || [40, 32, 8];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const lines = doc.splitTextToSize(text, CW - 16);
  const boxH = lines.length * 3.6 + 8;

  rgb(doc, ...bg); doc.roundedRect(ML, y, CW, boxH, 2, 2, 'F');
  doc.setDrawColor(...c, 0.6);
  doc.setLineWidth(0.5);
  doc.roundedRect(ML, y, CW, boxH, 2, 2, 'S');
  // Left accent bar
  rgb(doc, ...c); rect(doc, ML, y, 2.5, boxH);

  // Badge
  rgb(doc, ...c); doc.roundedRect(ML + 5, y + 3, 10, 4.5, 1, 1, 'F');
  textRgb(doc, ...DARK_BG);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text(icons[type], ML + 10, y + 6.2, { align: 'center' });

  textRgb(doc, ...WHITE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(lines, ML + 18, y + 6.5);

  return y + boxH + 3;
}

function platformBadge(doc, x, y, platform) {
  const labels = platform === 'mobile' ? ['MOBILE'] : platform === 'desktop' ? ['DESKTOP'] : ['MOBILE', 'DESKTOP'];
  let cx = x;
  labels.forEach(lbl => {
    const bgC = lbl === 'MOBILE' ? [30, 60, 100] : [30, 80, 40];
    const textC = lbl === 'MOBILE' ? [100, 160, 255] : [100, 200, 120];
    rgb(doc, ...bgC); doc.roundedRect(cx, y - 3.5, lbl === 'MOBILE' ? 14 : 17, 4.5, 1, 1, 'F');
    textRgb(doc, ...textC);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text(lbl, cx + (lbl === 'MOBILE' ? 7 : 8.5), y, { align: 'center' });
    cx += (lbl === 'MOBILE' ? 15 : 18);
  });
}

// ─── Screen mockup helper ─────────────────────────────────────────────────────

function drawMobileMockup(doc, x, y, w, h, title, lines = []) {
  // Phone shell
  doc.setDrawColor(...GOLD, 0.5);
  doc.setLineWidth(0.6);
  doc.setFillColor(...DARK_CARD);
  doc.roundedRect(x, y, w, h, 3, 3, 'FD');
  // Status bar
  doc.setFillColor(...DARK_CARD2);
  doc.rect(x, y, w, 5, 'F');
  // Notch
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(x + w / 2 - 5, y + 0.5, 10, 3, 1, 1, 'F');
  // Screen content area header
  doc.setFillColor(...DARK_CARD);
  doc.rect(x, y + 5, w, 8, 'F');
  // Logo in screen header
  doc.setFillColor(...GOLD);
  doc.circle(x + w / 2, y + 9, 2, 'F');
  doc.setFillColor(...DARK_BG);
  doc.circle(x + w / 2, y + 9, 1, 'F');
  // Title text
  doc.setFillColor(...GOLD);
  doc.setTextColor(...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.5);
  doc.text(title, x + w / 2 + 4, y + 9.5, { align: 'center' });
  // Content lines
  doc.setFillColor(...DARK_CARD2);
  let cy = y + 17;
  lines.forEach(line => {
    if (line.type === 'card') {
      doc.setFillColor(...DARK_CARD2);
      doc.roundedRect(x + 3, cy, w - 6, line.h || 10, 1, 1, 'F');
      doc.setTextColor(...MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.5);
      if (line.text) doc.text(line.text, x + 5, cy + 4);
      cy += (line.h || 10) + 2;
    } else if (line.type === 'grid') {
      const cols = line.cols || 2;
      const cw2 = (w - 6 - (cols - 1) * 2) / cols;
      for (let i = 0; i < cols; i++) {
        doc.setFillColor(...DARK_CARD2);
        doc.roundedRect(x + 3 + i * (cw2 + 2), cy, cw2, line.h || 12, 1, 1, 'F');
        // Coin circle icon
        doc.setFillColor(...GOLD_DIM);
        doc.circle(x + 3 + i * (cw2 + 2) + cw2 / 2, cy + (line.h || 12) / 2 - 1, 3, 'F');
        doc.setFillColor(30, 20, 5);
        doc.circle(x + 3 + i * (cw2 + 2) + cw2 / 2, cy + (line.h || 12) / 2 - 1, 1.5, 'F');
      }
      cy += (line.h || 12) + 2;
    } else if (line.type === 'bar') {
      doc.setFillColor(...DARK_CARD2);
      doc.roundedRect(x + 3, cy, w - 6, 5, 1, 1, 'F');
      doc.setFillColor(...GOLD);
      doc.roundedRect(x + 3, cy, (w - 6) * (line.pct || 0.6), 5, 1, 1, 'F');
      cy += 7;
    } else if (line.type === 'nav') {
      doc.setFillColor(...DARK_CARD);
      doc.rect(x, y + h - 10, w, 10, 'F');
      doc.setFillColor(...GOLD);
      doc.rect(x, y + h - 10, w, 0.4, 'F');
      const navItems = ['Coins', 'Catalog', 'Scan', 'Analytics', 'Album'];
      navItems.forEach((nav, i) => {
        const nx = x + 3 + i * ((w - 6) / navItems.length) + (w - 6) / navItems.length / 2;
        if (i === 2) {
          doc.setFillColor(...GOLD);
          doc.circle(nx, y + h - 5, 3.5, 'F');
        } else {
          doc.setTextColor(...FAINT);
          doc.setFontSize(3);
          doc.text(nav, nx, y + h - 4, { align: 'center' });
        }
      });
    }
  });
}

function drawDesktopMockup(doc, x, y, w, h, activePage) {
  // Window shell
  doc.setFillColor(...DARK_BG);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  doc.setDrawColor(...GOLD, 0.4);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 2, 2, 'S');
  // Nav bar
  doc.setFillColor(...DARK_CARD);
  doc.rect(x, y, w, 7, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(x, y + 7, w, 0.3, 'F');
  // Logo
  doc.setFillColor(...GOLD); doc.circle(x + 6, y + 3.5, 2, 'F');
  doc.setFillColor(...DARK_BG); doc.circle(x + 6, y + 3.5, 1, 'F');
  doc.setTextColor(...GOLD); doc.setFont('helvetica', 'bold'); doc.setFontSize(4);
  doc.text('COINVAULT', x + 10, y + 4.6);
  // Nav items
  const pages = ['Collections', 'Catalog', 'Analytics', 'Prices', 'Album', 'Settings'];
  pages.forEach((pg, i) => {
    const nx = x + 55 + i * 22;
    const isActive = pg === activePage;
    if (isActive) {
      doc.setFillColor(...GOLD_DIM);
      doc.roundedRect(nx - 1, y + 1.5, 20, 4.5, 1, 1, 'F');
      doc.setTextColor(...GOLD);
    } else {
      doc.setTextColor(...FAINT);
    }
    doc.setFont('helvetica', isActive ? 'bold' : 'normal');
    doc.setFontSize(3.5);
    doc.text(pg, nx + 9, y + 4.6, { align: 'center' });
  });
  // Content area
  doc.setFillColor(...DARK_BG);
  doc.rect(x, y + 7, w, h - 7, 'F');
}

// ─── COVER PAGE ───────────────────────────────────────────────────────────────

function addCoverPage(doc) {
  rgb(doc, ...DARK_BG); rect(doc, 0, 0, W, H);

  // Large background coin motif
  doc.setDrawColor(...GOLD, 0.04);
  doc.setLineWidth(0.3);
  for (let r = 5; r < 80; r += 8) doc.circle(W / 2, 110, r, 'S');

  // Top gold strip
  rgb(doc, ...GOLD); rect(doc, 0, 0, W, 3);

  // Centered coin logo
  const cx = W / 2, cy = 85;
  // Outer glow
  doc.setFillColor(201, 168, 76, 0.1);
  doc.circle(cx, cy, 28, 'F');
  doc.setFillColor(201, 168, 76, 0.15);
  doc.circle(cx, cy, 22, 'F');
  // Coin body
  rgb(doc, ...GOLD); doc.circle(cx, cy, 16, 'F');
  rgb(doc, ...GOLD_DIM); doc.circle(cx, cy, 12, 'F');
  doc.setDrawColor(...GOLD_LIGHT);
  doc.setLineWidth(0.4);
  doc.circle(cx, cy, 12, 'S');
  rgb(doc, 201, 168, 76); doc.circle(cx, cy, 3, 'F');
  rgb(doc, ...DARK_BG); doc.circle(cx, cy, 1.5, 'F');

  // Title
  textRgb(doc, ...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.text('CoinVault', W / 2, 118, { align: 'center' });

  // Subtitle rule
  rgb(doc, ...GOLD); rect(doc, W / 2 - 30, 122, 60, 0.5);

  textRgb(doc, ...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Official Documentation Suite', W / 2, 130, { align: 'center' });

  // Version pill
  rgb(doc, ...DARK_CARD); doc.roundedRect(W / 2 - 20, 135, 40, 9, 2, 2, 'F');
  doc.setDrawColor(...GOLD, 0.5);
  doc.setLineWidth(0.4);
  doc.roundedRect(W / 2 - 20, 135, 40, 9, 2, 2, 'S');
  textRgb(doc, ...GOLD_LIGHT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Version 2.0  |  March 2026', W / 2, 140.5, { align: 'center' });

  // Document sections listing
  const sections = [
    { num: '01', title: 'About CoinVault', desc: 'Overview, features & platform support' },
    { num: '02', title: 'Frequently Asked Questions', desc: 'Top 10 questions from new users' },
    { num: '03', title: 'User Guide', desc: 'Complete step-by-step reference — desktop & mobile' },
  ];
  sections.forEach((s, i) => {
    const sy = 160 + i * 22;
    rgb(doc, ...DARK_CARD); doc.roundedRect(ML, sy, CW, 18, 2, 2, 'F');
    rgb(doc, ...GOLD); rect(doc, ML, sy, 2, 18);
    textRgb(doc, ...FAINT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(s.num, ML + 7, sy + 12);
    textRgb(doc, ...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(s.title, ML + 20, sy + 7.5);
    textRgb(doc, ...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(s.desc, ML + 20, sy + 14);
  });

  // Bottom footer
  rgb(doc, ...GOLD); rect(doc, 0, H - 3, W, 3);
  textRgb(doc, ...FAINT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('coinvault.app  |  Premium Coin Collecting & Portfolio Management', W / 2, H - 6, { align: 'center' });
}

// ─── ABOUT SECTION ────────────────────────────────────────────────────────────

function addAboutSection(doc, startPage) {
  let pg = startPage;

  // ── Page 1: intro + feature grid ──
  doc.addPage();
  drawPageChrome(doc, pg, '?', 'About CoinVault');
  let y = 22;

  y = sectionHeading(doc, y, 'About CoinVault');

  // Intro card
  rgb(doc, ...DARK_CARD); doc.roundedRect(ML, y, CW, 28, 2, 2, 'F');
  rgb(doc, ...GOLD); rect(doc, ML, y, 2.5, 28);
  y += 4;
  textRgb(doc, ...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('The Premium Numismatic Portfolio', ML + 6, y + 3);
  y = bodyText(doc, y + 9, 'CoinVault is a full-featured coin collection management platform built for serious numismatists. It combines AI-powered grading and market valuation with beautiful organization tools, album-style completion tracking, and professional export capabilities — all accessible from any device, any time.', CW - 8, MUTED, 8.5);
  y += 4;
  y = bodyText(doc, y, 'Whether you collect US type coins, world issues, proof sets, bullion, or paper currency, CoinVault provides the same tools that professionals use at major auction houses and coin dealers — in a sleek, intuitive interface designed for daily use.', CW - 8, MUTED, 8.5);
  y += 8;

  // Features in 2-column grid
  textRgb(doc, ...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Core Features', ML, y);
  rgb(doc, ...GOLD); rect(doc, ML, y + 1.5, 35, 0.4);
  y += 8;

  const features = [
    ['Smart Collections', 'Organize into unlimited collections by country, era, metal, series, or custom grouping with AI-generated tags.'],
    ['AI Grading', 'Photo-based Sheldon-scale grading with confidence metrics, obverse/reverse breakdown, and red-flag detection.'],
    ['Live Market Values', 'Real-time price lookups across PCGS, NGC, eBay completed sales, and major auction houses.'],
    ['1,800+ Slot Album', 'Track series completion across every major world coin type with page-by-page slot tracking.'],
    ['AI Enrichment', 'Fetch designer, mintage figures, key dates, population data, and historical context with one tap.'],
    ['Coin Identifier', 'Photograph any unknown coin and AI identifies country, denomination, year, series, and mint mark.'],
    ['PDF & CSV Export', 'Export inventory reports for insurance, dealer trade lists, or personal records.'],
    ['Barcode Scanner', 'Scan PCGS/NGC certification barcodes to retrieve verified slab data instantly.'],
  ];

  const colW = CW / 2 - 2;
  features.forEach((f, i) => {
    const col = i % 2;
    const fx = ML + col * (colW + 4);
    const fy = y + Math.floor(i / 2) * 22;
    rgb(doc, ...DARK_CARD); doc.roundedRect(fx, fy, colW, 19, 1.5, 1.5, 'F');
    // Gold dot accent
    rgb(doc, ...GOLD); doc.circle(fx + 5, fy + 5.5, 1.5, 'F');
    textRgb(doc, ...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(f[0], fx + 10, fy + 6.5);
    textRgb(doc, ...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const lines = doc.splitTextToSize(f[1], colW - 8);
    doc.text(lines, fx + 5, fy + 12);
  });
  y += 4 * 22 + 6;

  // PWA callout
  y = callout(doc, y, 'CoinVault is a Progressive Web App (PWA). On Android, Chrome will prompt you to install it to your home screen. On iOS, use Safari > Share > Add to Home Screen. Once installed, the app launches full-screen with its own icon — no App Store required. AI features and cloud sync require an active internet connection.', 'info');
  y += 2;

  // Platform badges section
  textRgb(doc, ...GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Platform Support', ML, y);
  y += 6;

  const platforms = [
    { label: 'iOS (Safari)', detail: 'Add to Home Screen via Share menu. Supports full-screen mode, home screen icon, and offline caching of previously loaded content.' },
    { label: 'Android (Chrome)', detail: 'Auto install prompt appears after first visit. Full PWA install with home screen icon and standalone launch mode.' },
    { label: 'Desktop (Mac/Win)', detail: 'Full-featured browser experience. Chrome/Edge support desktop PWA install. All features available including drag & drop export.' },
    { label: 'Tablet', detail: 'Responsive layout adapts between mobile and desktop views at tablet width. Best experienced in landscape mode.' },
  ];
  platforms.forEach((p, i) => {
    const px = ML + (i % 2) * (colW + 4);
    const py = y + Math.floor(i / 2) * 16;
    rgb(doc, ...DARK_CARD); doc.roundedRect(px, py, colW, 13, 1.5, 1.5, 'F');
    textRgb(doc, ...GOLD_LIGHT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(p.label, px + 5, py + 5.5);
    textRgb(doc, ...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const lines = doc.splitTextToSize(p.detail, colW - 8);
    doc.text(lines.slice(0, 2), px + 5, py + 10);
  });

  return pg + 1;
}

// ─── FAQ SECTION ──────────────────────────────────────────────────────────────

function addFaqSection(doc, startPage) {
  let pg = startPage;

  const FAQS = [
    ['How do I add my first coin?', 'First create a Collection from the Dashboard (tap "+ New Collection"). Open that collection and tap "Add Coin." Fill in the Year and Denomination (required fields), then optionally upload obverse/reverse photos. Tap "Add Coin" to save. The AI will auto-enrich the coin in the background.'],
    ['What does AI Grading do?', 'AI Grading analyzes your uploaded coin photo and assigns a Sheldon-scale grade (e.g. VF-25, MS-63). It identifies surface marks, luster, strike quality, and eye appeal, returning a confidence percentage and per-surface breakdown. Open any coin, tap "Grade," and the result appears within seconds. AI grades are estimates — professional PCGS/NGC certification is recommended for high-value coins.'],
    ['How accurate are the market values?', 'Market values are fetched in real time using AI-powered search across PCGS Price Guide, NGC, eBay completed sales, and major auction records. Values are estimates based on recent transactions for coins of comparable grade. Use "Refresh All" on the Price Guide page to update all coins at once.'],
    ['Can I use CoinVault offline?', 'CoinVault is installable as a PWA (Progressive Web App). Android: Chrome shows an "Add to Home Screen" prompt automatically. iOS: Safari > Share > Add to Home Screen. Once installed, previously loaded pages render from cache. AI features, market lookups, and cloud sync require an active internet connection.'],
    ['What is the Coin Album?', 'The Album tracks your collection\'s completion across 1,800+ coin slots spanning 50+ series. Each series row shows coins collected vs. total slots and a completion percentage. Expand any series to see individual date-mint combinations. Filled slots show your coin\'s thumbnail; empty slots appear as outlined circles.'],
    ['How do I export my collection?', 'Open any Collection > Export (top right). Choose CSV for a spreadsheet file (opens in Excel/Sheets/Numbers) or PDF for a formatted inventory report. The PDF includes a cover page, summary statistics, and a per-coin table. Toggle "Include thumbnails" to add obverse images to the PDF.'],
    ['What is the Barcode Scanner?', 'The Scanner reads PCGS and NGC certification barcodes printed on coin slabs. Open it via the center gold button on the mobile bottom nav, or from within any collection view. Point your camera at the barcode on a certified slab to retrieve the official grade, variety, and certification details.'],
    ['How do I set up my GitHub API key?', 'Go to Settings > GitHub API Key. Create a free personal access token at github.com/settings/tokens (no credit card required). This key grants access to GitHub Models (GPT-4o and Claude) at no cost for personal use and powers all AI features. Without a key, the app falls back to shared AI credits which may be rate-limited.'],
    ['How do search and filters work?', 'Both the Catalog and Collection views have a full filter bar. Type in the search box to match any text (denomination, country, year, notes). Open the Filters panel for Country, Series, Grade, Composition, and Year Range dropdowns. Sort by Newest, Oldest, Year, Country, or Value. Active filter count shows as a gold badge. Tap "Clear all" to reset.'],
    ['How do I change the theme?', 'Go to Settings > Theme. CoinVault includes Classic (dark gold), Midnight Blue, Emerald, Rose, and Light themes. Tap any theme to preview it live, then "Set as Default" to persist it. The theme affects the entire app — navigation, cards, accents, and backgrounds.'],
  ];

  doc.addPage();
  drawPageChrome(doc, pg, '?', 'Frequently Asked Questions');
  let y = 22;
  y = sectionHeading(doc, y, 'Frequently Asked Questions');

  textRgb(doc, ...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Top 10 questions from new CoinVault users', ML, y);
  y += 8;

  let pageNum = pg;

  for (let i = 0; i < FAQS.length; i++) {
    const [q, a] = FAQS[i];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const aLines = doc.splitTextToSize(a, CW - 20);
    const cardH = aLines.length * 3.4 + 16;

    if (y + cardH > H - 20) {
      doc.addPage();
      pageNum++;
      drawPageChrome(doc, pageNum, '?', 'Frequently Asked Questions');
      y = 22;
    }

    // Card background
    rgb(doc, ...DARK_CARD); doc.roundedRect(ML, y, CW, cardH, 2, 2, 'F');
    // Number badge
    rgb(doc, ...GOLD); doc.circle(ML + 6, y + 7, 5, 'F');
    textRgb(doc, ...DARK_BG);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(String(i + 1), ML + 6, y + 9.2, { align: 'center' });
    // Question
    textRgb(doc, ...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(q, ML + 14, y + 7.5);
    // Divider
    doc.setDrawColor(...FAINT);
    doc.setLineWidth(0.3);
    doc.line(ML + 14, y + 10, ML + CW - 4, y + 10);
    // Answer
    textRgb(doc, ...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(aLines, ML + 14, y + 15);

    y += cardH + 3;
  }

  return pageNum + 1;
}

// ─── USER GUIDE SECTION ───────────────────────────────────────────────────────

function addGuideSection(doc, startPage) {
  let pg = startPage;

  // Guide chapter data
  const chapters = [
    {
      title: 'Chapter 1: Getting Started',
      intro: 'Everything you need to go from zero to a fully catalogued collection.',
      steps: [
        {
          h: 'Installing the App',
          platform: 'both',
          body: 'CoinVault is a Progressive Web App — no download needed. Visit the app URL in your browser.\n\nDESKTOP: Bookmark the URL or use Chrome/Edge\'s "Install" option from the address bar for a dedicated desktop icon.\n\nMOBILE (Android): Chrome displays an "Add to Home Screen" banner at the bottom of the screen after your first visit. Tap it to install with a native app icon.\n\nMOBILE (iOS): In Safari, tap the Share icon (box with arrow), scroll down, and tap "Add to Home Screen." Enter a name and tap "Add." The app appears on your home screen and launches full-screen.',
          tip: 'TIP: Once installed on mobile, CoinVault launches without a browser address bar, giving you a full-screen experience identical to a native app.'
        },
        {
          h: 'Creating Your First Collection',
          platform: 'both',
          body: 'Navigate to the Dashboard (Collections tab on mobile, Collections link on desktop nav).\n\nTap "+ New Collection" (desktop) or "+ New" (mobile). Enter a descriptive name, optional description, and choose a collection type:\n• By Country  • By Era  • By Series  • By Metal\n• Proof Sets  • Mint Sets  • Bullion  • Rolls\n• Commemoratives  • Paper Currency  • Custom\n\nTap "Create." Your collection appears in the grid immediately.',
          tip: 'TIP: Use specific names like "US Silver Dollars 1878-1921" rather than generic "My Coins" — this makes filtering and export headers more meaningful.'
        },
        {
          h: 'Adding Your First Coin',
          platform: 'both',
          body: 'Open your collection. Tap "Add Coin" (desktop) or "Add" (mobile).\n\nRequired fields: Year and Denomination. All other fields are optional at add time and can be filled in later.\n\nOptional at add time:\n• Obverse/reverse photos (tap the photo slots)\n• Country, mint mark, grade, composition\n• Purchase price, date acquired, storage location\n• Personal notes, condition notes\n\nTap "Add Coin" to save. If you uploaded a photo and have AI auto-enrich enabled, enrichment begins automatically in the background.',
          tip: null
        },
      ]
    },
    {
      title: 'Chapter 2: The Dashboard',
      intro: 'Your command center — portfolio stats, collection grid, activity feed, and analytics at a glance.',
      steps: [
        {
          h: 'Portfolio Stats Cards',
          platform: 'both',
          body: 'Four colored cards at the top of the Dashboard display your key metrics:\n\n• Collections — Total number of collections in your vault\n• Total Coins — Sum of all coins across all collections\n• Est. Value — Portfolio total based on market data lookups\n• Graded — Number and percentage of graded coins\n\nCards update automatically when you add coins or run market lookups. The Est. Value card shows "No valuations yet" until you run at least one Market lookup.',
          tip: null
        },
        {
          h: 'Collection Cards & Tag Filtering',
          platform: 'both',
          body: 'Each collection card shows: cover image (auto-set from first coin photo), coin count, collection type, and up to 3 AI-generated tags.\n\nTap a card to open the collection. The pencil icon renames it; the trash icon deletes it (with all coins).\n\nTAG FILTERING: Below the "My Collections" header, a row of tag chips appears if any collections have tags. Tap a tag to filter the collection grid to that label.\n\nMOBILE: The tag row scrolls horizontally — a subtle fade at the right edge indicates more tags. Swipe right to reveal them.',
          tip: 'TIP (Mobile): The fade gradient on the right edge of the tag row is a scroll hint — there may be more filter tags off-screen. Swipe right to see them all.'
        },
        {
          h: 'Analytics Panels',
          platform: 'both',
          body: 'Scroll below the collection grid to see three analytics panels:\n\nRECENT ACTIVITY — The last 3 coins added or updated, with color-coded dots and relative timestamps.\n\nBY COUNTRY — Horizontal bar chart showing your top 5 countries by coin count. Useful for seeing geographic spread at a glance.\n\nTOP GRADES — Grade distribution table with coin count and average estimated value per grade tier (e.g. VF-20 · 7 coins · avg $15). Grades are color-coded by classification (MS=purple, AU=green, EF=amber, VF=gray).',
          tip: null
        },
      ]
    },
    {
      title: 'Chapter 3: AI Features',
      intro: 'CoinVault\'s AI engine handles grading, historical research, and live market valuation.',
      steps: [
        {
          h: 'AI Grading',
          platform: 'both',
          body: 'AI Grading uses computer vision to analyze your coin photo and assign a Sheldon scale grade.\n\nHOW TO USE:\n1. Open a coin with at least one photo uploaded\n2. Scroll to the AI section and tap "Grade"\n3. Wait 5-15 seconds for the result\n4. Review: suggested grade, confidence %, obverse/reverse breakdown, notable marks, red flags\n5. Tap "Accept Grade" to apply it to the coin record\n\nBest practices for accurate grading:\n• Use good natural or diffuse lighting — avoid harsh direct flash\n• Photograph perpendicular to the coin (straight-on, not angled)\n• Fill the frame with the coin — minimize background\n• Clean the coin holder lens if using a phone\n\nNote: AI grades are sophisticated estimates based on visual analysis. For coins worth $500+, professional PCGS or NGC certification is recommended.',
          tip: 'TIP: AI grading accuracy is highest for clear, high-contrast photos. A slightly underexposed photo of a silver coin often grades more accurately than an overexposed one.'
        },
        {
          h: 'AI Enrichment',
          platform: 'both',
          body: 'Enrichment fetches comprehensive numismatic data for any coin using real-time AI research.\n\nDATA RETURNED:\n• Designer/engraver names\n• Official mint of issue\n• Exact alloy composition and specifications (diameter, weight)\n• Total mintage figures by year and mint\n• Key date status and known varieties\n• Population data (how many known at this grade)\n• Historical context and significance\n• Professional grading recommendations\n\nHOW TO USE: Open any coin, scroll to AI section, tap "Enrich." Data appears within 10-20 seconds and is permanently saved to the coin record.',
          tip: null
        },
        {
          h: 'Market Value Lookup',
          platform: 'both',
          body: 'Market lookups query live price data from PCGS Price Guide, NGC, eBay recently completed sales, and major auction house records.\n\nRESULT INCLUDES:\n• Estimated value (this specific coin at its grade)\n• Low/high range from comparable sales\n• Price trend: Rising / Stable / Falling\n• Recent auction comparables\n• Dealer retail reference prices\n\nSINGLE COIN: Open a coin > tap "Market"\nBATCH ALL COINS: Navigate to Price Guide > tap "Refresh All"\n\nBatch refresh processes coins in groups of 3 and shows live progress. After completion, a summary shows updated count.',
          tip: 'TIP: Market lookups use AI credits. Batch-refreshing monthly is typically sufficient. Run a full refresh after major market events (e.g. major auction results, greysheet updates).'
        },
        {
          h: 'Coin Identifier (Photo AI)',
          platform: 'both',
          body: 'The Coin Identifier lets you photograph any coin — known or unknown — and have AI identify it automatically.\n\nHOW TO USE:\n1. Open any collection\n2. Tap the camera/identify button (person+camera icon)\n3. Upload a photo or take one with your camera\n4. AI identifies: country, denomination, year, series, mint mark, and entry type\n5. Review and edit the pre-filled form if needed\n6. Tap "Add to Collection" to save\n\nWorks best with: clear obverse photos showing date and identifying legends. For world coins, including both obverse and reverse improves accuracy significantly.',
          tip: null
        },
        {
          h: 'AI Rate Limiting',
          platform: 'both',
          body: 'To prevent accidental runaway AI usage, CoinVault enforces a brief cooldown between rapid AI actions. If you trigger multiple AI operations in quick succession, a short wait period applies before the next call is accepted.\n\nThe cooldown is automatic and resets within 30-60 seconds. All results are saved permanently once received — you never need to re-run a successful lookup.',
          tip: null
        },
      ]
    },
    {
      title: 'Chapter 4: Catalog & Search',
      intro: 'Browse, search, and filter your entire vault across all collections.',
      steps: [
        {
          h: 'The Catalog View',
          platform: 'both',
          body: 'The Catalog shows all coins across all collections in a unified visual grid.\n\nACCESSING:\n• Desktop: "Catalog" in the top navigation bar\n• Mobile: "Catalog" in the bottom navigation bar\n\nDefault sort is Newest First. Each card shows:\n• Obverse photo (or placeholder coin icon)\n• Year + denomination name\n• Country\n• Collection name\n• Grade badge (if graded)\n\nDesktop shows 5 columns at large screen widths for a dense magazine-style inventory view.',
          tip: null
        },
        {
          h: 'Search & Filters',
          platform: 'both',
          body: 'The filter bar appears at the top of both Catalog and individual Collection views.\n\nSEARCH BOX: Type to match any text field — denomination, country, year, series, coin notes, set name, or collection name. Results update in real time.\n\nFILTERS PANEL: Tap the sliders icon (or "Filters" label) to expand advanced filters:\n• Country dropdown — filter to a specific issuing country\n• Series dropdown — filter to a specific coin series\n• Grade dropdown — filter to a specific grade\n• Composition dropdown — filter by metal/alloy\n• Year Range — enter From and To year numbers\n\nActive filter count shows as a numbered gold badge on the Filters button. Tap "Clear all" inside the filters panel to reset everything at once.\n\nSORT: Use the dropdown to sort by Newest, Oldest, Year (Asc/Desc), Country (A-Z), or Value (High-Low).',
          tip: 'TIP: Combine search + filters for precise results. E.g. search "Morgan" + filter Country = "United States" + Year From = 1878 To = 1904 to find all pre-1904 Morgan dollars.'
        },
      ]
    },
    {
      title: 'Chapter 5: Coin Album',
      intro: 'Track your collection\'s completeness across 1,800+ slots from 50+ major series.',
      steps: [
        {
          h: 'Album Overview',
          platform: 'both',
          body: 'The Album provides a traditional numismatic "hole" tracker — like a physical Dansco or Whitman album — for your digital collection.\n\nACCESSING:\n• Desktop: "Album" in the top navigation\n• Mobile: "Album" in the bottom navigation bar (rightmost)\n\nThe album header shows:\n• Total slots filled / total slots available\n• Number of series with at least one coin\n• Overall completion percentage bar\n• "All Collections" dropdown to filter by a specific collection\n\nBelow, all supported series are listed with: series name, year range, your collected count, total slots, and a circular completion percentage indicator.',
          tip: null
        },
        {
          h: 'Browsing Series',
          platform: 'both',
          body: 'Each series row displays a compact summary. Tap the chevron (>) or the row itself to expand it.\n\nExpanded view shows all "pages" within the series — each page represents a year or date range. Individual date-mint slots appear as:\n• Filled slot: shows your coin\'s obverse thumbnail with a green check\n• Empty slot: outlined circle with the date label\n\nTap any filled slot to navigate directly to that coin\'s detail page. Series that are 100% complete show a gold "100%" ring and check mark.',
          tip: 'TIP (Mobile): Expand one series at a time on mobile for best performance. Large series like Lincoln Cents (100+ slots) can take a moment to render all slot thumbnails.'
        },
        {
          h: 'Filtering Album by Collection',
          platform: 'both',
          body: 'Use the "All Collections" dropdown in the Album header to restrict the completion view to a single collection.\n\nThis is useful when you have multiple collections covering overlapping series (e.g. one general US collection and one focused Morgan Dollar collection) and want to see progress for each independently.',
          tip: null
        },
      ]
    },
    {
      title: 'Chapter 6: Export & Sharing',
      intro: 'Professional-grade export tools for insurance, dealers, and personal records.',
      steps: [
        {
          h: 'CSV Export',
          platform: 'both',
          body: 'Export any collection as a spreadsheet-compatible CSV file.\n\nHOW TO EXPORT:\n1. Open any collection\n2. Tap the Export button (top right of the collection view)\n3. Tap "Download CSV"\n\nThe file downloads immediately. It includes all fields:\nName, Year, Denomination, Country, Mint Mark, Series, Composition, Weight, Diameter, User Grade, AI Grade, Purchase Price, Purchase Date, Source, Estimated Value, Price Trend, Tags, Storage Location, Condition Notes, Personal Notes, Date Added.\n\nCSV files open directly in Microsoft Excel, Google Sheets, LibreOffice Calc, or Apple Numbers.',
          tip: null
        },
        {
          h: 'PDF Report',
          platform: 'both',
          body: 'Export a formatted multi-page PDF inventory report for any collection.\n\nHOW TO EXPORT:\n1. Open any collection > Export\n2. Toggle "Include thumbnails" ON to embed obverse images alongside each coin row\n3. Tap "Download PDF Report"\n4. Wait 5-15 seconds for generation (longer for large collections with thumbnails)\n\nThe PDF includes:\n• Cover page: collection name, generation date, total estimated value, coin count\n• Summary statistics panel\n• Per-coin inventory table with all key metadata\n• Page numbers and collection header on every page\n\nSuitable for: insurance documentation, dealer trade lists, estate records, and collection appraisals.',
          tip: 'TIP: For insurance purposes, generate a PDF with thumbnails enabled and store it in a secure cloud location (Google Drive, iCloud) separate from your phone.'
        },
        {
          h: 'Coin Share Card',
          platform: 'both',
          body: 'Create a stylized shareable image card for any individual coin.\n\nHOW TO USE:\n1. Open any coin\'s detail page\n2. Tap the "Share" button in the AI actions section\n3. A styled card generates showing the coin image, name, grade, and estimated value\n\nMOBILE: Tap "Share" to open your device\'s native share sheet (Messages, WhatsApp, Instagram, etc.)\nDESKTOP: Download as PNG or copy to clipboard\n\nGreat for sharing finds on numismatic forums, social media, or with fellow collectors.',
          tip: null
        },
        {
          h: 'Full Vault JSON Export',
          platform: 'desktop',
          body: 'For a complete data backup, navigate to Settings > Data Management > Export JSON.\n\nThis exports your entire vault — all collections, all coins (including AI data, market values, photos), and settings — as a single structured JSON file.\n\nRecommended: Export a JSON backup monthly and store it in cloud storage. This file represents the complete state of your CoinVault and can be used for migration or recovery.',
          tip: null
        },
      ]
    },
    {
      title: 'Chapter 7: Settings & Configuration',
      intro: 'Personalize CoinVault to match your collecting style and workflow.',
      steps: [
        {
          h: 'Accessing Settings',
          platform: 'both',
          body: 'DESKTOP: Click "Settings" in the top navigation bar.\nMOBILE: Tap the person icon in the top-left of the mobile header bar.',
          tip: null
        },
        {
          h: 'Currency',
          platform: 'both',
          body: 'Set your preferred display currency (e.g. USD, GBP, EUR, CAD, AUD). This affects how market values and portfolio totals are labeled throughout the app.\n\nNote: AI-sourced market values are returned in USD based on international market data. Currency is a display label, not an automatic conversion — exchange rate conversion is not currently applied.',
          tip: null
        },
        {
          h: 'Themes',
          platform: 'both',
          body: 'CoinVault includes multiple premium visual themes:\n• Classic (Dark Gold) — the signature dark navy + gold palette\n• Midnight Blue — deep blue with cyan accents\n• Emerald — forest green with warm gold\n• Rose — dark rose gold palette\n• Light — clean light mode for bright environments\n\nTap any theme card to preview it live. Tap "Set as Default" to persist the choice. The theme applies to the entire app including navigation, cards, accents, chart colors, and backgrounds.',
          tip: 'TIP: If you use CoinVault under bright lighting (coin shows, dealer tables), try the Light theme for better screen visibility in sunlight.'
        },
        {
          h: 'GitHub Models API Key',
          platform: 'both',
          body: 'A GitHub Models API key unlocks the full AI power of CoinVault.\n\nHOW TO GET A FREE KEY:\n1. Log in at github.com\n2. Navigate to Settings > Developer Settings > Personal Access Tokens\n3. Click "Generate new token (classic)"\n4. Give it a name like "CoinVault"\n5. No special permissions/scopes needed — just generate\n6. Copy the token\n7. In CoinVault Settings, paste it into "GitHub API Key" and tap Save\n\nGitHub Models tokens are completely free for personal use and give access to GPT-4o and Claude models. No credit card required.\n\nWithout a key: the app uses shared AI credits which may be rate-limited during peak hours.',
          tip: null
        },
        {
          h: 'AI Auto-Enrich Toggle',
          platform: 'both',
          body: 'When AI Auto-Enrich is enabled (default: ON), every newly added coin is automatically submitted for enrichment in the background immediately after saving.\n\nYou can disable this if:\n• You want manual control over when enrichment runs\n• You want to conserve AI credits\n• You are bulk-importing many coins at once\n\nYou can always trigger enrichment manually on any coin by opening its detail page and tapping "Enrich."',
          tip: null
        },
      ]
    },
    {
      title: 'Chapter 8: Navigation Reference',
      intro: 'Quick reference for every navigation element on desktop and mobile.',
      steps: [
        {
          h: 'Desktop Navigation (Top Bar)',
          platform: 'desktop',
          body: 'The top navigation bar is always visible on desktop. At smaller screen widths (< 1024px), labels are hidden and only icons appear.\n\nCOLLECTIONS — Dashboard with portfolio stats, collection grid, activity feed\nCATALOG — All coins across all collections with full search and filter\nANALYTICS — Visual charts: country pie chart, decade bar chart, composition breakdown, value distribution\nPRICES — Market value overview and batch refresh for all coins\nALBUM — Series completion tracker across 1,800+ slots\nSETTINGS — Currency, theme, GitHub API key, data export\nSPOT (button) — Toggles a draggable floating spot price widget showing live gold, silver, platinum, and palladium prices\n\nGLOBAL SEARCH: The search bar (center of nav, keyboard shortcut Cmd/Ctrl+K) searches coins and collections across your entire vault instantly.',
          tip: null
        },
        {
          h: 'Mobile Navigation (Bottom Bar)',
          platform: 'mobile',
          body: 'The bottom navigation bar is always visible on mobile and contains 5 destinations:\n\nCOLLECTIONS (left) — Dashboard\nCATALOG — Full coin catalog with search/filter\nSCAN (center gold button) — Opens the barcode/certification scanner\nANALYTICS — Charts and data breakdowns\nALBUM (right) — Series completion tracker\n\nMOBILE TOP BAR (header strip at top):\n• Person icon (left) — Opens Settings\n• CoinVault logo (center) — Returns to Dashboard\n• Search icon (right) — Opens global search\n• Spot price icon (right) — Toggles the spot price widget',
          tip: 'TIP: The gold Scan button in the center of the mobile bottom nav is always instantly accessible — designed for quick barcode scans at coin shows and dealer tables without navigating menus.'
        },
        {
          h: 'Price Guide Page',
          platform: 'both',
          body: 'The Price Guide (Prices in nav) is a dedicated page showing all coins with market values:\n\n• Total portfolio value prominently displayed at the top\n• Per-coin rows with image, name, grade, estimated value, and trend arrow\n• "Refresh All" button — batch-updates all valued coins, showing live progress (e.g. "12/73")\n\nACCESSING:\n• Desktop: "Prices" in top nav\n• Mobile: "Prices" not in bottom nav — access via Settings or navigate directly to /price-guide in the browser URL',
          tip: null
        },
      ]
    },
  ];

  for (const chapter of chapters) {
    doc.addPage();
    pg++;
    drawPageChrome(doc, pg, '?', 'User Guide');
    let y = 22;

    // Chapter header
    rgb(doc, ...DARK_CARD); rect(doc, ML, y, CW, 18, 2);
    rgb(doc, ...GOLD); rect(doc, ML, y, 3, 18);
    textRgb(doc, ...GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(chapter.title, ML + 8, y + 8.5);
    textRgb(doc, ...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(chapter.intro, ML + 8, y + 15);
    y += 23;

    for (const step of chapter.steps) {
      // Estimate height needed
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const bodyLines = doc.splitTextToSize(step.body, CW - 22);
      const tipLines = step.tip ? doc.splitTextToSize(step.tip, CW - 22) : [];
      const needed = 12 + bodyLines.length * 3.5 + (step.tip ? tipLines.length * 3.2 + 12 : 0) + 6;

      if (y + needed > H - 22) {
        doc.addPage();
        pg++;
        drawPageChrome(doc, pg, '?', 'User Guide — ' + chapter.title);
        y = 22;
      }

      // Step card
      const cardH = 10 + bodyLines.length * 3.5 + (step.tip ? tipLines.length * 3.2 + 10 : 0) + 4;
      rgb(doc, ...DARK_CARD); doc.roundedRect(ML, y, CW, cardH, 2, 2, 'F');

      // Step heading row
      textRgb(doc, ...WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(step.h, ML + 5, y + 7);

      // Platform badges
      if (step.platform === 'mobile') {
        platformBadge(doc, W - MR - 14, y + 7, 'mobile');
      } else if (step.platform === 'desktop') {
        platformBadge(doc, W - MR - 17, y + 7, 'desktop');
      } else {
        platformBadge(doc, W - MR - 31, y + 7, 'both');
      }

      // Separator
      doc.setDrawColor(...FAINT);
      doc.setLineWidth(0.3);
      doc.line(ML + 5, y + 9.5, ML + CW - 5, y + 9.5);

      // Body
      textRgb(doc, ...MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(bodyLines, ML + 5, y + 14);

      // Tip
      if (step.tip) {
        let ty = y + 14 + bodyLines.length * 3.5 + 3;
        rgb(doc, [30, 24, 6]); doc.roundedRect(ML + 5, ty, CW - 10, tipLines.length * 3.2 + 8, 1.5, 1.5, 'F');
        doc.setDrawColor(...GOLD, 0.4);
        doc.setLineWidth(0.3);
        doc.roundedRect(ML + 5, ty, CW - 10, tipLines.length * 3.2 + 8, 1.5, 1.5, 'S');
        rgb(doc, ...GOLD); rect(doc, ML + 5, ty, 2, tipLines.length * 3.2 + 8);
        textRgb(doc, ...GOLD_LIGHT);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(tipLines, ML + 10, ty + 5.5);
      }

      y += cardH + 4;
    }
  }

  return pg + 1;
}

// ─── APPENDIX / QUICK REFERENCE ───────────────────────────────────────────────

function addAppendix(doc, pg) {
  doc.addPage();
  drawPageChrome(doc, pg, '?', 'Quick Reference');
  let y = 22;

  y = sectionHeading(doc, y, 'Quick Reference Card');

  // Keyboard shortcuts (desktop)
  textRgb(doc, ...GOLD_LIGHT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Desktop Keyboard Shortcuts', ML, y);
  y += 6;

  const shortcuts = [
    ['Cmd / Ctrl + K', 'Open global search from anywhere in the app'],
    ['Esc', 'Close any open dialog, panel, or modal'],
    ['Enter', 'Confirm and submit forms (rename, add coin, etc.)'],
  ];
  shortcuts.forEach(([key, desc]) => {
    rgb(doc, ...DARK_CARD); doc.roundedRect(ML, y, CW, 8, 1.5, 1.5, 'F');
    rgb(doc, ...DARK_CARD2); doc.roundedRect(ML + 3, y + 2, 32, 4.5, 1, 1, 'F');
    textRgb(doc, ...GOLD_LIGHT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(key, ML + 19, y + 5.2, { align: 'center' });
    textRgb(doc, ...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(desc, ML + 38, y + 5.2);
    y += 10;
  });

  y += 4;

  // Grading scale reference
  textRgb(doc, ...GOLD_LIGHT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Sheldon Grading Scale — Quick Reference', ML, y);
  y += 6;

  const grades = [
    ['PO-1', 'Poor', 'Barely identifiable'],
    ['FR-2', 'Fair', 'Heavily worn, main features visible'],
    ['AG-3', 'About Good', 'Very heavily worn, outline visible'],
    ['G-4/6', 'Good', 'Major design elements clear'],
    ['VG-8/10', 'Very Good', 'Well worn, main features clear'],
    ['F-12/15', 'Fine', 'Moderate to heavy even wear'],
    ['VF-20–35', 'Very Fine', 'Moderate wear on high points'],
    ['EF/XF-40/45', 'Extremely Fine', 'Light wear on highest points only'],
    ['AU-50–58', 'About Unc.', 'Slight wear on highest points'],
    ['MS-60–70', 'Mint State', 'No wear; varies by surface quality'],
    ['PF-60–70', 'Proof', 'Specially struck; mirror-like fields'],
  ];

  const gcols = 3;
  const gcw = (CW - (gcols - 1) * 3) / gcols;
  grades.forEach((g, i) => {
    const col = i % gcols;
    const gx = ML + col * (gcw + 3);
    const gy = y + Math.floor(i / gcols) * 13;
    rgb(doc, ...DARK_CARD); doc.roundedRect(gx, gy, gcw, 10, 1.5, 1.5, 'F');
    // Grade badge
    rgb(doc, ...GOLD_DIM); doc.roundedRect(gx + 2, gy + 2, 20, 5, 1, 1, 'F');
    textRgb(doc, ...GOLD_LIGHT);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(g[0], gx + 12, gy + 5.5, { align: 'center' });
    textRgb(doc, ...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(g[1], gx + 24, gy + 5);
    textRgb(doc, ...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text(g[2], gx + 24, gy + 8.5);
  });

  y += Math.ceil(grades.length / gcols) * 13 + 6;

  // Support section
  y = callout(doc, y, 'Need more help? Visit coinvault.app for the latest documentation, video tutorials, and community forums. For bug reports or feature requests, use the feedback button within the app Settings page.', 'info');

  return pg + 1;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export async function generateCoinVaultPDF() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  // Cover page (page 1)
  addCoverPage(doc);

  // About (pages 2+)
  let nextPage = addAboutSection(doc, 2);

  // FAQ
  nextPage = addFaqSection(doc, nextPage);

  // User Guide
  nextPage = addGuideSection(doc, nextPage);

  // Appendix
  addAppendix(doc, nextPage);

  // Now retroactively fix page numbers (pass total pages)
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    // Re-draw page number area (small footer correction)
    rgb(doc, ...DARK_CARD);
    rect(doc, W - MR - 20, 0, 25, 13);
    textRgb(doc, ...FAINT);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(`${i} / ${total}`, W - MR, 6.8, { align: 'right' });
  }

  doc.save('CoinVault_Documentation_Suite.pdf');
}