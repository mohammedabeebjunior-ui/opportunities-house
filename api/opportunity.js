// Serves one opportunity as a full HTML page at /opportunity/<slug>
// so Google can read it without running any scripts.
const { query } = require("./_supabase");

const SITE = "https://www.opportunitieshouse.com.ng";
const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const fmtDate = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const todayStr = () => new Date().toISOString().slice(0, 10);

function describe(x) {
  const raw = (x.summary || x.eligibility || x.title || "").replace(/\s+/g, " ").trim();
  return raw.length > 155 ? raw.slice(0, 152).trimEnd() + "..." : raw;
}

function section(title, body) {
  return body ? `<h2>${title}</h2><p class="pre">${esc(body)}</p>` : "";
}

function page(x) {
  const url = `${SITE}/opportunity/${encodeURIComponent(x.slug)}`;
  const title = x.title + (x.org_name ? " – " + x.org_name : "") + " | Opportunities House";
  const desc = describe(x);
  const closed = x.deadline && x.deadline < todayStr();
  const deadline = x.deadline
    ? closed
      ? `This opportunity closed on ${fmtDate(x.deadline)}.`
      : `Deadline: ${fmtDate(x.deadline)}`
    : "No deadline stated. Check the official site for current dates.";
  const meta = [x.org_name ? `<b>${esc(x.org_name)}</b>` : "", esc(x.state), esc(cap(x.level))].filter(Boolean).join(" · ");
  const share = encodeURIComponent(`${x.title}${x.org_name ? " – " + x.org_name : ""}${x.deadline && !closed ? "\nCloses " + x.deadline : ""}\n${url}`);

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--bg:#f6f4ee;--cd:#fff;--tx:#12231a;--mu:#5c6d63;--br:#e4e0d3;--p:#0a6b3b;--p2:#e6f3ea;--g:#e9a30c;--rd:#c0392b}
@media(prefers-color-scheme:dark){:root{--bg:#0d1511;--cd:#16211b;--tx:#eef4f0;--mu:#9db0a5;--br:#27372d;--p:#38c077;--p2:#13301f;--g:#f2b52c;--rd:#ff8a7a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.6 "Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:inherit;text-decoration:none}.w{max-width:760px;margin:auto;padding:0 18px}
nav{border-bottom:1px solid var(--br);background:var(--bg)}.nv{display:flex;align-items:center;height:60px}
.lg{font-weight:800;font-size:19px}.lg b{color:var(--g)}
.box{background:var(--cd);border:1px solid var(--br);border-radius:16px;padding:24px;margin:20px 0}
.tg{display:inline-block;background:var(--p2);color:var(--p);border-radius:99px;padding:3px 12px;font-size:13px;font-weight:700;margin-right:6px}
h1{margin:12px 0 4px;font-size:28px;line-height:1.25}h2{margin:26px 0 6px;font-size:18px}
.mu{color:var(--mu);margin:0}.dl{font-weight:700;margin:14px 0}.dl.x{color:var(--rd)}
.pre{white-space:pre-wrap;margin:0;overflow-wrap:anywhere}
.row{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.b{background:var(--p);color:#fff;border-radius:12px;padding:11px 20px;font-weight:700;display:inline-block}
.gh{background:var(--cd);border:1px solid var(--br);border-radius:12px;padding:10px 16px;font-weight:600;display:inline-block}
.b:focus-visible,.gh:focus-visible,a:focus-visible{outline:3px solid var(--g);outline-offset:2px}
.warn{color:var(--mu);font-size:14px;margin-top:22px}
footer{color:var(--mu);font-size:14px;text-align:center;padding:10px 0 40px}footer a{margin:0 8px;text-decoration:underline}
</style></head><body>
<nav><div class="w nv"><a class="lg" href="/">Opportunities<b>House</b></a></div></nav>
<main class="w">
<p style="margin:16px 0 0"><a class="gh" href="/">← All opportunities</a></p>
<article class="box">
<span class="tg">${esc(cap(x.category))}</span>${x.verified ? '<span class="tg">✔ Verified</span>' : ""}
<h1>${esc(x.title)}</h1>
<p class="mu">${meta}</p>
<p class="dl${closed ? " x" : ""}">${esc(deadline)}</p>
${section("About", x.summary)}${section("Eligibility", x.eligibility)}${section("How to apply", x.how_to_apply)}
<p class="warn">Apply only on the official website. Real opportunities never ask for a fee.</p>
<div class="row">
${x.apply_url ? `<a class="b" href="${esc(x.apply_url)}" target="_blank" rel="noopener nofollow">Apply on official site</a>` : ""}
<a class="gh" href="https://wa.me/?text=${share}" target="_blank" rel="noopener">Share on WhatsApp</a>
</div>
</article>
</main>
<footer><a href="/about.html">About</a><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy Policy</a><a href="/terms.html">Terms</a></footer>
</body></html>`;
}

function notFound() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Opportunity not found | Opportunities House</title></head><body style="font-family:system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 18px"><h1>Opportunity not found</h1><p>This opportunity may have been removed or has not been published yet.</p><p><a href="/">← See all opportunities</a></p></body></html>`;
}

module.exports = async (req, res) => {
  const slug = String((req.query && req.query.slug) || "");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!/^[a-z0-9-]{1,200}$/i.test(slug)) {
    res.statusCode = 404;
    return res.end(notFound());
  }
  try {
    const origin = `https://${req.headers.host}`;
    const rows = await query(origin, `opportunities?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*&limit=1`);
    if (!rows.length) {
      res.statusCode = 404;
      return res.end(notFound());
    }
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return res.end(page(rows[0]));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Cache-Control", "no-store");
    return res.end("<!DOCTYPE html><title>Temporary error</title><p>Something went wrong. Please try again in a moment.</p>");
  }
};
module.exports._page = page;
