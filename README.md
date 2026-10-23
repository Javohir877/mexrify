# MEXRIFY 🎵

Ko'k rangli zamonaviy musiqa platformasi: dunyo chartlari, millionlab qo'shiqlar, phonk, pleylistlar va to'liq ijro.

**Texnologiyalar:** React 18 + Vite (frontend) · Node.js + Express (backend/API)

## Imkoniyatlar

- 🌍 Deezer katalogi: 90M+ trek, artistlar, albomlar, janrlar, dunyo TOP 100
- ⚡ Phonk bo'limi: Drift, Brazilian, Memphis, House va boshqalar
- 🎧 To'liq ijro: mashhur qo'shiqlar **YouTube'ning rasmiy pleyeri** orqali, mustaqil artistlar **Audius** orqali
- 🔎 Qidiruv: qo'shiq, artist, albom, pleylist bo'yicha tablar bilan
- 💙 Kutubxona: yoqtirganlar, o'z pleylistlaringiz, saqlangan albom/artistlar, tinglash tarixi
- 🎛 Pleyer: navbat, aralash, takrorlash, avtoijro (o'xshash qo'shiqlar), klaviatura (Space, ←/→, N/P), aylanuvchi vinil, to'liq ekran
- 📱 Telefon va kompyuterga moslashgan dizayn

## Tuzilma

```
mexrify/
├── client/          React + Vite frontend
│   └── src/
│       ├── components/   Pleyer, kartalar, trek ro'yxatlari
│       ├── pages/        Sahifalar (Asosiy, Qidiruv, Phonk, Artist, Albom...)
│       └── lib/          API, pleyer dvigateli, kutubxona holati
├── server/          Express backend
│   └── src/
│       ├── index.js      API marshrutlari + frontendni berish
│       ├── youtube.js    YouTube qidiruvi va doimiy kesh
│       └── cache.js      Xotiradagi kesh
├── render.yaml      Render.com'ga bir bosishda deploy
└── .github/workflows/pages.yml   GitHub Pages'ga avtomatik deploy
```

### Backend API

| Endpoint | Vazifasi |
|---|---|
| `GET /api/health` | Server holati |
| `GET /api/config` | To'liq ijro (YouTube) yoqilganmi |
| `GET /api/deezer/*` | Deezer katalogi proksi (keshlangan, faqat ruxsat etilgan yo'llar) |
| `GET /api/audius/*` | Audius proksi (keshlangan) |
| `GET /api/youtube/find?id=&q=` | Trek uchun YouTube video topish (natija hammaga umumiy keshlanadi) |

YouTube API kaliti **faqat serverda** turadi va brauzerga hech qachon yuborilmaydi.

## Lokal ishga tushirish

Node.js 22.9+ kerak.

```bash
npm install
npm run dev
```

Brauzerda: http://localhost:5173 (backend 4000-portda ishlaydi, Vite `/api` ni unga yo'naltiradi).

### To'liq ijroni yoqish

1. [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com) da **YouTube Data API v3** ni yoqing va API key yarating
2. `server/.env.example` faylidan nusxa olib, nomini `server/.env` qiling
3. `YOUTUBE_API_KEY=` qatoriga kalitni yozing va serverni qayta ishga tushiring

`.env` fayli GitHub'ga yuklanmaydi.

## Internetga joylash

### 1-variant: Render.com (tavsiya etiladi — backend + frontend birga)

1. [render.com](https://render.com) ga GitHub orqali kiring
2. **New → Blueprint** → shu repozitoriyni tanlang (`render.yaml` avtomatik o'qiladi)
3. `YOUTUBE_API_KEY` maydoniga kalitingizni kiriting → **Apply**
4. Bir necha daqiqadan so'ng sayt `https://mexrify-xxxx.onrender.com` manzilida ishlaydi

> Bepul rejada server 15 daqiqa harakatsizlikdan keyin uxlaydi, birinchi ochilish ~30 soniya olishi mumkin.

### 2-variant: GitHub Pages (faqat frontend)

Tayyor build `gh-pages` branchida turadi va `https://<username>.github.io/mexrify/` da ochiladi.
Backendsiz ham ishlaydi (30s preview + Audius to'liq treklar).

Qo'lda yangilash:

```bash
VITE_BASE=/mexrify/ VITE_API_URL=https://mexrify-xxxx.onrender.com npm run build
```

so'ng `client/dist` ichidagini `gh-pages` branchga yuklang. `VITE_API_URL` Render'dagi backend manzili; u berilsa, Pages'dagi sayt ham YouTube orqali to'liq ijro qiladi.

## Huquqiy eslatma

MEXRIFY musiqa fayllarini o'zida saqlamaydi. Kontent rasmiy ochiq API'lar orqali olinadi: Deezer (30 soniyalik preview), Audius (mustaqil artistlar ruxsati bilan to'liq) va YouTube (rasmiy embed pleyer, YouTube shartlariga muvofiq).
