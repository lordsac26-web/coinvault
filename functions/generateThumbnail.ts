import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Generate a small JPEG thumbnail from an image URL using canvas
// Target: ~150px for PDF embedding — keeps file size tiny
const THUMB_SIZE = 150;

async function createThumbnail(imageUrl) {
  // Fetch original image as bytes
  const res = await fetch(imageUrl);
  if (!res.ok) return null;
  const originalBytes = await res.arrayBuffer();

  // Use the Imagescript library for server-side image processing
  const { Image } = await import('npm:imagescript@1.3.0');

  const img = await Image.decode(new Uint8Array(originalBytes));

  // Resize to thumbnail maintaining aspect ratio (fit within THUMB_SIZE square)
  const scale = Math.min(THUMB_SIZE / img.width, THUMB_SIZE / img.height);
  const newW = Math.round(img.width * scale);
  const newH = Math.round(img.height * scale);
  img.resize(newW, newH);

  // Encode as JPEG at 70% quality for small file size
  const thumbBytes = await img.encodeJPEG(70);

  return thumbBytes;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { coinId, obverseUrl, reverseUrl } = await req.json();

    const updates = {};

    if (obverseUrl) {
      const thumbBytes = await createThumbnail(obverseUrl);
      if (thumbBytes) {
        const file = new File([thumbBytes], 'obv_thumb.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updates.obverse_thumb = file_url;
      }
    }

    if (reverseUrl) {
      const thumbBytes = await createThumbnail(reverseUrl);
      if (thumbBytes) {
        const file = new File([thumbBytes], 'rev_thumb.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        updates.reverse_thumb = file_url;
      }
    }

    // Update the coin record with thumbnail URLs
    if (coinId && Object.keys(updates).length > 0) {
      await base44.entities.Coin.update(coinId, updates);
    }

    return Response.json({ success: true, ...updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});