// YouTube'dan trekning rasmiy videosini topish.
// Natijalar diskka yoziladi: bir marta topilgan qo'shiq hamma foydalanuvchilar uchun limitsiz qayta ishlatiladi.
import fs from 'node:fs';
import path from 'node:path';

export function createYoutube({ apiKey, cacheFile }) {
  let store = {};
  let quotaResetAt = 0;
  let saveTimer = null;

  try {
    store = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch { /* birinchi ishga tushish */ }

  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      fs.mkdir(path.dirname(cacheFile), { recursive: true }, () => {
        fs.writeFile(cacheFile, JSON.stringify(store), () => { });
      });
    }, 2000);
  }

  const enabled = () => !!apiKey && Date.now() > quotaResetAt;

  async function find(id, query) {
    if (store[id]) return { ids: store[id], cached: true };
    if (!apiKey) throw Object.assign(new Error('YouTube kaliti sozlanmagan'), { status: 503 });
    if (!enabled()) throw Object.assign(new Error('Kunlik YouTube limiti tugadi'), { status: 429 });

    const params = new URLSearchParams({
      part: 'snippet', type: 'video', videoEmbeddable: 'true', videoCategoryId: '10',
      maxResults: '5', q: query, key: apiKey,
    });
    const res = await fetch('https://www.googleapis.com/youtube/v3/search?' + params);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = data.error?.errors?.[0]?.reason;
      if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
        quotaResetAt = Date.now() + 60 * 60e3; // bir soatdan keyin qayta urinib ko'ramiz
        throw Object.assign(new Error('Kunlik YouTube limiti tugadi'), { status: 429 });
      }
      throw Object.assign(new Error(data.error?.message || 'YouTube xatosi'), { status: 502 });
    }
    const ids = (data.items || []).map(i => i.id?.videoId).filter(Boolean);
    store[id] = ids;
    persist();
    return { ids, cached: false };
  }

  function forget(id) {
    delete store[id];
    persist();
  }

  return { find, forget, enabled, size: () => Object.keys(store).length };
}
