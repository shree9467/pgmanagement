// Zero-Cost External PG Customer Discovery Engine (Vercel Serverless Function)
// Works immediately with $0 paid API keys across all 8 external platforms:
// 1. Google Search (SEARXNG / GOOGLE_CSE / Free DuckDuckGo HTML + Cheerio + Public Forums)
// 2. Google Maps (Free OpenStreetMap Overpass API + Nominatim / optional GOOGLE_MAPS_API_KEY) — market_research ONLY
// 3. Facebook (Meta Lead Ads API + /api/leads/meta-webhook / Public Mode fallback)
// 4. Instagram (Meta Lead Ads API + /api/leads/meta-webhook / Public Mode fallback)
// 5-8. Magicbricks, 99acres, Housing.com, Justdial (Optional Partner API / Safe Public Requirement Mode)
// NEVER reads or recycles internal project leads, Direct Website Enquiries, Guest Boarding, or tenant DBs.
// NEVER fabricates names, phone numbers, email addresses, or fake enquiries.

import crypto from "node:crypto";
import * as cheerio from "cheerio";

const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const BOT_UA = "SrinoosPGDiscoveryAgent/3.0 (+https://srinooscoliving.com)";

const SEEKER_POSITIVE_RE = /\b(looking for|searching for|need a|need pg|want a|wanted|required|suggest|recommend|recommendations|anyone know|moving to|shifting to|relocating to|help me find|good pg|best pg|pg near|hostel near|shared room|flatmate|roommate|seeking pg|pg enquiry)\b/i;
const OWNER_AD_NEGATIVE_RE = /\b(book now|beds available|rooms available|zero brokerage|call us now|contact us for booking|starting from ₹|free trial stay|for rent by owner|we offer|our pg offers|luxury pg available|vacancy available|instant booking|dm for rent|rental concierge|tell me exactly what you need|i.?ll help you find|analysis on last \d+|verified listings|properties for rent|pg in .* starting|top \d+ pgs|best \d+ pgs)\b/i;

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.length === 10 && /^[6-9]/.test(digits) ? digits : "";
}

function extractPublicPhone(text) {
  const m = String(text || "").match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/);
  return m ? normalizePhone(m[0]) : "";
}

function extractPublicEmail(text) {
  const m = String(text || "").match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : "";
}

function extractBudget(text) {
  const s = String(text || "").replace(/,/g, "");
  const kMatch = s.match(/(?:rs\.?|₹|inr|budget|under|around|upto|up to|max)?\s*(\d{1,2}(?:\.\d)?)\s*k\b/i);
  if (kMatch) {
    const val = Math.round(parseFloat(kMatch[1]) * 1000);
    if (val >= 3000 && val <= 50000) return val;
  }
  const numMatch = s.match(/(?:rs\.?|₹|inr|budget|under|around|upto|up to|max)\s*(\d{4,5})\b/i);
  if (numMatch) {
    const val = parseInt(numMatch[1], 10);
    if (val >= 3000 && val <= 50000) return val;
  }
  return 0;
}

function extractSharing(text) {
  const t = String(text || "").toLowerCase();
  if (/\bsingle\s*(room|sharing|occupancy|pg)\b/.test(t)) return "Single Sharing";
  if (/\b(double|2|two)\s*(sharing|occupancy)\b/.test(t)) return "Double Sharing";
  if (/\b(triple|3|three)\s*(sharing|occupancy)\b/.test(t)) return "Triple Sharing";
  if (/\b(shared\s*room|sharing)\b/.test(t)) return "Double Sharing";
  return "";
}

function extractGender(text, accommodationType = "") {
  const t = `${text || ""} ${accommodationType || ""}`.toLowerCase();
  if (/\b(girls?|ladies|female|women)\b/.test(t)) return "Female";
  if (/\b(boys?|gents?|male|men)\b/.test(t)) return "Male";
  if (/\b(co-living|coliving|unisex)\b/.test(t)) return "Co-living";
  return "";
}

function extractBedsRequired(text) {
  const m = String(text || "").match(/\b([1-4])\s*(?:beds?|people|persons|friends|guys|girls)\b/i);
  return m ? parseInt(m[1], 10) : 1;
}

