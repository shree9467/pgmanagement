// Platform-Compliant External Lead Search Endpoint (Vercel Serverless Function)
// Supports the 7 external platforms: Magicbricks, 99acres, Google Search, Google Maps, Facebook, Instagram, Justdial.
// Uses ONLY official APIs & permitted public information — never scrapes prohibited content or invents fake leads.

const USER_AGENT = "SrinoosLeadsManagement/1.0 (+https://srinooscoliving.com)";

const SEEKER_RE = /\b(looking for|searching for|need a|need pg|want a|wanted|required|suggest|recommend|moving to|shifting to|relocating to|pg near|hostel near|shared room|flatmate)\b/i;
const AD_RE = /\b(book now|beds available|rooms available|zero brokerage|call us now|contact us|starting from|free trial stay|for rent by owner|we offer|our pg offers|top \d+ pgs|best \d+ pgs)\b/i;

function normalizePhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d.length === 10 && /^[6-9]/.test(d) ? d : "";
}

function extractPhone(text) {
  const m = String(text || "").match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/);
  return m ? normalizePhone(m[0]) : "";
}

function extractEmail(text) {
  const m = String(text || "").match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : "";
}

function extractBudget(text) {
  const s = String(text || "").replace(/,/g, "");
  const km = s.match(/(?:rs\.?|₹|inr|budget|under|around|max)?\s*(\d{1,2}(?:\.\d)?)\s*k\b/i);
  if (km) {
    const v = Math.round(parseFloat(km[1]) * 1000);
    if (v >= 3000 && v <= 50000) return v;
  }
  const nm = s.match(/(?:rs\.?|₹|inr|budget|under|around|max)\s*(\d{4,5})\b/i);
  if (nm) {
    const v = parseInt(nm[1], 10);
    if (v >= 3000 && v <= 50000) return v;
  }
  return 0;
}

async function fetchTimeout(url, opts = {}, ms = 10000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal }); }
  finally { clearTimeout(t); }
}

async function searchGoogle({ city, locality, pgType, audience, maxBudget, sharing }) {
  const now = new Date().toISOString();
  const loc = [locality, city].filter(Boolean).join(", ").trim() || "Pune";
  const gKey = String(process.env.GOOGLE_CSE_API_KEY || "").trim();
  const gCx = String(process.env.GOOGLE_CSE_CX || "").trim();

  if (!gKey || !gCx) {
    return {
      report: {
        id: "source-google", name: "Google Search", status: "MANUAL_IMPORT_OR_API_KEY",
        found: 0, message: "Add GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX in Vercel env vars for automated Google Search, or use Add Lead / Import CSV."
      },
      leads: []
    };
  }

  try {
    const q = `"looking for PG" "${loc}" ${pgType ? `"${pgType}"` : ""} ${sharing ? `"${sharing}"` : ""} (site:reddit.com OR site:quora.com)`.trim();
    const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(gKey)}&cx=${encodeURIComponent(gCx)}&q=${encodeURIComponent(q)}&num=10`;
    const r = await fetchTimeout(url, { headers: { "User-Agent": USER_AGENT } }, 10000);
    if (!r.ok) throw new Error(`Google CSE HTTP ${r.status}`);
    const data = await r.json();
    const leads = [];
    for (const item of Array.isArray(data?.items) ? data.items : []) {
      const text = `${item.title || ""} ${item.snippet || ""}`.trim();
      if (!SEEKER_RE.test(text) || AD_RE.test(text)) continue;
      const phone = extractPhone(text);
      const email = extractEmail(text);
      const budget = extractBudget(text);
      if (maxBudget > 0 && budget > 0 && budget > maxBudget * 1.4) continue;
      leads.push({
        tenantName: item.displayLink ? `Enquiry (${item.displayLink})` : "Google Search Enquiry",
        phone, whatsapp: phone, email,
        city: city || loc.split(",")[0].trim(),
        location: loc,
        preferredPgType: pgType || "Co-living",
        sharingPreference: sharing || "Double Sharing",
        budget,
        budgetRange: budget > 0 ? `₹${budget.toLocaleString("en-IN")}/mo` : "",
        profession: audience || "",
        sourceId: "source-google",
        sourceName: "Google Search",
        sourceUrl: item.link || "",
        originalEnquiry: text.slice(0, 360),
        notes: `Collected via Google Search (${item.displayLink || "web"}).`,
        verificationStatus: (phone || email) ? "CONTACT_VERIFIED" : "UNVERIFIED",
        discoveredAt: now
      });
    }
    return {
      report: { id: "source-google", name: "Google Search", status: "LIVE_CONNECTED", found: leads.length, message: `Found ${leads.length} public enquiry result(s).` },
      leads
    };
  } catch (err) {
    return {
      report: { id: "source-google", name: "Google Search", status: "ERROR", found: 0, message: err?.message || "Search failed" },
      leads: []
    };
  }
}

async function researchGoogleMaps({ city, locality }) {
  const loc = [locality, city].filter(Boolean).join(", ").trim() || "Pune";
  try {
    const r = await fetchTimeout(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc)}&format=json&limit=4`, { headers: { "User-Agent": USER_AGENT } }, 7000);
    const arr = r.ok ? await r.json() : [];
    const hubs = (Array.isArray(arr) ? arr : []).map(x => String(x.display_name || "").split(",").slice(0, 2).join(", ")).filter(Boolean);
    return {
      report: {
        id: "source-google-maps", name: "Google Maps", status: "MARKET_RESEARCH_ONLY", found: 0,
        demandHubs: hubs,
        message: "Locality demand research only (PG business listings are never added as tenant leads)."
      },
      leads: []
    };
  } catch (err) {
    return {
      report: { id: "source-google-maps", name: "Google Maps", status: "MARKET_RESEARCH_ONLY", found: 0, message: "Locality research unavailable; business listings are never added as tenant leads." },
      leads: []
    };
  }
}

