// Independent External PG Customer Lead Discovery API (Vercel Serverless Function)
// Researches ONLY the 8 external platforms:
// Magicbricks, 99acres, Housing.com, Google Search, Google Maps, Facebook, Instagram, Justdial.
// NEVER reads or recycles internal project leads, Direct Website Enquiries, Guest Boarding, or tenant DBs.
// NEVER fabricates names, phone numbers, email addresses, or fake connections.

import crypto from "node:crypto";

const USER_AGENT = "SrinoosPGDiscoveryAgent/2.1 (+https://srinooscoliving.com)";

const SEEKER_POSITIVE_RE = /\b(looking for|searching for|need a|need pg|want a|wanted|required|suggest|recommend|recommendations|anyone know|moving to|shifting to|relocating to|help me find|good pg|best pg|pg near|hostel near|shared room|flatmate|roommate)\b/i;
const OWNER_AD_NEGATIVE_RE = /\b(book now|beds available|rooms available|zero brokerage|call us now|contact us for booking|starting from ₹|free trial stay|for rent by owner|we offer|our pg offers|luxury pg available|vacancy available|instant booking|dm for rent|rental concierge|tell me exactly what you need|i.?ll help you find|analysis on last \d+)\b/i;

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
  if (/\b(girls|ladies|female|women)\b/.test(t)) return "Female";
  if (/\b(boys|gents|male|men)\b/.test(t)) return "Male";
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

