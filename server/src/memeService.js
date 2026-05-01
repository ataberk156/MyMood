const MEME_API_BASE = 'https://meme-api.com/gimme/TurkishMemeCommunity';

// wsrv.nl is a free public image CDN proxy — serves Reddit images with CORS headers
function proxyImg(url) {
  if (!url || url.startsWith('https://placehold.co')) return url;
  // Strip protocol for wsrv.nl (it adds https:// itself)
  const clean = url.replace(/^https?:\/\//, '');
  return `https://wsrv.nl/?url=${encodeURIComponent(clean)}&n=-1`;
}

// Fetch `count` SFW image memes from the public Meme API
export async function fetchMemes(count = 1) {
  const url = `${MEME_API_BASE}/${Math.min(count, 50)}`;

  let raw;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    raw = await res.json();
  } catch (err) {
    console.error('[memeService] API error:', err.message);
    return placeholders(count);
  }

  // API returns a single object for count=1 but the /gimme/{n} endpoint always returns { memes: [...] }
  const list = Array.isArray(raw.memes) ? raw.memes : [raw];

  const filtered = list
    .filter(m => !m.nsfw && !m.spoiler)
    .filter(m => {
      const u = (m.url || '').toLowerCase();
      return u.endsWith('.jpg') || u.endsWith('.jpeg') || u.endsWith('.png') ||
             u.endsWith('.gif') || u.endsWith('.webp');
    })
    .map(m => ({
      url: proxyImg(m.url),
      title: m.title || 'Meme',
      subreddit: m.subreddit || 'memes',
      preview: proxyImg(m.url)   // always use i.redd.it direct URL; preview.redd.it has signed tokens that break
    }));

  // Pad with placeholders if not enough clean memes came back
  while (filtered.length < count) {
    filtered.push(...placeholders(count - filtered.length));
  }

  return filtered.slice(0, count);
}

function placeholders(n) {
  return Array.from({ length: n }, (_, i) => ({
    url: `https://placehold.co/400x300/1a1a2e/ffffff?text=Meme+${i + 1}`,
    title: `Meme ${i + 1}`,
    subreddit: 'placeholder',
    preview: `https://placehold.co/400x300/1a1a2e/ffffff?text=Meme+${i + 1}`
  }));
}
