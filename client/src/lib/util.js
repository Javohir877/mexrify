export const fmt = sec => {
  sec = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};
export const num = n => new Intl.NumberFormat('uz-UZ').format(n || 0);
export const shuffleArr = a => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;
export const heroColor = seed => `hsl(${205 + hash(seed) % 35} 75% ${28 + hash(seed + 'l') % 14}%)`;
export const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech';
};

export const COVER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d2a5c"/><stop offset="1" stop-color="#2f7bff"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><path d="M42 30v30.5a8 8 0 1 0 4 7V42l20-5v17.5a8 8 0 1 0 4 7V24z" fill="#fff" fill-opacity=".85"/></svg>');
export const onImgError = e => { if (e.currentTarget.src !== COVER) e.currentTarget.src = COVER; };