async function queryMetaLeads({ id, name, formIdEnv }) {
  const token = String(process.env.META_PAGE_ACCESS_TOKEN || "").trim();
  const formId = String(process.env[formIdEnv] || "").trim();
  if (!token || !formId) {
    return {
      report: { id, name, status: "MANUAL_IMPORT_OR_API_KEY", found: 0, message: `Requires authorized Meta Graph API (${formIdEnv}). Use Add Lead or CSV Import in the meantime.` },
      leads: []
    };
  }
  try {
    const r = await fetchTimeout(`https://graph.facebook.com/v20.0/${encodeURIComponent(formId)}/leads?access_token=${encodeURIComponent(token)}&limit=25`, { headers: { "User-Agent": USER_AGENT } }, 10000);
    const data = await r.json();
    if (!r.ok || data?.error) throw new Error(data?.error?.message || `Meta HTTP ${r.status}`);
    const leads = (Array.isArray(data?.data) ? data.data : []).map(item => {
      const f = {};
      (item.field_data || []).forEach(x => { f[String(x.name || "").toLowerCase()] = Array.isArray(x.values) ? x.values[0] : ""; });
      const phone = normalizePhone(f.phone_number || f.phone || f.mobile || "");
      const email = String(f.email || "").trim().toLowerCase();
      return {
        externalRef: `meta-${item.id}`,
        tenantName: f.full_name || f.name || `${name} Lead`,
        phone, whatsapp: phone, email,
        city: f.city || "",
        location: f.preferred_location || f.city || "",
        preferredPgType: f.accommodation_type || "Co-living",
        sharingPreference: f.sharing_preference || "",
        budget: extractBudget(f.budget || ""),
        budgetRange: f.budget || "",
        profession: f.job_title || "",
        sourceId: id,
        sourceName: name,
        sourceUrl: "https://business.facebook.com/latest/leads_center",
        originalEnquiry: f.notes || `${name} Lead Ad submission`,
        notes: `Authorized ${name} Lead Ad (${item.id}).`,
        verificationStatus: (phone || email) ? "CONTACT_VERIFIED" : "UNVERIFIED",
        discoveredAt: item.created_time || new Date().toISOString()
      };
    });
    return { report: { id, name, status: "LIVE_CONNECTED", found: leads.length, message: `Collected ${leads.length} authorized Lead Ad enquiry(s).` }, leads };
  } catch (err) {
    return { report: { id, name, status: "ERROR", found: 0, message: err?.message || "Meta API error" }, leads: [] };
  }
}

function checkPortal({ id, name, envKey }) {
  const hasKey = !!String(process.env[envKey] || "").trim();
  return {
    report: {
      id, name,
      status: hasKey ? "PARTNER_WEBHOOK_READY" : "MANUAL_IMPORT_OR_API_KEY",
      found: 0,
      message: hasKey
        ? `${name} partner key detected (${envKey}). Ready for authorized webhook sync.`
        : `${name} does not expose individual tenant contacts publicly without a commercial partner API (${envKey}). Use CSV/Excel Import or Add Lead.`
    },
    leads: []
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  let body = {};
  try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); }
  catch (_) { return res.status(400).json({ ok: false, error: "Invalid JSON" }); }

  const { city = "", locality = "", pgType = "", audience = "", maxBudget = 0, sharing = "", targetCount = 20, sources = [] } = body;
  const allow = id => !Array.isArray(sources) || sources.length === 0 || sources.includes(id);

  const tasks = [
    allow("source-google") ? searchGoogle({ city, locality, pgType, audience, maxBudget: Number(maxBudget) || 0, sharing }) : Promise.resolve(null),
    allow("source-google-maps") ? researchGoogleMaps({ city, locality }) : Promise.resolve(null),
    allow("source-facebook") ? queryMetaLeads({ id: "source-facebook", name: "Facebook", formIdEnv: "FACEBOOK_LEADGEN_FORM_ID" }) : Promise.resolve(null),
    allow("source-instagram") ? queryMetaLeads({ id: "source-instagram", name: "Instagram", formIdEnv: "INSTAGRAM_LEADGEN_FORM_ID" }) : Promise.resolve(null),
    allow("source-magicbricks") ? Promise.resolve(checkPortal({ id: "source-magicbricks", name: "Magicbricks", envKey: "MAGICBRICKS_PARTNER_API_KEY" })) : Promise.resolve(null),
    allow("source-99acres") ? Promise.resolve(checkPortal({ id: "source-99acres", name: "99acres", envKey: "NINETY_NINE_ACRES_API_KEY" })) : Promise.resolve(null),
    allow("source-justdial") ? Promise.resolve(checkPortal({ id: "source-justdial", name: "Justdial", envKey: "JUSTDIAL_API_KEY" })) : Promise.resolve(null)
  ];

  const settled = await Promise.allSettled(tasks);
  const reports = [];
  const leads = [];
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value) {
      if (s.value.report) reports.push(s.value.report);
      if (Array.isArray(s.value.leads)) leads.push(...s.value.leads);
    }
  }

  const limit = Math.max(1, Math.min(100, Number(targetCount) || 20));
  return res.status(200).json({
    ok: true,
    ranAt: new Date().toISOString(),
    reports,
    leads: leads.slice(0, limit)
  });
}
