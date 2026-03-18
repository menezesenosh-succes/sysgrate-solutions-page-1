const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, "data.json");

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://sysgrate-solutions-page-1.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ─── Data helpers ─────────────────────────────────────────────────────────────
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const init = {
      total_views: 0,
      today_views: 0,
      last_reset_date: new Date().toISOString().split("T")[0],
      hourly: {},   // "YYYY-MM-DD HH" → count
      daily: {},    // "YYYY-MM-DD"    → count
      referrers: {},
      countries: {},
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function resetDailyIfNeeded(data) {
  const today = new Date().toISOString().split("T")[0];
  if (data.last_reset_date !== today) {
    data.today_views = 0;
    data.last_reset_date = today;
  }
  return data;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/track
 * Body: { referrer?: string, country?: string }
 * Records a page view.
 */
app.post("/api/track", (req, res) => {
  let data = loadData();
  data = resetDailyIfNeeded(data);

  const now = new Date();
  const dateStr  = now.toISOString().split("T")[0];                          // "2025-01-15"
  const hourStr  = `${dateStr} ${String(now.getUTCHours()).padStart(2, "0")}`; // "2025-01-15 14"

  // Totals
  data.total_views += 1;
  data.today_views += 1;

  // Hourly bucket (keep last 48 h)
  data.hourly[hourStr] = (data.hourly[hourStr] || 0) + 1;
  const allHours = Object.keys(data.hourly).sort();
  if (allHours.length > 48) {
    delete data.hourly[allHours[0]];
  }

  // Daily bucket (keep last 30 days)
  data.daily[dateStr] = (data.daily[dateStr] || 0) + 1;
  const allDays = Object.keys(data.daily).sort();
  if (allDays.length > 30) {
    delete data.daily[allDays[0]];
  }

  // Referrer (top 10)
  const referrer = req.body?.referrer || "Direct";
  data.referrers[referrer] = (data.referrers[referrer] || 0) + 1;

  // Country (top 10)
  const country = req.body?.country || "Unknown";
  data.countries[country] = (data.countries[country] || 0) + 1;

  saveData(data);
  res.json({ success: true, total: data.total_views });
});

/**
 * GET /api/stats
 * Returns all analytics data.
 */
app.get("/api/stats", (req, res) => {
  let data = loadData();
  data = resetDailyIfNeeded(data);
  saveData(data);

  // Calculate yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const yesterday_views = data.daily[yesterdayStr] || 0;

  // Last 7 days
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    last7.push({ date: ds, views: data.daily[ds] || 0 });
  }

  // Last 30 days total
  const last30Total = Object.values(data.daily).reduce((a, b) => a + b, 0);

  // Top referrers
  const topReferrers = Object.entries(data.referrers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Top countries
  const topCountries = Object.entries(data.countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  res.json({
    total_views:     data.total_views,
    today_views:     data.today_views,
    yesterday_views,
    last30_views:    last30Total,
    last7,
    hourly:          data.hourly,
    top_referrers:   topReferrers,
    top_countries:   topCountries,
  });
});

/**
 * GET /api/health
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Sysgrate tracker running on port ${PORT}`);
});