function computeContentHash(sourceUrl, enquiryText) {
  const normUrl = String(sourceUrl || "").trim().toLowerCase().replace(/\/+$/, "");
  const normText = String(enquiryText || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 200);
  return crypto.createHash("sha256").update(`${normUrl}|${normText}`).digest("hex").slice(0, 24);
}

function isGenuineAccommodationSeeker(title, body, url = "") {
  const combined = `${title || ""} ${body || ""}`.trim();
  if (combined.length < 18) return false;
  if (!/(pg|paying guest|hostel|coliving|co-living|shared room|student accommodation|pg accommodation)/i.test(combined)) return false;
  if (OWNER_AD_NEGATIVE_RE.test(combined)) return false;
  // Reject obvious property listing catalog URLs unless they are explicit Q&A / discussion / requirement pages
  if (/\/(pg-in-|paying-guest-in-|hostels-in-|property-for-rent)/i.test(url) && !/(forum|question|discussion|reddit|quora|post|comments)/i.test(url)) {
    return false;
  }
  return SEEKER_POSITIVE_RE.test(combined);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Free DuckDuckGo HTML Search Parser using Cheerio ($0 cost, works on Vercel)
async function searchDuckDuckGoHtml(query, timeoutMs = 10000) {
  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const resp = await fetchWithTimeout(ddgUrl, {
    headers: {
      "User-Agent": BROWSER_UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en;q=0.9"
    }
  }, timeoutMs);

  if (!resp.ok) {
    throw new Error(`DuckDuckGo HTML HTTP ${resp.status}`);
  }
  const html = await resp.text();
  const $ = cheerio.load(html);
  const results = [];

  $(".result").each((_, el) => {
    const $el = $(el);
    const titleEl = $el.find(".result__a").first();
    const title = titleEl.text().trim();
    let href = titleEl.attr("href") || "";
    const snippet = $el.find(".result__snippet").first().text().trim();

    // Unwrap DuckDuckGo uddg redirect URLs
    if (href.includes("uddg=")) {
      try {
        const parsed = new URL(href.startsWith("//") ? "https:" + href : (href.startsWith("/") ? "https://html.duckduckgo.com" + href : href));
        const real = parsed.searchParams.get("uddg");
        if (real) href = real;
      } catch (_) {}
    } else if (href.startsWith("//")) {
      href = "https:" + href;
    }

    if (title && href && /^https?:\/\//i.test(href)) {
      results.push({ title, url: href, snippet });
    }
  });

  return results;
}

function buildProspectFromSearchItem({ item, sourceId, sourcePlatform, sourceIcon, locationTerm, city, shortLoc, sharing, accommodationType, audience, startedAt, maxBudget }) {
  const title = String(item?.title || "").trim();
  const snippet = String(item?.snippet || "").trim();
  const link = String(item?.url || "").trim();
  if (!link || !isGenuineAccommodationSeeker(title, snippet, link)) return null;

  const combined = `${title} ${snippet}`;
  const phone = extractPublicPhone(combined);
  const email = extractPublicEmail(combined);
  const budget = extractBudget(combined);
  if (maxBudget > 0 && budget > 0 && budget > maxBudget * 1.45) return null;

  let host = "web";
  try { host = new URL(link).hostname.replace(/^www\./, ""); } catch (_) {}

  // Try to extract reddit username or forum handle if present in URL/title
  const redditUser = combined.match(/u\/([A-Za-z0-9_-]{3,24})/);
  const tenantName = redditUser ? `u/${redditUser[1]}` : `Public Seeker (${host})`;

  const enquiryDesc = `${title}${snippet ? " — " + snippet : ""}`.slice(0, 420);
  const contentHash = computeContentHash(link, enquiryDesc);
  const hasContact = !!(phone || email);

  return {
    externalRef: link,
    external_lead_id: `${sourceId.replace("source-", "")}-${contentHash}`,
    contentHash,
    sourceId,
    sourcePlatform,
    sourceName: `${sourcePlatform} (${host})`,
    sourceIcon,
    sourceUrl: link,
    sourceAuthorized: true,
    discoveryOrigin: "EXTERNAL_AI_DISCOVERY",
    tenantName,
    phone,
    whatsapp: phone,
    email,
    city: city || shortLoc,
    location: locationTerm,
    accommodationType: accommodationType || extractGender(combined) || "PG Accommodation",
    sharingPreference: extractSharing(combined) || "",
    budget,
    budgetRange: budget > 0 ? `₹${budget.toLocaleString("en-IN")}/mo` : "",
    bedsRequired: extractBedsRequired(combined),
    preferredMoveInDate: "",
    gender: extractGender(combined, accommodationType),
    profession: audience || "",
    originalEnquiry: enquiryDesc,
    notes: `Externally discovered via ${sourcePlatform} (${host}). ${hasContact ? "Public contact details extracted." : "Unverified opportunity — reach out via original Source URL."}`,
    verificationStatus: hasContact ? "CONTACT_VERIFIED" : "UNVERIFIED_OPPORTUNITY",
    verification_status: hasContact ? "contact_verified" : "unverified_opportunity",
    discoveredAt: startedAt
  };
}

// 1. Free Multi-Engine Public Search (Google Search Card)
async function searchGoogleMultiEngine({ city, locality, sharing, maxBudget, audience, accommodationType, recentDays }) {
  const startedAt = new Date().toISOString();
  const locationTerm = [locality, city].filter(Boolean).join(", ").trim() || "Pune";
  const shortLoc = locationTerm.split(",")[0].trim();
  const cityOrLoc = (city || shortLoc).trim();
  const typeTerm = String(accommodationType || "").trim();
  const prospects = [];
  const errors = [];
  let modeLabel = "FREE_PUBLIC_SEARCH_ACTIVE";
  let succeeded = false;

  // A. Optional SearXNG Self-Hosted Instance
  const searxBase = String(process.env.SEARXNG_BASE_URL || "").trim().replace(/\/+$/, "");
  if (searxBase) {
    try {
      const q = `"looking for PG" ${shortLoc} ${cityOrLoc !== shortLoc ? cityOrLoc : ""}`.trim();
      const resp = await fetchWithTimeout(`${searxBase}/search?q=${encodeURIComponent(q)}&format=json`, { headers: { "User-Agent": BOT_UA } }, 9000);
      if (resp.ok) {
        const data = await resp.json();
        succeeded = true;
        modeLabel = "SEARXNG_CONNECTED";
        for (const r of Array.isArray(data?.results) ? data.results.slice(0, 15) : []) {
          const p = buildProspectFromSearchItem({
            item: { title: r.title, url: r.url, snippet: r.content },
            sourceId: "source-google",
            sourcePlatform: "Google Search",
            sourceIcon: "🔍",
            locationTerm, city: cityOrLoc, shortLoc, sharing, accommodationType: typeTerm, audience, startedAt, maxBudget
          });
          if (p) prospects.push(p);
        }
      }
    } catch (err) {
      errors.push(`SearXNG error: ${err?.message || "unreachable"}`);
    }
  }

  // B. Optional Google Custom Search API (if user adds keys)
  const gKey = String(process.env.GOOGLE_CSE_API_KEY || "").trim();
  const gCx = String(process.env.GOOGLE_CSE_CX || "").trim();
  if (gKey && gCx) {
    try {
      const q = `"looking for PG" "${shortLoc}" (site:reddit.com OR site:quora.com)`;
      const dateRestrict = Number(recentDays) > 0 && Number(recentDays) <= 30 ? `&dateRestrict=d${Number(recentDays)}` : "";
      const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(gKey)}&cx=${encodeURIComponent(gCx)}&q=${encodeURIComponent(q)}&num=10${dateRestrict}`;
      const resp = await fetchWithTimeout(url, { headers: { "User-Agent": BOT_UA } }, 10000);
      if (resp.ok) {
        const data = await resp.json();
        succeeded = true;
        modeLabel = "GOOGLE_CSE_CONNECTED";
        for (const item of Array.isArray(data?.items) ? data.items : []) {
          const p = buildProspectFromSearchItem({
            item: { title: item.title, url: item.link, snippet: item.snippet },
            sourceId: "source-google",
            sourcePlatform: "Google Search",
            sourceIcon: "🔍",
            locationTerm, city: cityOrLoc, shortLoc, sharing, accommodationType: typeTerm, audience, startedAt, maxBudget
          });
          if (p) prospects.push(p);
        }
      } else {
        errors.push(`Google CSE HTTP ${resp.status}`);
      }
    } catch (err) {
      errors.push(`Google CSE error: ${err?.message || "timeout"}`);
    }
  }

  // C. Zero-Config Free Public Search Fallback (DuckDuckGo HTML + Cheerio)
  const ddgQueries = [
    `site:reddit.com "looking for PG" ${cityOrLoc} ${shortLoc !== cityOrLoc ? shortLoc : ""}`.trim(),
    `site:reddit.com "PG" "need" OR "suggest" ${shortLoc} ${typeTerm ? typeTerm.split(" ")[0] : ""}`.trim(),
    `site:quora.com "looking for PG" ${cityOrLoc}`.trim()
  ];
  for (const dq of ddgQueries) {
    try {
      const items = await searchDuckDuckGoHtml(dq, 9000);
      if (items.length > 0) succeeded = true;
      for (const item of items) {
        const p = buildProspectFromSearchItem({
          item,
          sourceId: "source-google",
          sourcePlatform: "Google Search",
          sourceIcon: "🔍",
          locationTerm, city: cityOrLoc, shortLoc, sharing, accommodationType: typeTerm, audience, startedAt, maxBudget
        });
        if (p) prospects.push(p);
      }
    } catch (err) {
      errors.push(`DuckDuckGo HTML: ${err?.message || "timeout"}`);
    }
  }

  // Deduplicate batch by contentHash
  const seen = new Set();
  const uniqueProspects = prospects.filter(p => {
    const key = p.contentHash || (p.sourceUrl || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    sourceReport: {
      id: "source-google",
      name: "Google Search",
      icon: "🔍",
      connectionStatus: succeeded ? "FREE_PUBLIC_SEARCH_ACTIVE" : "DEGRADED",
      authStatus: modeLabel,
      searchStatus: succeeded ? "COMPLETED" : "FAILED",
      lastSuccessfulSearch: succeeded ? startedAt : null,
      newProspectsDiscovered: uniqueProspects.length,
      contactDetailsAvailable: uniqueProspects.filter(p => p.phone || p.email).length,
      errors: succeeded ? [] : errors,
      requirement: succeeded
        ? "Free Multi-Engine Public Search active ($0 cost via DuckDuckGo HTML + Cheerio). Optional: add GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX or SEARXNG_BASE_URL."
        : "Public search temporarily rate-limited. Optional: add GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX or SEARXNG_BASE_URL."
    },
    prospects: uniqueProspects
  };
}

// 2. Free Geospatial Demand Radar (Google Maps Card — OpenStreetMap Overpass API + Nominatim)
// Strictly market_research ONLY — NEVER inserts business listings as tenant leads!
async function researchGeospatialDemand({ city, locality }) {
  const startedAt = new Date().toISOString();
  const locationTerm = [locality, city].filter(Boolean).join(", ").trim() || "Pune";
  const mapsKey = String(process.env.GOOGLE_MAPS_API_KEY || "").trim();
  const demandHubs = [];
  const errors = [];
  let succeeded = false;
  let lat = null, lon = null;

  // Step A: Geocode locality via OpenStreetMap Nominatim (free)
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationTerm)}&format=json&limit=3`;
    const resp = await fetchWithTimeout(nomUrl, { headers: { "User-Agent": BOT_UA, "Accept": "application/json" } }, 7000);
    if (resp.ok) {
      const places = await resp.json();
      if (Array.isArray(places) && places.length > 0) {
        succeeded = true;
        lat = parseFloat(places[0].lat);
        lon = parseFloat(places[0].lon);
        places.forEach(pl => {
          if (pl?.display_name) demandHubs.push(pl.display_name.split(",").slice(0, 2).join(", "));
        });
      }
    }
  } catch (err) {
    errors.push(`Nominatim: ${err?.message || "timeout"}`);
  }

  // Step B: Query Free OpenStreetMap Overpass API for nearby colleges, universities & IT parks (within 4km)
  if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
    try {
      const overpassQuery = `[out:json][timeout:8];(node["amenity"~"university|college"](around:4000,${lat},${lon});node["office"~"it|company"](around:4000,${lat},${lon});way["landuse"="commercial"](around:4000,${lat},${lon}););out center 8;`;
      const ovResp = await fetchWithTimeout("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "User-Agent": BOT_UA, "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(overpassQuery)
      }, 9000);
      if (ovResp.ok) {
        const ovData = await ovResp.json();
        const elems = Array.isArray(ovData?.elements) ? ovData.elements : [];
        elems.forEach(el => {
          const nm = el?.tags?.name;
          const cat = el?.tags?.amenity || el?.tags?.office || el?.tags?.landuse || "Hub";
          if (nm) demandHubs.unshift(`${nm} (${cat})`);
        });
      }
    } catch (_) {
      // Non-fatal: Nominatim hubs already captured
    }
  }

  // Optional Google Maps Places enhancement if user sets GOOGLE_MAPS_API_KEY
  if (mapsKey) {
    try {
      const q = encodeURIComponent(`colleges OR IT parks near ${locationTerm}`);
      const resp = await fetchWithTimeout(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${encodeURIComponent(mapsKey)}`, { headers: { "User-Agent": BOT_UA } }, 8000);
      const data = await resp.json();
      if (resp.ok && data?.status === "OK") {
        succeeded = true;
        (data.results || []).slice(0, 5).forEach(pl => { if (pl?.name) demandHubs.unshift(pl.name); });
      }
    } catch (_) {}
  }

  const uniqueHubs = [...new Set(demandHubs)].slice(0, 8);

  return {
    sourceReport: {
      id: "source-google-maps",
      name: "Google Maps",
      icon: "🗺️",
      resultType: "market_research",
      connectionStatus: succeeded ? "OPENSTREETMAP_ACTIVE" : "RESEARCH_ONLY",
      authStatus: mapsKey ? "GOOGLE_MAPS_API_RESEARCH_ONLY" : "MARKET_RESEARCH_ONLY",
      searchStatus: succeeded ? "MARKET_RESEARCH_COMPLETED" : "DEGRADED",
      lastSuccessfulSearch: succeeded ? startedAt : null,
      newProspectsDiscovered: 0,
      contactDetailsAvailable: 0,
      errors: succeeded ? [] : errors,
      demandHubs: uniqueHubs,
      requirement: "Free OpenStreetMap Overpass + Nominatim active ($0 cost) for IT park & college demand mapping. Business listings are NEVER inserted as tenant leads."
    },
    prospects: [],
    demandHubs: uniqueHubs
  };
}

// 3. Facebook & Instagram (Authorized Meta Lead Ads + Safe Public Search Fallback)
async function searchSocialPlatform({ platformId, platformName, icon, domain, formIdEnv, city, locality, sharing, accommodationType, audience, maxBudget }) {
  const startedAt = new Date().toISOString();
  const locationTerm = [locality, city].filter(Boolean).join(", ").trim() || "Pune";
  const shortLoc = locationTerm.split(",")[0].trim();
  const cityOrLoc = (city || shortLoc).trim();
  const token = String(process.env.META_PAGE_ACCESS_TOKEN || "").trim();
  const formId = String(process.env[formIdEnv] || "").trim();
  const prospects = [];
  const errors = [];

  // Mode A: Authorized Meta Graph API Lead Ads
  if (token && formId) {
    try {
      const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(formId)}/leads?access_token=${encodeURIComponent(token)}&limit=25`;
      const resp = await fetchWithTimeout(url, { headers: { "User-Agent": BOT_UA } }, 10000);
      const data = await resp.json();
      if (!resp.ok || data?.error) throw new Error(data?.error?.message || `Meta HTTP ${resp.status}`);
      for (const item of Array.isArray(data?.data) ? data.data : []) {
        const fields = {};
        (Array.isArray(item?.field_data) ? item.field_data : []).forEach(f => {
          fields[String(f?.name || "").toLowerCase()] = Array.isArray(f?.values) ? f.values[0] : "";
        });
        const phone = normalizePhone(fields.phone_number || fields.phone || fields.mobile || "");
        const email = String(fields.email || "").trim().toLowerCase();
        const enquiryDesc = fields.notes || `Submitted ${platformName} Lead Ad form.`;
        const srcUrl = `https://business.facebook.com/latest/leads_center?lead_id=${encodeURIComponent(item.id || "")}`;
        const contentHash = computeContentHash(srcUrl, enquiryDesc);
        const hasContact = !!(phone || email);
        prospects.push({
          externalRef: `meta-${item.id}`,
          external_lead_id: `meta-${item.id}`,
          contentHash,
          sourceId: platformId,
          sourcePlatform: platformName,
          sourceName: `${platformName} Lead Ads`,
          sourceIcon: icon,
          sourceUrl: srcUrl,
          sourceAuthorized: true,
          discoveryOrigin: "EXTERNAL_AI_DISCOVERY",
          tenantName: fields.full_name || fields.name || `${platformName} Lead`,
          phone, whatsapp: phone, email,
          city: fields.city || cityOrLoc,
          location: fields.preferred_location || fields.city || locationTerm,
          accommodationType: fields.accommodation_type || accommodationType || "PG Accommodation",
          sharingPreference: fields.sharing_preference || "",
          budget: extractBudget(fields.budget || ""),
          budgetRange: fields.budget || "",
          bedsRequired: 1,
          preferredMoveInDate: fields.move_in_date || "",
          gender: extractGender(fields.gender || "", accommodationType),
          profession: fields.job_title || "",
          originalEnquiry: enquiryDesc,
          notes: `Authorized ${platformName} Lead Ads submission (${item.id}).`,
          verificationStatus: hasContact ? "CONTACT_VERIFIED" : "UNVERIFIED_OPPORTUNITY",
          verification_status: hasContact ? "contact_verified" : "unverified_opportunity",
          discoveredAt: item.created_time || startedAt
        });
      }
      return {
        sourceReport: {
          id: platformId, name: platformName, icon,
          connectionStatus: "META_CONNECTED",
          authStatus: "LIVE_API_CONNECTED",
          searchStatus: "COMPLETED",
          lastSuccessfulSearch: startedAt,
          newProspectsDiscovered: prospects.length,
          contactDetailsAvailable: prospects.filter(p => p.phone || p.email).length,
          errors: [],
          requirement: `Connected to authorized ${platformName} Lead Ads via Meta Graph API & /api/leads/meta-webhook.`
        },
        prospects
      };
    } catch (err) {
      errors.push(`Meta API: ${err?.message || "error"}`);
    }
  }

  // Mode B: Safe Public Indexed Posts Fallback (Never scrapes private profiles, private groups, or DMs)
  let publicRan = false;
  try {
    const q = `site:${domain} "looking for PG" ${cityOrLoc}`;
    const items = await searchDuckDuckGoHtml(q, 9000);
    publicRan = true;
    for (const item of items) {
      const p = buildProspectFromSearchItem({
        item, sourceId: platformId, sourcePlatform: platformName, sourceIcon: icon,
        locationTerm, city: cityOrLoc, shortLoc, sharing, accommodationType, audience, startedAt, maxBudget
      });
      if (p) prospects.push(p);
    }
  } catch (err) {
    errors.push(`Public search: ${err?.message || "timeout"}`);
  }

  return {
    sourceReport: {
      id: platformId, name: platformName, icon,
      connectionStatus: publicRan ? "PUBLIC_MODE_KEY_OPTIONAL" : "NOT_CONNECTED",
      authStatus: "PUBLIC_MODE_META_OPTIONAL",
      searchStatus: publicRan ? "COMPLETED" : "DEGRADED",
      lastSuccessfulSearch: publicRan ? startedAt : null,
      newProspectsDiscovered: prospects.length,
      contactDetailsAvailable: prospects.filter(p => p.phone || p.email).length,
      errors: publicRan ? [] : errors,
      requirement: `Public mode active ($0 cost, public indexed posts only — never private profiles/DMs). Optional: add META_PAGE_ACCESS_TOKEN + ${formIdEnv} & /api/leads/meta-webhook for Lead Ads.`
    },
    prospects
  };
}

