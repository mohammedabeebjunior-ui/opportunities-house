// Shared helper: finds the Supabase URL and public (anon) key, then queries the REST API.
// It reads them from your existing config.js, so you do not need to paste any keys here.
// (If you prefer, set SB_URL and SB_KEY as environment variables in Vercel instead.)
let cached = null;

async function getConfig(origin) {
  if (process.env.SB_URL && process.env.SB_KEY) {
    return { url: process.env.SB_URL, key: process.env.SB_KEY };
  }
  if (cached) return cached;
  const res = await fetch(origin + "/config.js");
  const text = await res.text();
  const url = (text.match(/SB_URL\s*=\s*["']([^"']+)["']/) || [])[1];
  const key = (text.match(/SB_KEY\s*=\s*["']([^"']+)["']/) || [])[1];
  if (!url || !key) throw new Error("Could not read SB_URL / SB_KEY from config.js");
  cached = { url: url.replace(/\/$/, ""), key };
  return cached;
}

async function query(origin, path) {
  const { url, key } = await getConfig(origin);
  const res = await fetch(url + "/rest/v1/" + path, {
    headers: { apikey: key, Authorization: "Bearer " + key },
  });
  if (!res.ok) throw new Error("Supabase error " + res.status);
  return res.json();
}

module.exports = { query };
