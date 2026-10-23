// Oddiy xotiradagi TTL kesh (eng eski yozuvlar o'chiriladi)
export class TTLCache {
  constructor({ ttl = 10 * 60e3, max = 2000 } = {}) {
    this.ttl = ttl;
    this.max = max;
    this.map = new Map();
  }

  get(key) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.exp) { this.map.delete(key); return undefined; }
    return hit.value;
  }

  set(key, value, ttl = this.ttl) {
    if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(key, { value, exp: Date.now() + ttl });
  }
}

// Bir xil so'rov bir vaqtda kelsa, tashqi API'ga faqat bitta so'rov ketadi
export function cachedFetcher(cache) {
  const inflight = new Map();
  return async function fetchJson(url, ttl) {
    const hit = cache.get(url);
    if (hit) return hit;
    if (inflight.has(url)) return inflight.get(url);
    const p = (async () => {
      const res = await fetch(url, { headers: { 'User-Agent': 'MEXRIFY/1.0' } });
      if (!res.ok) throw Object.assign(new Error(`Upstream ${res.status}`), { status: res.status });
      const data = await res.json();
      cache.set(url, data, ttl);
      return data;
    })().finally(() => inflight.delete(url));
    inflight.set(url, p);
    return p;
  };
}