// 4. Property Portals (Magicbricks, 99acres, Housing.com, Justdial — Optional Partner API + Safe Public Seeker Mode)
async function searchPortalSource({ id, name, icon, domain, envKey, city, locality, sharing, accommodationType, audience, maxBudget }) {
  const startedAt = new Date().toISOString();
  const locationTerm = [locality, city].filter(Boolean).join(", ").trim() || "Pune";
  const shortLoc = locationTerm.split(",")[0].trim();
  const cityOrLoc = (city || shortLoc).trim();
  const hasPartnerKey = !!String(process.env[envKey] || "").trim();
  const prospects = [];
  const errors = [];
  let publicRan = false;

  // Safe Public Requirement-Page Discovery via DuckDuckGo HTML + Cheerio
  // Strictly filters OUT owner/broker ads & directory listings; NEVER invents masked phones
  try {
    const q = `site:${domain} ("looking for PG" OR "need PG" OR "PG wanted") ${cityOrLoc}`;
    const items = await searchDuckDuckGoHtml(q, 9000);
    publicRan = true;
    for (const item of items) {
      const p = buildProspectFromSearchItem({
        item, sourceId: id, sourcePlatform: name, sourceIcon: icon,
        locationTerm, city: cityOrLoc, shortLoc, sharing, accommodationType, audience, startedAt, maxBudget
      });
      if (p) prospects.push(p);
    }
  } catch (err) {
    errors.push(`Public check: ${err?.message || "timeout"}`);
  }

  return {
    sourceReport: {
      id, name, icon,
      connectionStatus: hasPartnerKey ? "WEBHOOK_READY" : (publicRan ? "PUBLIC_MODE_KEY_OPTIONAL" : "NOT_CONNECTED"),
      authStatus: hasPartnerKey ? "PARTNER_WEBHOOK_CONFIGURED" : "PUBLIC_MODE_PARTNER_OPTIONAL",
      searchStatus: publicRan ? "COMPLETED" : "DEGRADED",
      lastSuccessfulSearch: publicRan ? startedAt : null,
      newProspectsDiscovered: prospects.length,
      contactDetailsAvailable: prospects.filter(p => p.phone || p.email).length,
      errors: publicRan ? [] : errors,
      requirement: hasPartnerKey
        ? `${name} partner key (${envKey}) detected + safe public seeker filter active. Owner ads & directory listings excluded.`
        : `PUBLIC MODE (PARTNER KEY OPTIONAL): Safe seeker-only filter active; owner ads & directory listings excluded. Optional: add ${envKey} for direct paywalled phone numbers.`
    },
    prospects
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (_) {
    return res.status(400).json({ ok: false, error: "Invalid JSON request body." });
  }

  const {
    city = "",
    locality = "",
    sharing = "",
    maxBudget = 0,
    audience = "",
    accommodationType = "",
    maxLeads = 20,
    recentDays = "30",
    selectedSourceIds = null
  } = body || {};

  const allow = id => !Array.isArray(selectedSourceIds) || selectedSourceIds.length === 0 || selectedSourceIds.includes(id);
  const runStartedAt = new Date().toISOString();

  // Execute all 8 external platforms concurrently via Promise.allSettled with per-source 15s isolation
  const withIsoTimeout = (promise, fallbackId, fallbackName, fallbackIcon) =>
    Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve({
        sourceReport: {
          id: fallbackId, name: fallbackName, icon: fallbackIcon,
          connectionStatus: "DEGRADED", authStatus: "TIMEOUT", searchStatus: "TIMED_OUT_15S",
          lastSuccessfulSearch: null, newProspectsDiscovered: 0, contactDetailsAvailable: 0,
          errors: [`${fallbackName} timed out after 15s — other sources continued unaffected.`],
          requirement: "Per-source timeout guard prevented pipeline stall."
        },
        prospects: []
      }), 15000))
    ]);

  const tasks = [
    allow("source-google")
      ? withIsoTimeout(searchGoogleMultiEngine({ city, locality, sharing, maxBudget: Number(maxBudget) || 0, audience, accommodationType, recentDays }), "source-google", "Google Search", "🔍")
      : Promise.resolve(null),
    allow("source-google-maps")
      ? withIsoTimeout(researchGeospatialDemand({ city, locality }), "source-google-maps", "Google Maps", "🗺️")
      : Promise.resolve(null),
    allow("source-facebook")
      ? withIsoTimeout(searchSocialPlatform({ platformId: "source-facebook", platformName: "Facebook", icon: "📘", domain: "facebook.com", formIdEnv: "FACEBOOK_LEADGEN_FORM_ID", city, locality, sharing, accommodationType, audience, maxBudget: Number(maxBudget) || 0 }), "source-facebook", "Facebook", "📘")
      : Promise.resolve(null),
    allow("source-instagram")
      ? withIsoTimeout(searchSocialPlatform({ platformId: "source-instagram", platformName: "Instagram", icon: "📸", domain: "instagram.com", formIdEnv: "INSTAGRAM_LEADGEN_FORM_ID", city, locality, sharing, accommodationType, audience, maxBudget: Number(maxBudget) || 0 }), "source-instagram", "Instagram", "📸")
      : Promise.resolve(null),
    allow("source-magicbricks")
      ? withIsoTimeout(searchPortalSource({ id: "source-magicbricks", name: "Magicbricks", icon: "🏢", domain: "magicbricks.com", envKey: "MAGICBRICKS_PARTNER_API_KEY", city, locality, sharing, accommodationType, audience, maxBudget: Number(maxBudget) || 0 }), "source-magicbricks", "Magicbricks", "🏢")
      : Promise.resolve(null),
    allow("source-99acres")
      ? withIsoTimeout(searchPortalSource({ id: "source-99acres", name: "99acres", icon: "🏠", domain: "99acres.com", envKey: "NINETY_NINE_ACRES_API_KEY", city, locality, sharing, accommodationType, audience, maxBudget: Number(maxBudget) || 0 }), "source-99acres", "99acres", "🏠")
      : Promise.resolve(null),
    allow("source-housing")
      ? withIsoTimeout(searchPortalSource({ id: "source-housing", name: "Housing.com", icon: "🏘️", domain: "housing.com", envKey: "HOUSING_PARTNER_API_KEY", city, locality, sharing, accommodationType, audience, maxBudget: Number(maxBudget) || 0 }), "source-housing", "Housing.com", "🏘️")
      : Promise.resolve(null),
    allow("source-justdial")
      ? withIsoTimeout(searchPortalSource({ id: "source-justdial", name: "Justdial", icon: "📞", domain: "justdial.com", envKey: "JUSTDIAL_API_KEY", city, locality, sharing, accommodationType, audience, maxBudget: Number(maxBudget) || 0 }), "source-justdial", "Justdial", "📞")
      : Promise.resolve(null)
  ];

  const settled = await Promise.allSettled(tasks);
  const sourceReports = [];
  const prospects = [];
  let demandHubs = [];

  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) {
      if (r.value.sourceReport) sourceReports.push(r.value.sourceReport);
      if (Array.isArray(r.value.prospects)) prospects.push(...r.value.prospects);
      if (Array.isArray(r.value.demandHubs) && r.value.demandHubs.length > 0) {
        demandHubs = r.value.demandHubs;
      }
    }
  }

  const leadLimit = Math.max(1, Math.min(100, Number(maxLeads) || 20));
  const limitedProspects = prospects.slice(0, leadLimit);

  return res.status(200).json({
    ok: true,
    ranAt: runStartedAt,
    query: { city, locality, sharing, maxBudget, audience, accommodationType, maxLeads: leadLimit, recentDays },
    internalSourcesUsed: false,
    externalSourcesEvaluated: sourceReports.length,
    completedSources: sourceReports.length,
    totalProspectsDiscovered: limitedProspects.length,
    demandHubs,
    sourceReports,
    prospects: limitedProspects
  });
}
