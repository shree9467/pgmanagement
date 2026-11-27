// Authorized Meta Lead Ads Webhook Endpoint (Facebook & Instagram)
// GET: Handles Meta webhook verification challenge (hub.mode, hub.verify_token, hub.challenge)
// POST: Receives authorized inbound Leadgen webhook events for Facebook/Instagram Lead Ads

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Hub-Signature-256");

  if (req.method === "OPTIONS") return res.status(200).end();

  // 1. Meta Webhook Verification Handshake
  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];
    const expectedToken = String(process.env.META_WEBHOOK_VERIFY_TOKEN || "srinoos_meta_lead_verify").trim();

    if (mode === "subscribe" && token === expectedToken && challenge) {
      return res.status(200).send(String(challenge));
    }
    return res.status(403).json({ ok: false, error: "Meta webhook verification failed." });
  }

  // 2. Inbound Leadgen Event Handler
  if (req.method === "POST") {
    let payload = {};
    try {
      payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    } catch (_) {
      return res.status(400).json({ ok: false, error: "Invalid JSON payload." });
    }

    const entries = Array.isArray(payload?.entry) ? payload.entry : [];
    const leadgenIds = [];
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const ch of changes) {
        if (ch?.field === "leadgen" && ch?.value?.leadgen_id) {
          leadgenIds.push({
            leadgenId: String(ch.value.leadgen_id),
            formId: String(ch.value.form_id || ""),
            pageId: String(ch.value.page_id || ""),
            createdTime: ch.value.created_time || Math.floor(Date.now() / 1000)
          });
        }
      }
    }

    return res.status(200).json({
      ok: true,
      received: leadgenIds.length,
      leadgenEvents: leadgenIds,
      note: process.env.META_PAGE_ACCESS_TOKEN
        ? "Inbound Meta Leadgen event acknowledged."
        : "Webhook active. Set META_PAGE_ACCESS_TOKEN in Vercel env vars to fetch full Leadgen fields."
    });
  }

  return res.status(405).json({ ok: false, error: "Method not allowed." });
}
