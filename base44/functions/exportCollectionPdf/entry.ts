import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Fetch image as compact base64 — prefer thumbnail URLs for small file size
async function fetchImageBase64(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const format = contentType.includes('png') ? 'PNG' : 'JPEG';
    return { base64: `data:${contentType};base64,${base64}`, format };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { collectionId, includeThumbnails } = await req.json();
    if (!collectionId) return Response.json({ error: 'collectionId is required' }, { status: 400 });

    const collections = await base44.entities.Collection.filter({ id: collectionId });
    const collection = collections[0];
    if (!collection) return Response.json({ error: 'Collection not found' }, { status: 404 });

    const coins = await base44.entities.Coin.filter({ collection_id: collectionId });

    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const pw = doc.internal.pageSize.getWidth();   // 215.9
    const ph = doc.internal.pageSize.getHeight();   // 279.4
    const m = 14; // margin
    const uw = pw - m * 2; // usable width
    let y = m;

    const newPageIfNeeded = (need) => {
      if (y + need > ph - 12) { doc.addPage(); y = m; return true; }
      return false;
    };

    // ── Colours ──
    const darkGray = [40, 40, 40];
    const midGray = [100, 100, 100];
    const lightGray = [160, 160, 160];
    const headerBg = [35, 35, 45];
    const headerText = [255, 255, 255];
    const accentGold = [180, 148, 46];
    const rowAlt = [248, 248, 248];

    // ── Cover page ──
    // Gold accent line
    doc.setDrawColor(...accentGold);
    doc.setLineWidth(0.8);
    doc.line(m, 30, pw - m, 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...darkGray);
    doc.text(collection.name, pw / 2, 42, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...midGray);
    doc.text('Collection Report', pw / 2, 50, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(...lightGray);
    doc.text(
      `${coins.length} item${coins.length !== 1 ? 's' : ''}  ·  ${collection.type || 'Custom'}  ·  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      pw / 2, 57, { align: 'center' }
    );

    if (collection.description) {
      doc.setFontSize(8);
      doc.setTextColor(...lightGray);
      const dl = doc.splitTextToSize(collection.description, uw - 30);
      doc.text(dl, pw / 2, 65, { align: 'center' });
    }

    // Summary box
    const totalValue = coins.reduce((s, c) => {
      const v = parseFloat((c.market_value?.this_coin_estimated_value || c.purchase_price || '0').replace(/[^0-9.]/g, ''));
      return s + (isNaN(v) ? 0 : v);
    }, 0);
    const gradedCount = coins.filter(c => c.user_grade || c.ai_grade).length;

    y = 78;
    doc.setFillColor(245, 245, 242);
    doc.roundedRect(m + 20, y, uw - 40, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.text(
      `Total: ${coins.length}     ·     Graded: ${gradedCount}     ·     Est. Value: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      pw / 2, y + 9, { align: 'center' }
    );

    doc.setDrawColor(...accentGold);
    doc.line(m, y + 22, pw - m, y + 22);

    // ── Table pages ──
    doc.addPage();
    y = m;

    // Column layout — compact
    const thumbW = includeThumbnails ? 14 : 0;
    const thumbGap = includeThumbnails ? 2 : 0;
    const colDefs = [
      { label: 'Coin',        w: 46 },
      { label: 'Country',     w: 24 },
      { label: 'Grade',       w: 20 },
      { label: 'Composition', w: 28 },
      { label: 'Purchased',   w: 18 },
      { label: 'Est. Value',  w: 20 },
    ];
    // Calculate starting x for each column
    let cx = m + thumbW + thumbGap;
    const colPositions = colDefs.map(c => { const pos = cx; cx += c.w; return { ...c, x: pos }; });

    const drawHeader = () => {
      doc.setFillColor(...headerBg);
      doc.rect(m, y, uw, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...headerText);
      if (includeThumbnails) doc.text('Img', m + 1, y + 5);
      colPositions.forEach(c => doc.text(c.label, c.x + 1, y + 5));
      y += 9;
      doc.setTextColor(...darkGray);
    };

    drawHeader();

    const rowH = includeThumbnails ? 16 : 8;

    // Pre-fetch all thumbnail images in parallel for speed
    let thumbCache = {};
    if (includeThumbnails) {
      const thumbPromises = coins.map(async (coin, idx) => {
        // Prefer thumbnail, fall back to full image
        const url = coin.obverse_thumb || coin.obverse_image || coin.set_images?.[0];
        if (!url) return;
        const data = await fetchImageBase64(url);
        if (data) thumbCache[idx] = data;
      });
      await Promise.all(thumbPromises);
    }

    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];

      // Check page break — redraw header on new page
      if (y + rowH + 2 > ph - 12) {
        doc.addPage();
        y = m;
        drawHeader();
      }

      // Alternate row
      if (i % 2 === 0) {
        doc.setFillColor(...rowAlt);
        doc.rect(m, y - 0.5, uw, rowH + 1, 'F');
      }

      // Thumbnail
      if (includeThumbnails && thumbCache[i]) {
        try {
          doc.addImage(thumbCache[i].base64, thumbCache[i].format, m + 1, y + 0.5, 12, 12);
        } catch { /* skip */ }
      }

      const textY = includeThumbnails ? y + 6 : y + 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...darkGray);

      const coinName = (coin.set_name || `${coin.year || ''} ${coin.denomination || ''}`.trim()) || 'Unnamed';
      doc.text(coinName.substring(0, 28), colPositions[0].x + 1, textY);

      doc.text((coin.country || '-').substring(0, 14), colPositions[1].x + 1, textY);
      doc.text((coin.user_grade || coin.ai_grade?.suggested_grade || '-').substring(0, 12), colPositions[2].x + 1, textY);
      doc.text((coin.composition || '-').substring(0, 18), colPositions[3].x + 1, textY);

      const pp = coin.purchase_price ? `$${coin.purchase_price}` : '-';
      doc.text(pp.substring(0, 10), colPositions[4].x + 1, textY);

      const ev = coin.market_value?.this_coin_estimated_value || '-';
      doc.text(ev.substring(0, 10), colPositions[5].x + 1, textY);

      // Sub-line: mint mark, series, storage
      if (includeThumbnails) {
        doc.setFontSize(5.5);
        doc.setTextColor(...lightGray);
        const sub = [
          coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
          coin.coin_series || '',
          coin.storage_location ? `📦 ${coin.storage_location}` : '',
        ].filter(Boolean).join('  ·  ');
        if (sub) doc.text(sub.substring(0, 70), colPositions[0].x + 1, textY + 5);
        doc.setTextColor(...darkGray);
      }

      // Row separator
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      y += rowH + 1;
      doc.line(m, y, pw - m, y);
      y += 1;
    }

    // ── Footer ──
    y += 6;
    newPageIfNeeded(10);
    doc.setDrawColor(...accentGold);
    doc.setLineWidth(0.5);
    doc.line(m + 30, y, pw - m - 30, y);
    y += 5;
    doc.setFontSize(6);
    doc.setTextColor(...lightGray);
    doc.text(
      `CoinVault  ·  ${collection.name}  ·  ${new Date().toISOString().split('T')[0]}`,
      pw / 2, y, { align: 'center' }
    );

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${collection.name.replace(/[^a-zA-Z0-9 ]/g, '_')}_report.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});