import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Fetch image as base64 for embedding in PDF
async function fetchImageBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
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
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collectionId, includeThumbnails } = await req.json();
    if (!collectionId) {
      return Response.json({ error: 'collectionId is required' }, { status: 400 });
    }

    // Fetch collection and coins
    const collections = await base44.entities.Collection.filter({ id: collectionId });
    const collection = collections[0];
    if (!collection) {
      return Response.json({ error: 'Collection not found' }, { status: 404 });
    }

    const coins = await base44.entities.Coin.filter({ collection_id: collectionId });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const usableWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper to check page break
    const checkPage = (needed) => {
      if (y + needed > pageHeight - 20) {
        doc.addPage();
        y = margin;
      }
    };

    // Title page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(collection.name, pageWidth / 2, 40, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Collection Report`, pageWidth / 2, 50, { align: 'center' });
    doc.text(`${coins.length} coin${coins.length !== 1 ? 's' : ''} · ${collection.type || 'Custom'}`, pageWidth / 2, 58, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 66, { align: 'center' });

    if (collection.description) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      const descLines = doc.splitTextToSize(collection.description, usableWidth - 40);
      doc.text(descLines, pageWidth / 2, 78, { align: 'center' });
    }

    // Summary stats
    const totalValue = coins.reduce((sum, c) => {
      const val = parseFloat(
        c.market_value?.this_coin_estimated_value?.replace(/[^0-9.]/g, '') ||
        c.purchase_price || 0
      );
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    y = 100;
    doc.setDrawColor(200);
    doc.line(margin + 20, y, pageWidth - margin - 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'bold');
    const stats = [
      `Total Coins: ${coins.length}`,
      `Estimated Value: $${totalValue.toLocaleString()}`,
      `Graded: ${coins.filter(c => c.user_grade || c.ai_grade).length}`,
    ];
    doc.text(stats.join('    ·    '), pageWidth / 2, y, { align: 'center' });

    // Coin listing
    doc.addPage();
    y = margin;

    // Table header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80);
    doc.setFillColor(245, 245, 245);

    const thumbColW = includeThumbnails ? 22 : 0;
    const cols = [
      { label: '', x: margin, w: thumbColW },
      { label: 'Coin', x: margin + thumbColW, w: includeThumbnails ? 42 : 55 },
      { label: 'Country', x: margin + thumbColW + (includeThumbnails ? 42 : 55), w: 28 },
      { label: 'Grade', x: margin + thumbColW + (includeThumbnails ? 70 : 83), w: 22 },
      { label: 'Composition', x: margin + thumbColW + (includeThumbnails ? 92 : 105), w: 30 },
      { label: 'Purchase', x: margin + thumbColW + (includeThumbnails ? 122 : 135), w: 22 },
      { label: 'Value', x: margin + thumbColW + (includeThumbnails ? 144 : 157), w: 22 },
    ];

    const headerHeight = 8;
    doc.rect(margin, y, usableWidth, headerHeight, 'F');
    cols.forEach(col => {
      if (col.label) doc.text(col.label, col.x + 1, y + 5.5);
    });
    y += headerHeight + 2;

    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40);
    const rowHeight = includeThumbnails ? 20 : 10;

    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];
      checkPage(rowHeight + 4);

      // Alternate row bg
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 1, usableWidth, rowHeight + 2, 'F');
      }

      const textY = includeThumbnails ? y + 10 : y + 4;

      // Thumbnail
      if (includeThumbnails && coin.obverse_image) {
        const imgData = await fetchImageBase64(coin.obverse_image);
        if (imgData) {
          try {
            doc.addImage(imgData.base64, imgData.format, margin + 1, y, 18, 18);
          } catch {
            // skip if image fails
          }
        }
      }

      doc.setFontSize(8);
      const coinName = `${coin.year || ''} ${coin.denomination || ''}`.trim() || 'Unnamed';
      doc.text(coinName.substring(0, 25), cols[1].x + 1, textY);

      doc.text((coin.country || '-').substring(0, 16), cols[2].x + 1, textY);
      doc.text((coin.user_grade || coin.ai_grade?.suggested_grade || '-').substring(0, 12), cols[3].x + 1, textY);
      doc.text((coin.composition || '-').substring(0, 16), cols[4].x + 1, textY);

      const purchasePrice = coin.purchase_price ? `$${coin.purchase_price}` : '-';
      doc.text(purchasePrice.substring(0, 10), cols[5].x + 1, textY);

      const estValue = coin.market_value?.this_coin_estimated_value || '-';
      doc.text(estValue.substring(0, 10), cols[6].x + 1, textY);

      // Mint mark and series on second line if thumbnails
      if (includeThumbnails) {
        doc.setFontSize(6);
        doc.setTextColor(130);
        const details = [
          coin.mint_mark && coin.mint_mark !== 'None' ? `Mint: ${coin.mint_mark}` : '',
          coin.coin_series || '',
          coin.storage_location ? `Storage: ${coin.storage_location}` : '',
        ].filter(Boolean).join(' · ');
        if (details) doc.text(details.substring(0, 60), cols[1].x + 1, textY + 5);
        doc.setTextColor(40);
      }

      y += rowHeight + 2;

      // Separator line
      doc.setDrawColor(230);
      doc.line(margin, y - 1, pageWidth - margin, y - 1);
    }

    // Footer on last page
    checkPage(15);
    y += 8;
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(`CoinVault Collection Report · ${collection.name} · Generated ${new Date().toISOString().split('T')[0]}`, pageWidth / 2, y, { align: 'center' });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${collection.name.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf"`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});