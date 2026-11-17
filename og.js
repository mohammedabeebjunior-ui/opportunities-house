// Opportunities House: gives every listing link its own title and description
// (used by WhatsApp, Facebook, X and Google). Vercel runs this for any "/?o=listing-slug" address.
const fs = require("fs");
const path = require("path");

// Public values, the same ones as in config.js (the anon key is safe to expose).
const SB_URL = "https://kvkgopfesumdnztxdbjf.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2a2dvcGZlc3VtZG56dHhkYmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NzIyNTAsImV4cCI6MjExMDI0ODI1MH0.aV9KLMuV9u2FWTAwfY95z4UATgyOLMz3QxUXDjg02uM";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const short = (t, n) => {
  t = String(t || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t;
};

async function getPage(host) {
  try {
    return fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
  } catch (e) {
    const r = await fetch(`https://${host}/index.html`);
    return await r.text();
  }
}

module.exports = async (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "opportunitieshouse.com.ng";
  const slug = String((req.query && req.query.o) || new URL(req.url, "https://x").searchParams.get("o") || "");
  let html = await getPage(host);

  try {
    if (slug && slug.length < 200) {
      const api = `${SB_URL}/rest/v1/opportunities?select=title,org_name,category,state,deadline,summary&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`;
      const r = await fetch(api, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
      const rows = r.ok ? await r.json() : [];
      const o = rows && rows[0];
      if (o) {
        const title = esc(o.title + (o.org_name ? " – " + o.org_name : ""));
        const bits = [cap(o.category), o.org_name, o.state].filter(Boolean);
        const dl = o.deadline
          ? "Deadline: " + new Date(o.deadline + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
          : "";
        const desc = esc(short([dl, o.summary || bits.join(" · ")].filter(Boolean).join(". "), 200));
        const url = `https://${host}/?o=${encodeURIComponent(slug)}`;
        html = html
          .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title} | Opportunities House</title>`)
          .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${desc}">`)
          .replace(/<meta property="og:title" content="[^"]*">/, () =>
            `<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:url" content="${esc(url)}"><link rel="canonical" href="${esc(url)}">`);
      }
    }
  } catch (e) {
    // If anything goes wrong we simply serve the normal page.
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
};
