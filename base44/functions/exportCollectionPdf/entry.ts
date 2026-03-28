import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Fetch image, resize to target pixel dimensions on a canvas, return clean base64
async function fetchImageBase64(url, targetPx = 400) {
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

function parseValue(str) {
  if (!str) return 0;
  const s = String(str).trim();
  const rangeMatch = s.match(/\$?\s*([\d,.]+)\s*[-to]+\s*\$?\s*([\d,.]+)/i);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1].replace(/,/g, ''));
    const hi = parseFloat(rangeMatch[2].replace(/,/g, ''));
    if (!isNaN(lo) && !isNaN(hi)) return (lo + hi) / 2;
  }
  const cleaned = s.replace(/[^0-9.]/g, '');
  const v = parseFloat(cleaned);
  return isNaN(v) ? 0 : v;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { collectionId, includeThumbnails } = await req.json();
    if (!collectionId) return Response.json({ error: 'collectionId is required' }, { status: 400 });

    const [collections, coins] = await Promise.all([
      base44.entities.Collection.filter({ id: collectionId }),
      base44.entities.Coin.filter({ collection_id: collectionId }),
    ]);
    const collection = collections[0];
    if (!collection) return Response.json({ error: 'Collection not found' }, { status: 404 });

    // ── Layout constants ──
    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const PW = doc.internal.pageSize.getWidth();   // 215.9 mm
    const PH = doc.internal.pageSize.getHeight();  // 279.4 mm
    const M = 16;   // margin
    const UW = PW - M * 2;

    // ── Colour palette ──
    const C = {
      black:     [20, 20, 20],
      darkGray:  [50, 50, 55],
      midGray:   [100, 100, 108],
      lightGray: [155, 155, 162],
      rule:      [210, 210, 215],
      gold:      [166, 130, 36],
      goldLight: [245, 236, 198],
      pageBg:    [252, 251, 248],
      headerBg:  [28, 28, 38],
      headerFg:  [240, 220, 160],
      rowEven:   [249, 249, 247],
      white:     [255, 255, 255],
    };

    let y = M;
    let pageNum = 1;

    // ── Helpers ──
    const newPage = () => {
      doc.addPage();
      y = M;
      pageNum++;
      // Running footer on each new page
      addPageFooter();
    };

    const needsPage = (h) => {
      if (y + h > PH - 18) { newPage(); return true; }
      return false;
    };

    const rule = (yy, color = C.rule, w = 0.3) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(w);
      doc.line(M, yy, PW - M, yy);
    };

    const addPageFooter = () => {
      const fy = PH - 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.lightGray);
      doc.text(`CoinVault  -  ${collection.name}  -  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, M, fy);
      doc.text(`Page ${pageNum}`, PW - M, fy, { align: 'right' });
    };

    // ── COVER PAGE ─────────────────────────────────────────────────────────

    // Background tint
    doc.setFillColor(...C.pageBg);
    doc.rect(0, 0, PW, PH, 'F');

    // Gold top accent band
    doc.setFillColor(...C.gold);
    doc.rect(0, 0, PW, 3, 'F');

    // Title block
    y = 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...C.black);
    doc.text(collection.name, PW / 2, y, { align: 'center' });
    y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(...C.midGray);
    doc.text('Collection Valuation Report', PW / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(9);
    doc.setTextColor(...C.lightGray);
    doc.text(
      new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      PW / 2, y, { align: 'center' }
    );
    y += 12;

    rule(y, C.gold, 0.6);
    y += 10;

    // Description
    if (collection.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...C.midGray);
      const dl = doc.splitTextToSize(collection.description, UW - 40);
      doc.text(dl, PW / 2, y, { align: 'center' });
      y += dl.length * 5 + 6;
    }

    // Summary stats box
    const totalValue = coins.reduce((s, c) => s + parseValue(c.market_value?.this_coin_estimated_value || c.purchase_price || ''), 0);
    const totalCost  = coins.reduce((s, c) => s + parseValue(c.purchase_price || ''), 0);
    const gradedCnt  = coins.filter(c => c.user_grade || c.ai_grade?.suggested_grade).length;
    const withPhotos = coins.filter(c => c.obverse_image || c.set_images?.[0]).length;

    const stats = [
      ['Total Items',   String(coins.length)],
      ['Graded',        String(gradedCnt)],
      ['Est. Value',    `$${Math.round(totalValue).toLocaleString()}`],
      ['Total Cost',    totalCost > 0 ? `$${Math.round(totalCost).toLocaleString()}` : 'N/A'],
      ['With Photos',   String(withPhotos)],
      ['Collection Type', collection.type || 'Custom'],
    ];

    const boxW = UW - 20;
    const boxX = M + 10;
    const boxY = y;
    const colW = boxW / 3;
    const rowH = 18;

    doc.setFillColor(...C.goldLight);
    doc.roundedRect(boxX, boxY, boxW, rowH * 2 + 8, 3, 3, 'F');
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, boxY, boxW, rowH * 2 + 8, 3, 3, 'S');

    for (let i = 0; i < stats.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const sx = boxX + col * colW + colW / 2;
      const sy = boxY + 7 + row * rowH;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...C.gold);
      doc.text(stats[i][1], sx, sy, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.midGray);
      doc.text(stats[i][0], sx, sy + 5, { align: 'center' });
    }

    y = boxY + rowH * 2 + 14;
    rule(y, C.gold, 0.5);
    y += 8;

    // Disclaimer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.lightGray);
    const disclaimer = 'This report is prepared for insurance and documentation purposes. Market values are estimates based on available numismatic data and should be verified by a certified numismatist for formal appraisal.';
    const dl2 = doc.splitTextToSize(disclaimer, UW - 20);
    doc.text(dl2, PW / 2, y, { align: 'center' });

    // Cover footer
    addPageFooter();

    // ── SUMMARY TABLE PAGE ──────────────────────────────────────────────────

    newPage();

    // Section header
    doc.setFillColor(...C.headerBg);
    doc.rect(M, y, UW, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.headerFg);
    doc.text('INVENTORY SUMMARY', M + 4, y + 7);
    doc.text(`${coins.length} item${coins.length !== 1 ? 's' : ''}`, PW - M - 4, y + 7, { align: 'right' });
    y += 13;

    // Column definitions
    const imgColW = includeThumbnails ? 16 : 0;
    const cols = [
      { label: 'Item Description',  w: 50 },
      { label: 'Country',           w: 22 },
      { label: 'Year',              w: 14 },
      { label: 'Grade',             w: 18 },
      { label: 'Composition',       w: 30 },
      { label: 'Purchase',          w: 18 },
      { label: 'Est. Value',        w: 20 },
    ];

    // Scale columns to fill usable width minus image col
    const availW = UW - imgColW;
    const totalDef = cols.reduce((s, c) => s + c.w, 0);
    const scale = availW / totalDef;
    let cx = M + imgColW;
    const colPos = cols.map(c => {
      const pos = { ...c, x: cx, w: c.w * scale };
      cx += pos.w;
      return pos;
    });

    const drawTableHeader = () => {
      doc.setFillColor(...C.headerBg);
      doc.rect(M, y, UW, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...C.headerFg);
      if (includeThumbnails) doc.text('PHOTO', M + 1, y + 5);
      colPos.forEach(c => doc.text(c.label.toUpperCase(), c.x + 2, y + 5));
      y += 9;
    };

    drawTableHeader();

    // Pre-fetch thumbnails in parallel
    const thumbCache = {};
    if (includeThumbnails) {
      await Promise.all(coins.map(async (coin, idx) => {
        const url = coin.obverse_thumb || coin.obverse_image || coin.set_images?.[0];
        if (!url) return;
        const data = await fetchImageBase64(url);
        if (data) thumbCache[idx] = data;
      }));
    }

    const ROW_H = includeThumbnails ? 17 : 8;

    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      if (y + ROW_H + 2 > PH - 18) {
        newPage();
        drawTableHeader();
      }

      // Alternating row background
      if (i % 2 === 0) {
        doc.setFillColor(...C.rowEven);
        doc.rect(M, y - 0.5, UW, ROW_H + 1, 'F');
      }

      // Thumbnail — sized at 14x14mm to keep quality
      if (includeThumbnails && thumbCache[i]) {
        try {
          doc.addImage(thumbCache[i].base64, thumbCache[i].format, M + 1, y + 0.5, 14, 14, undefined, 'MEDIUM');
        } catch (_) { /* skip bad image */ }
      }

      const ty = includeThumbnails ? y + 6 : y + 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.darkGray);

      const name = coin.set_name || `${coin.year || ''} ${coin.denomination || ''}`.trim() || 'Unnamed';
      doc.text(doc.splitTextToSize(name, colPos[0].w - 3)[0], colPos[0].x + 2, ty);
      doc.text((coin.country || '-').substring(0, 14), colPos[1].x + 2, ty);
      doc.text((coin.year_unknown ? 'Unknown' : coin.year || '-').substring(0, 8), colPos[2].x + 2, ty);
      doc.text((coin.user_grade || coin.ai_grade?.suggested_grade || '-').substring(0, 10), colPos[3].x + 2, ty);
      doc.text((coin.composition || '-').substring(0, 18), colPos[4].x + 2, ty);
      doc.text((coin.purchase_price ? `$${coin.purchase_price}` : '-').substring(0, 10), colPos[5].x + 2, ty);
      doc.text((coin.market_value?.this_coin_estimated_value || '-').substring(0, 12), colPos[6].x + 2, ty);

      if (includeThumbnails) {
        doc.setFontSize(5.5);
        doc.setTextColor(...C.lightGray);
        const sub = [
          coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
          coin.coin_series || '',
          coin.storage_location ? `Storage: ${coin.storage_location}` : '',
        ].filter(Boolean).join('  |  ');
        if (sub) doc.text(sub.substring(0, 80), colPos[0].x + 2, ty + 5);
      }

      // Row divider
      doc.setDrawColor(...C.rule);
      doc.setLineWidth(0.15);
      doc.line(M, y + ROW_H, PW - M, y + ROW_H);
      y += ROW_H + 1;
    }

    // Table total row
    y += 2;
    doc.setFillColor(...C.goldLight);
    doc.rect(M, y, UW, 9, 'F');
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(0.4);
    doc.rect(M, y, UW, 9, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.darkGray);
    doc.text('TOTAL ESTIMATED VALUE', M + 4, y + 6);
    doc.text(`$${Math.round(totalValue).toLocaleString()}`, PW - M - 4, y + 6, { align: 'right' });
    y += 14;

    // ── INDIVIDUAL DETAIL PAGES ──────────────────────────────────────────────

    for (const coin of coins) {
      // Each coin gets its own section, starting on a fresh area (not necessarily new page)
      needsPage(60);

      // Coin header bar
      doc.setFillColor(...C.headerBg);
      doc.rect(M, y, UW, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.headerFg);
      const coinTitle = coin.set_name || `${coin.year_unknown ? 'Unknown Year' : (coin.year || '')} ${coin.denomination || ''}`.trim() || 'Unnamed Item';
      doc.text(coinTitle.substring(0, 60), M + 4, y + 6.5);
      if (coin.market_value?.this_coin_estimated_value) {
        doc.text(coin.market_value.this_coin_estimated_value, PW - M - 4, y + 6.5, { align: 'right' });
      }
      y += 12;

      // Images section — fetch obverse + reverse at full quality, display at 40x40mm each
      const imgUrls = coin.set_images?.length > 0
        ? coin.set_images.slice(0, 3)
        : [coin.obverse_image, coin.reverse_image].filter(Boolean);

      if (imgUrls.length > 0 && includeThumbnails) {
        const imgFetches = await Promise.all(imgUrls.map(u => fetchImageBase64(u)));
        const validImgs = imgFetches.filter(Boolean);

        if (validImgs.length > 0) {
          needsPage(48);
          const maxImgW = 42;
          const maxImgH = 42;
          const gap = 4;
          const totalImgW = validImgs.length * maxImgW + (validImgs.length - 1) * gap;
          let imgX = M + (UW - Math.min(totalImgW, UW)) / 2;

          for (let ii = 0; ii < validImgs.length && ii < 3; ii++) {
            try {
              doc.addImage(validImgs[ii].base64, validImgs[ii].format, imgX, y, maxImgW, maxImgH, undefined, 'NONE');
            } catch (_) {}
            // Label under image
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(...C.lightGray);
            const lbl = coin.set_images?.length > 0 ? `Photo ${ii + 1}` : (ii === 0 ? 'Obverse' : 'Reverse');
            doc.text(lbl, imgX + maxImgW / 2, y + maxImgH + 4, { align: 'center' });
            imgX += maxImgW + gap;
          }
          y += maxImgH + 8;
        }
      }

      // Details grid — two columns
      needsPage(30);
      const fields = [
        ['Country',        coin.country],
        ['Year',           coin.year_unknown ? 'Unknown' : coin.year],
        ['Denomination',   coin.denomination],
        ['Mint Mark',      coin.mint_mark && coin.mint_mark !== 'None' ? coin.mint_mark : null],
        ['Series',         coin.coin_series],
        ['Composition',    coin.composition],
        ['Weight',         coin.weight],
        ['Diameter',       coin.diameter],
        ['User Grade',     coin.user_grade],
        ['AI Grade',       coin.ai_grade?.suggested_grade],
        ['Purchase Price', coin.purchase_price ? `$${coin.purchase_price}` : null],
        ['Purchase Date',  coin.purchase_date],
        ['Acquired From',  coin.where_acquired],
        ['Storage',        coin.storage_location],
        ['Est. Value',     coin.market_value?.this_coin_estimated_value],
        ['Price Trend',    coin.market_value?.price_trend],
      ].filter(([, v]) => v);

      const halfW = (UW - 6) / 2;
      const fieldH = 7;

      for (let fi = 0; fi < fields.length; fi += 2) {
        needsPage(fieldH + 1);
        const row = Math.floor(fi / 2);
        if (fi % 2 === 0 && row % 2 === 0) {
          doc.setFillColor(...C.rowEven);
          doc.rect(M, y, UW, fieldH, 'F');
        }
        [[0, M], [1, M + halfW + 6]].forEach(([offset, fx]) => {
          const f = fields[fi + offset];
          if (!f) return;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(...C.midGray);
          doc.text(f[0].toUpperCase(), fx + 2, y + 4.5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...C.darkGray);
          const val = doc.splitTextToSize(String(f[1]), halfW - 35)[0];
          doc.text(val, fx + 32, y + 4.5);
        });
        y += fieldH;
        doc.setDrawColor(...C.rule);
        doc.setLineWidth(0.1);
        doc.line(M, y, PW - M, y);
      }

      // Enrichment summary if available
      if (coin.enrichment?.coin_full_name || coin.enrichment?.series_history || coin.enrichment?.historical_context) {
        y += 4;
        needsPage(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...C.gold);
        doc.text('HISTORICAL NOTES', M + 2, y + 5);
        y += 8;

        const enrichText = [
          coin.enrichment.series_history,
          coin.enrichment.historical_context,
          coin.enrichment.collector_notes,
        ].filter(Boolean).join(' ').substring(0, 600);

        if (enrichText) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(...C.midGray);
          const lines = doc.splitTextToSize(enrichText, UW - 4);
          const blockH = lines.length * 4 + 4;
          needsPage(blockH);
          doc.text(lines, M + 2, y);
          y += blockH;
        }
      }

      // Notes
      if (coin.condition_notes || coin.personal_notes) {
        y += 2;
        needsPage(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...C.midGray);
        if (coin.condition_notes) {
          doc.text('Condition Notes:', M + 2, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...C.darkGray);
          const cnLines = doc.splitTextToSize(coin.condition_notes, UW - 8);
          needsPage(cnLines.length * 4 + 6);
          doc.text(cnLines, M + 38, y);
          y += cnLines.length * 4 + 3;
        }
        if (coin.personal_notes) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...C.midGray);
          doc.text('Notes:', M + 2, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...C.darkGray);
          const pnLines = doc.splitTextToSize(coin.personal_notes, UW - 8);
          needsPage(pnLines.length * 4 + 6);
          doc.text(pnLines, M + 20, y);
          y += pnLines.length * 4 + 3;
        }
      }

      // Section spacer
      y += 6;
      rule(y, C.rule, 0.2);
      y += 8;
    }

    // ── FINAL SUMMARY PAGE ──────────────────────────────────────────────────
    newPage();

    doc.setFillColor(...C.headerBg);
    doc.rect(M, y, UW, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.headerFg);
    doc.text('VALUATION SUMMARY', M + 4, y + 7);
    y += 14;

    const summaryRows = [
      ['Total Items in Collection',    String(coins.length)],
      ['Items with Photos',            String(withPhotos)],
      ['Graded Items',                 String(gradedCnt)],
      ['Total Purchase Cost',          totalCost > 0 ? `$${Math.round(totalCost).toLocaleString()}` : 'Not recorded'],
      ['Total Estimated Market Value', `$${Math.round(totalValue).toLocaleString()}`],
      ['Gain / Loss',                  totalCost > 0 ? `$${Math.round(totalValue - totalCost).toLocaleString()}` : 'N/A'],
      ['Report Date',                  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Prepared For',                 user.full_name || user.email],
    ];

    for (let i = 0; i < summaryRows.length; i++) {
      if (i % 2 === 0) {
        doc.setFillColor(...C.rowEven);
        doc.rect(M, y, UW, 8, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...C.midGray);
      doc.text(summaryRows[i][0], M + 4, y + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.darkGray);
      doc.text(summaryRows[i][1], PW - M - 4, y + 5.5, { align: 'right' });
      y += 8;
      doc.setDrawColor(...C.rule);
      doc.setLineWidth(0.1);
      doc.line(M, y, PW - M, y);
    }

    y += 8;
    rule(y, C.gold, 0.6);
    y += 8;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.lightGray);
    const sig = 'This document was generated by CoinVault. All market values are estimates and should be confirmed by a certified professional numismatist for insurance or legal purposes.';
    doc.text(doc.splitTextToSize(sig, UW), M, y, { align: 'left' });

    // ── Output ──────────────────────────────────────────────────────────────
    const pdfBytes = doc.output('arraybuffer');
    const safeName = collection.name.replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/ +/g, '_');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}_CoinVault_Report.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});