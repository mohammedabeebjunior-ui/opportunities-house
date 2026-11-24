// Builds a sitemap of the homepage, info pages and every published opportunity.
// Served at /sitemap-opportunities.xml (see vercel.json).
const { query } = require("./_supabase");
const SITE = "https://www.opportunitieshouse.com.ng";

module.exports = async (req, res) => {
  try {
    const origin = `https://${req.headers.host}`;
    const rows = await query(origin, "opportunities?status=eq.published&select=slug,published_at,created_at&order=created_at.desc&limit=5000");
    const day = (d) => (d ? String(d).slice(0, 10) : null);
    const urls = [
      { loc: SITE + "/" },
      { loc: SITE + "/about.html" },
      { loc: SITE + "/contact.html" },
      ...rows.map((r) => ({ loc: `${SITE}/opportunity/${encodeURIComponent(r.slug)}`, lastmod: day(r.published_at || r.created_at) })),
    ];
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n") +
      `\n</urlset>\n`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    res.end(xml);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Cache-Control", "no-store");
    res.end("Sitemap temporarily unavailable");
  }
};
