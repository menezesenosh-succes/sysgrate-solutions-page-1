# Sysgrate Page-View Tracker 📊

A lightweight Node.js backend that counts page views for  
`https://sysgrate-solutions-page-1.vercel.app/`

---

## 🚀 Deploy in 5 minutes (Render.com — free tier)

1. Push this folder to a **new GitHub repo** (e.g. `sysgrate-tracker`).

2. Go to [render.com](https://render.com) → **New → Web Service**.

3. Connect your GitHub repo, then set:
   | Field | Value |
   |---|---|
   | Environment | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Plan | **Free** |

4. Click **Create Web Service**.  
   Render gives you a URL like `https://sysgrate-tracker.onrender.com`.

5. Open `tracking-snippet.html`, replace `YOUR_BACKEND_URL`  
   with your Render URL, then paste the snippet before `</body>`  
   in your Vercel project's `index.html`.

---

## 📡 API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/track` | Record a page view |
| `GET` | `/api/stats` | Get all analytics |
| `GET` | `/api/health` | Health check |

### POST /api/track — Body
```json
{ "referrer": "https://google.com", "country": "IN" }
```

### GET /api/stats — Response
```json
{
  "total_views": 1234,
  "today_views": 42,
  "yesterday_views": 61,
  "last30_views": 980,
  "last7": [ { "date": "2025-01-09", "views": 120 }, ... ],
  "top_referrers": [ { "name": "Direct", "count": 800 }, ... ],
  "top_countries": [ { "name": "IN", "count": 400 }, ... ]
}
```

---

## 🗂 Data Storage

Views are stored in `data.json` (auto-created on first run).  
No database required.

> **Note**: Render's free tier has ephemeral storage — data resets on deploy.  
> For persistent storage, upgrade to a paid plan or switch to a  
> Supabase/PlanetScale database (ask for a DB-backed version).