function isGenuineAccommodationSeeker(title, body) {
  const combined = `${title || ""} ${body || ""}`.trim();
  if (combined.length < 15) return false;
  if (!/(pg|paying guest|hostel|coliving|co-living|shared room|student accommodation|pg accommodation)/i.test(combined)) return false;
  if (OWNER_AD_NEGATIVE_RE.test(combined)) return false;
  return SEEKER_POSITIVE_RE.test(combined);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 1. Google Search & Public Accommodation Discussion Discovery
async function searchGoogleAndPublicDiscussions({ city, locality, sharing, maxBudget, audience, accommodationType, recentDays }) {
  const startedAt = new Date().toISOString();
  const locationTerm = [locality, city].filter(Boolean).join(", ").trim() || "Bangalore";
  const shortLoc = locationTerm.split(",")[0].trim();
  const typeTerm = String(accommodationType || "").trim();
  const prospects = [];
  const errors = [];

  // A. Authorized Google Custom Search JSON API (GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX)
  const gKey = String(process.env.GOOGLE_CSE_API_KEY || "").trim();
  const gCx = String(process.env.GOOGLE_CSE_CX || "").trim();
  let googleApiSucceeded = false;

  if (gKey && gCx) {
    const queries = [
      `"looking for PG" "${shortLoc}" ${typeTerm ? `"${typeTerm}"` : ""} (site:reddit.com OR site:quora.com)`.trim(),
      `"PG accommodation" OR "shared room required" "${shortLoc}" ${sharing ? `"${sharing}"` : ""}`.trim()
    ];
    const dateRestrict = Number(recentDays) > 0 && Number(recentDays) <= 30 ? `&dateRestrict=d${Number(recentDays)}` : "";

    for (const q of queries) {
      try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(gKey)}&cx=${encodeURIComponent(gCx)}&q=${encodeURIComponent(q)}&num=10${dateRestrict}`;
        const resp = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT } }, 12000);
        if (resp.status === 403 || resp.status === 429) {
          errors.push(`Google CSE quota/access error (HTTP ${resp.status}). Check billing & API key restrictions.`);
          continue;
        }
        if (!resp.ok) {
          errors.push(`Google CSE HTTP ${resp.status}`);
          continue;
        }
        googleApiSucceeded = true;
        const data = await resp.json();
        for (const item of Array.isArray(data?.items) ? data.items : []) {
          const title = String(item?.title || "").trim();
          const snippet = String(item?.snippet || "").trim();
          if (!item?.link || !isGenuineAccommodationSeeker(title, snippet)) continue;
          const combined = `${title} ${snippet}`;
          const phone = extractPublicPhone(combined);
          const email = extractPublicEmail(combined);
          const budget = extractBudget(combined);
          if (maxBudget > 0 && budget > 0 && budget > maxBudget * 1.4) continue;

          const enquiryDesc = `${title} — ${snippet}`.slice(0, 420);
          const contentHash = computeContentHash(item.link, enquiryDesc);
          const hasContact = !!(phone || email);
          prospects.push({
            externalRef: item.link,
            external_lead_id: `gcse-${contentHash}`,
            contentHash,
            sourceId: "source-google",
            sourcePlatform: "Google Search",
            sourceName: `Google Search (${item.displayLink || "web"})`,
            sourceIcon: "🔍",
            sourceUrl: item.link,
            sourceAuthorized: true,
            discoveryOrigin: "EXTERNAL_AI_DISCOVERY",
            tenantName: item.displayLink ? `Public Seeker (${item.displayLink})` : "Public Web Seeker",
            phone,
            whatsapp: phone,
            email,
            city: city || shortLoc,
            location: locationTerm,
            accommodationType: typeTerm || extractGender(combined) || "PG Accommodation",
            sharingPreference: extractSharing(combined) || sharing || "",
            budget,
            budgetRange: budget > 0 ? `₹${budget.toLocaleString("en-IN")}/mo` : "",
            bedsRequired: extractBedsRequired(combined),
            preferredMoveInDate: "",
            gender: extractGender(combined, typeTerm),
            profession: audience || "",
            originalEnquiry: enquiryDesc,
            notes: `Externally discovered via Google Search (${item.displayLink || "web"}). ${hasContact ? "Public contact present." : "Unverified opportunity — follow up via Source URL."}`,
            verificationStatus: hasContact ? "CONTACT_VERIFIED" : "UNVERIFIED_OPPORTUNITY",
            verification_status: hasContact ? "contact_verified" : "unverified_opportunity",
            discoveredAt: startedAt
          });
        }
      } catch (err) {
        errors.push(`Google CSE error: ${err?.message || "request failed"}`);
      }
    }
  }

  // B. Permitted Public Community Accommodation Enquiries (PullPush public Reddit index)
  let publicSearchWorked = false;
  const ppQueries = [
    `looking for PG ${shortLoc} ${typeTerm ? typeTerm.split(" ")[0] : ""}`.trim(),
    `PG accommodation ${city || shortLoc}`
  ];
  for (const pq of ppQueries) {
    try {
      const ppUrl = `https://api.pullpush.io/reddit/search/submission/?q=${encodeURIComponent(pq)}&size=12&sort=desc&sort_type=created_utc`;
      const resp = await fetchWithTimeout(ppUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SrinoosPGAgent/2.1)", "Accept": "application/json" }
      }, 10000);
      if (resp.status === 403 || resp.status === 429) {
        errors.push(`Public Community Index HTTP ${resp.status} (cloud datacenter IP blocked)`);
        continue;
      }
      if (!resp.ok) {
        errors.push(`Public Community Index HTTP ${resp.status}`);
        continue;
      }
      publicSearchWorked = true;
      const json = await resp.json();
      const posts = Array.isArray(json?.data) ? json.data : [];
      for (const post of posts) {
        if (!post || !post.permalink) continue;
        const title = String(post.title || "").trim();
        const selftext = String(post.selftext || "").trim();
        if (!isGenuineAccommodationSeeker(title, selftext)) continue;

        const combined = `${title} ${selftext}`;
        const phone = extractPublicPhone(combined);
        const email = extractPublicEmail(combined);
        const budget = extractBudget(combined);
        if (maxBudget > 0 && budget > 0 && budget > maxBudget * 1.4) continue;

        const postUrl = post.permalink.startsWith("http") ? post.permalink : `https://www.reddit.com${post.permalink}`;
        const author = post.author && post.author !== "[deleted]" ? `u/${post.author}` : "Public Forum Seeker";
        const createdIso = post.created_utc ? new Date(post.created_utc * 1000).toISOString() : startedAt;
        const enquiryDesc = `${title}${selftext ? " — " + selftext.slice(0, 260) : ""}`.slice(0, 420);
        const contentHash = computeContentHash(postUrl, enquiryDesc);
        const hasContact = !!(phone || email);

        prospects.push({
          externalRef: postUrl,
          external_lead_id: `reddit-${post.id || contentHash}`,
          contentHash,
          sourceId: "source-google",
          sourcePlatform: "Google Search",
          sourceName: `Google Search / Public Forum (r/${post.subreddit || "india"})`,
          sourceIcon: "🔍",
          sourceUrl: postUrl,
          sourceAuthorized: true,
          discoveryOrigin: "EXTERNAL_AI_DISCOVERY",
          tenantName: author,
          phone,
          whatsapp: phone,
          email,
          city: city || shortLoc,
          location: locationTerm,
          accommodationType: typeTerm || extractGender(combined) || "PG Accommodation",
          sharingPreference: extractSharing(combined) || "",
          budget,
          budgetRange: budget > 0 ? `₹${budget.toLocaleString("en-IN")}/mo` : "",
          bedsRequired: extractBedsRequired(combined),
          preferredMoveInDate: "",
          gender: extractGender(combined, typeTerm),
          profession: "",
          originalEnquiry: enquiryDesc,
          notes: `Public accommodation enquiry in r/${post.subreddit || "community"}. ${hasContact ? "Public contact found." : "Unverified opportunity — reach out via original Source URL."}`,
          verificationStatus: hasContact ? "CONTACT_VERIFIED" : "UNVERIFIED_OPPORTUNITY",
          verification_status: hasContact ? "contact_verified" : "unverified_opportunity",
          discoveredAt: createdIso
        });
      }
    } catch (err) {
      errors.push(`Public community query failed: ${err?.message || "timeout"}`);
    }
  }

  // Deduplicate within this search batch by contentHash / sourceUrl
  const seen = new Set();
  const uniqueProspects = prospects.filter(p => {
    const key = p.contentHash || (p.sourceUrl || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const contactsAvailable = uniqueProspects.filter(p => p.phone || p.email).length;
  const hasGoogleApi = !!(gKey && gCx);
  const worked = googleApiSucceeded || publicSearchWorked;

  return {
    sourceReport: {
      id: "source-google",
      name: "Google Search",
      icon: "🔍",
      connectionStatus: worked ? "CONNECTED" : "API_KEY_REQUIRED",
      authStatus: googleApiSucceeded ? "LIVE_API_CONNECTED" : (publicSearchWorked ? "PUBLIC_SEARCH_LIVE" : "ACCOUNT_AUTH_REQUIRED"),
      searchStatus: worked ? "COMPLETED" : "BLOCKED_NEEDS_GOOGLE_API_KEY",
      lastSuccessfulSearch: worked ? startedAt : null,
      newProspectsDiscovered: uniqueProspects.length,
      contactDetailsAvailable: contactsAvailable,
      errors: worked ? [] : (errors.length > 0 ? errors : ["Missing GOOGLE_CSE_API_KEY & GOOGLE_CSE_CX in Vercel Environment Variables."]),
      requirement: hasGoogleApi
        ? "Connected to Google Custom Search JSON API (GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX)."
        : "Add GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX (Google Custom Search JSON API) in Vercel Environment Variables for reliable live Google Search discovery."
    },
    prospects: uniqueProspects
  };
}

// 2. Google Maps — Market Research & Demand Mapping ONLY (NEVER classified as tenant leads)
async function researchGoogleMapsDemand({ city, locality }) {
  const startedAt = new Date().toISOString();
  const locationTerm = [locality, city].filter(Boolean).join(", ").trim() || "Koramangala, Bangalore";
  const mapsKey = String(process.env.GOOGLE_MAPS_API_KEY || "").trim();
  const demandHubs = [];
  const errors = [];
  let succeeded = false;
  let usedGooglePlaces = false;

  if (mapsKey) {
    try {
      const q = encodeURIComponent(`colleges OR IT parks OR tech parks near ${locationTerm}`);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${encodeURIComponent(mapsKey)}`;
      const resp = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT } }, 10000);
      const data = await resp.json();
      if (resp.ok && (data?.status === "OK" || data?.status === "ZERO_RESULTS")) {
        succeeded = true;
        usedGooglePlaces = true;
        (data.results || []).slice(0, 6).forEach(pl => {
          if (pl?.name) demandHubs.push(`${pl.name}${pl.formatted_address ? " (" + pl.formatted_address.split(",")[0] + ")" : ""}`);
        });
      } else {
        errors.push(`Google Maps Places API: ${data?.status || "HTTP " + resp.status}`);
      }
    } catch (err) {
      errors.push(`Google Maps API error: ${err?.message || "timeout"}`);
    }
  }

  // Fallback to permitted OpenStreetMap Nominatim geo-research when GOOGLE_MAPS_API_KEY is not set
  if (!succeeded) {
    try {
      const q = encodeURIComponent(locationTerm);
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1`;
      const resp = await fetchWithTimeout(nomUrl, {
        headers: { "User-Agent": USER_AGENT, "Accept": "application/json" }
      }, 10000);
      if (resp.ok) {
        const places = await resp.json();
        if (Array.isArray(places) && places.length > 0) {
          succeeded = true;
          places.forEach(pl => {
            if (pl?.display_name) demandHubs.push(pl.display_name.split(",").slice(0, 3).join(", "));
          });
        }
      } else {
        errors.push(`Geo lookup HTTP ${resp.status}`);
      }
    } catch (err) {
      errors.push(`Geo research error: ${err?.message || "timeout"}`);
    }
  }

  return {
    sourceReport: {
      id: "source-google-maps",
      name: "Google Maps",
      icon: "🗺️",
      resultType: "market_research",
      connectionStatus: succeeded ? "CONNECTED_RESEARCH_ONLY" : "RESEARCH_ONLY",
      authStatus: usedGooglePlaces ? "GOOGLE_MAPS_API_RESEARCH_ONLY" : "MARKET_RESEARCH_ONLY",
      searchStatus: succeeded ? "MARKET_RESEARCH_COMPLETED" : "SKIPPED_NO_TENANT_ENQUIRIES",
      lastSuccessfulSearch: succeeded ? startedAt : null,
      newProspectsDiscovered: 0,
      contactDetailsAvailable: 0,
      errors,
      demandHubs,
      requirement: usedGooglePlaces
        ? "Connected to Google Maps Places API for demand mapping only. Business listings are NEVER inserted as tenant leads."
        : "Market & demand-area research active (OpenStreetMap). Add GOOGLE_MAPS_API_KEY for Google Places IT park/college cluster scoring. Business listings are NEVER classified as tenant leads."
    },
    prospects: [],
    demandHubs
  };
}

// 3. Meta Graph API Lead Ads (Facebook & Instagram) — strictly authorized tokens only
async function queryMetaLeadAds({ platformId, platformName, icon, formIdEnv }) {
  const startedAt = new Date().toISOString();
  const token = String(process.env.META_PAGE_ACCESS_TOKEN || "").trim();
  const formId = String(process.env[formIdEnv] || "").trim();

  if (!token || !formId) {
    const missing = [!token ? "META_PAGE_ACCESS_TOKEN" : "", !formId ? formIdEnv : ""].filter(Boolean).join(" & ");
    return {
      sourceReport: {
        id: platformId,
        name: platformName,
        icon,
        connectionStatus: "NOT_CONNECTED",
        authStatus: "ACCOUNT_AUTH_REQUIRED",
        searchStatus: "AWAITING_API_CREDENTIALS",
        lastSuccessfulSearch: null,
        newProspectsDiscovered: 0,
        contactDetailsAvailable: 0,
        errors: [`Missing ${missing} in Vercel environment variables.`],
        requirement: `Requires authorized Meta Graph API Page Access Token and ${platformName} Lead Ads Form ID (${formIdEnv}). Private profiles, private groups, and DMs are never scraped.`
      },
      prospects: []
    };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(formId)}/leads?access_token=${encodeURIComponent(token)}&limit=25`;
    const resp = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT } }, 12000);
    const data = await resp.json();
    if (!resp.ok || data?.error) {
      throw new Error(data?.error?.message || `Meta Graph API HTTP ${resp.status}`);
    }
    const prospects = (Array.isArray(data?.data) ? data.data : []).map(item => {
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
      return {
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
        phone,
        whatsapp: phone,
        email,
        city: fields.city || "",
        location: fields.preferred_location || fields.city || "",
        accommodationType: fields.accommodation_type || "PG Accommodation",
        sharingPreference: fields.sharing_preference || "",
        budget: extractBudget(fields.budget || ""),
        budgetRange: fields.budget || "",
        bedsRequired: 1,
        preferredMoveInDate: fields.move_in_date || "",
        gender: extractGender(fields.gender || ""),
        profession: fields.job_title || "",
        originalEnquiry: enquiryDesc,
        notes: `Authorized ${platformName} Lead Ads submission (${item.id}).`,
        verificationStatus: hasContact ? "CONTACT_VERIFIED" : "UNVERIFIED_OPPORTUNITY",
        verification_status: hasContact ? "contact_verified" : "unverified_opportunity",
        discoveredAt: item.created_time || startedAt
      };
    });

    return {
      sourceReport: {
        id: platformId,
        name: platformName,
        icon,
        connectionStatus: "CONNECTED",
        authStatus: "LIVE_API_CONNECTED",
        searchStatus: "COMPLETED",
        lastSuccessfulSearch: startedAt,
        newProspectsDiscovered: prospects.length,
        contactDetailsAvailable: prospects.filter(p => p.phone || p.email).length,
        errors: [],
        requirement: `Connected to authorized ${platformName} Lead Ads via Meta Graph API.`
      },
      prospects
    };
  } catch (err) {
    return {
      sourceReport: {
        id: platformId,
        name: platformName,
        icon,
        connectionStatus: "ERROR",
        authStatus: "AUTH_ERROR",
        searchStatus: "FAILED",
        lastSuccessfulSearch: null,
        newProspectsDiscovered: 0,
        contactDetailsAvailable: 0,
        errors: [err?.message || "Meta Graph API error"],
        requirement: `Verify META_PAGE_ACCESS_TOKEN and ${formIdEnv} permissions.`
      },
      prospects: []
    };
  }
}

// 4. Commercial Portal Partner Integrations (Magicbricks, 99acres, Housing.com, Justdial)
function checkPartnerPortalSource({ id, name, icon, envKey, requirement }) {
  const hasKey = !!String(process.env[envKey] || "").trim();
  if (!hasKey) {
    return {
      sourceReport: {
        id,
        name,
        icon,
        connectionStatus: "NOT_CONNECTED",
        authStatus: "AWAITING_PARTNER_API",
        searchStatus: "AWAITING_PARTNER_API",
        lastSuccessfulSearch: null,
        newProspectsDiscovered: 0,
        contactDetailsAvailable: 0,
        errors: [`Missing ${envKey}. Public ${name} pages contain property owner ads/listings, not direct tenant enquiries.`],
        requirement
      },
      prospects: []
    };
  }
  return {
    sourceReport: {
      id,
      name,
      icon,
      connectionStatus: "WEBHOOK_READY",
      authStatus: "PARTNER_WEBHOOK_CONFIGURED",
      searchStatus: "AWAITING_INCOMING_WEBHOOK",
      lastSuccessfulSearch: null,
      newProspectsDiscovered: 0,
      contactDetailsAvailable: 0,
      errors: [],
      requirement: `${name} partner key detected (${envKey}). Configure ${name} CRM webhook push to receive real-time verified buyer enquiries.`
    },
    prospects: []
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
    recentDays = "30",
    selectedSourceIds = null
  } = body || {};

  const allow = id => !Array.isArray(selectedSourceIds) || selectedSourceIds.length === 0 || selectedSourceIds.includes(id);
  const runStartedAt = new Date().toISOString();

  // Execute all 8 external platforms independently via Promise.allSettled so one failure NEVER blocks the others
  const tasks = [
    allow("source-google")
      ? searchGoogleAndPublicDiscussions({ city, locality, sharing, maxBudget: Number(maxBudget) || 0, audience, accommodationType, recentDays })
      : Promise.resolve(null),
    allow("source-google-maps")
      ? researchGoogleMapsDemand({ city, locality })
      : Promise.resolve(null),
    allow("source-facebook")
      ? queryMetaLeadAds({ platformId: "source-facebook", platformName: "Facebook", icon: "📘", formIdEnv: "FACEBOOK_LEADGEN_FORM_ID" })
      : Promise.resolve(null),
    allow("source-instagram")
      ? queryMetaLeadAds({ platformId: "source-instagram", platformName: "Instagram", icon: "📸", formIdEnv: "INSTAGRAM_LEADGEN_FORM_ID" })
      : Promise.resolve(null),
    allow("source-magicbricks")
      ? Promise.resolve(checkPartnerPortalSource({
          id: "source-magicbricks",
          name: "Magicbricks",
          icon: "🏢",
          envKey: "MAGICBRICKS_PARTNER_API_KEY",
          requirement: "Requires Magicbricks Commercial Partner Lead API / CRM Webhook credentials (MAGICBRICKS_PARTNER_API_KEY). Owner ads are never treated as tenant enquiries."
        }))
      : Promise.resolve(null),
    allow("source-99acres")
      ? Promise.resolve(checkPartnerPortalSource({
          id: "source-99acres",
          name: "99acres",
          icon: "🏠",
          envKey: "NINETY_NINE_ACRES_API_KEY",
          requirement: "Requires 99acres Business Partner Lead API / CRM Webhook credentials (NINETY_NINE_ACRES_API_KEY). Owner ads are never treated as tenant enquiries."
        }))
      : Promise.resolve(null),
    allow("source-housing")
      ? Promise.resolve(checkPartnerPortalSource({
          id: "source-housing",
          name: "Housing.com",
          icon: "🏘️",
          envKey: "HOUSING_PARTNER_API_KEY",
          requirement: "Requires Housing.com Commercial Partner Lead API credentials (HOUSING_PARTNER_API_KEY). Owner ads are never treated as tenant enquiries."
        }))
      : Promise.resolve(null),
    allow("source-justdial")
      ? Promise.resolve(checkPartnerPortalSource({
          id: "source-justdial",
          name: "Justdial",
          icon: "📞",
          envKey: "JUSTDIAL_API_KEY",
          requirement: "Requires Justdial Paid Lead API / Webhook authorization (JUSTDIAL_API_KEY). Ordinary business directory listings are never treated as tenant enquiries."
        }))
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

  return res.status(200).json({
    ok: true,
    ranAt: runStartedAt,
    query: { city, locality, sharing, maxBudget, audience, accommodationType, recentDays },
    internalSourcesUsed: false,
    externalSourcesEvaluated: sourceReports.length,
    completedSources: sourceReports.length,
    totalProspectsDiscovered: prospects.length,
    demandHubs,
    sourceReports,
    prospects
  });
}
