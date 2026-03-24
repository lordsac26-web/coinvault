import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Generate a small JPEG thumbnail by re-encoding the image at lower quality/size
// Uses sharp which is supported in Deno Deploy
const THUMB_MAX = 150;

async function createThumbnail(imageUrl) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const inputBytes = new Uint8Array(buffer);

    // Use sharp for image processing (Deno Deploy compatible)
    const sharp = (await import('npm:sharp@0.33.2')).default;

    const thumbBuffer = await sharp(inputBytes)
      .resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 65 })
      .toBuffer();

    return new Uint8Array(thumbBuffer);
  } catch (err) {
    console.error('Thumbnail creation failed:', err.message);
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

    if (coinId && Object.keys(updates).length > 0) {
      await base44.entities.Coin.update(coinId, updates);
    }

    return Response.json({ success: true, ...updates });
  } catch (error) {
    console.error('generateThumbnail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});