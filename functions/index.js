/**
 * PayPal backend for Firebase Cloud Functions (2nd gen, Node 20).
 * Endpoints: POST /createOrder, POST /captureOrder, POST /sendPayout, GET /payoutStatus
 * Secrets: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE ("sandbox" or "live")
 */
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const PAYPAL_CLIENT_ID = defineSecret("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = defineSecret("PAYPAL_CLIENT_SECRET");
const PAYPAL_MODE = defineSecret("PAYPAL_MODE");
const secrets = [PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE];
const apiBase = (mode) => mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
let cachedToken = "";
let tokenExpiresAt = 0;
async function getAccessToken() {
  const mode = (PAYPAL_MODE.value() || "sandbox").toLowerCase();
  if (cachedToken && Date.now() < tokenExpiresAt) return { token: cachedToken, mode };
  const basic = Buffer.from(`${PAYPAL_CLIENT_ID.value()}:${PAYPAL_CLIENT_SECRET.value()}`).toString("base64");
  const res = await fetch(`${apiBase(mode)}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + Math.max(0, (data.expires_in || 300) - 60) * 1000;
  return { token: cachedToken, mode };
}
async function paypalFetch(path, { method = "GET", body } = {}) {
  const { token, mode } = await getAccessToken();
  const res = await fetch(`${apiBase(mode)}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error_description || JSON.stringify(data).slice(0, 400);
    throw new Error(`PayPal ${path} failed (${res.status}): ${msg}`);
  }
  return data;
}
function validMoney(amount, currency) {
  return typeof amount === "string" && /^\d+(\.\d{1,2})?$/.test(amount) && typeof currency === "string" && /^[A-Z]{3}$/.test(currency);
}
exports.createOrder = onRequest({ secrets, cors: true }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const { amount, currency = "USD" } = req.body || {};
    if (!validMoney(amount, currency)) return res.status(400).json({ error: 'Send { amount: "10.00", currency: "USD" }' });
    const order = await paypalFetch("v2/checkout/orders", { method: "POST", body: { intent: "CAPTURE", purchase_units: [{ amount: { currency_code: currency, value: amount } }] } });
    res.json({ id: order.id });
  } catch (e) { logger.error("createOrder", e); res.status(500).json({ error: e.message }); }
});
exports.captureOrder = onRequest({ secrets, cors: true }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const { orderID } = req.body || {};
    if (!orderID) return res.status(400).json({ error: "Send { orderID }" });
    const capture = await paypalFetch(`v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, { method: "POST", body: {} });
    res.json({ status: capture.status, id: capture.id });
  } catch (e) { logger.error("captureOrder", e); res.status(500).json({ error: e.message }); }
});
exports.sendPayout = onRequest({ secrets, cors: true }, async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
    const { email, amount, currency = "USD", note = "Payout" } = req.body || {};
    if (!email || !validMoney(amount, currency)) return res.status(400).json({ error: 'Send { email, amount: "5.00", currency: "USD", note? }' });
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payout = await paypalFetch("v1/payments/payouts", { method: "POST", body: { sender_batch_header: { sender_batch_id: batchId, email_subject: "You've received a payout" }, items: [{ recipient_type: "EMAIL", receiver: email, amount: { value: amount, currency }, note }] } });
    res.json({ batchId: payout.batch_header && payout.batch_header.payout_batch_id, status: payout.batch_header && payout.batch_header.batch_status });
  } catch (e) { logger.error("sendPayout", e); res.status(500).json({ error: e.message }); }
});
exports.payoutStatus = onRequest({ secrets, cors: true }, async (req, res) => {
  try {
    const payoutBatchId = req.query.payoutBatchId;
    if (!payoutBatchId) return res.status(400).json({ error: "Pass ?payoutBatchId=..." });
    const status = await paypalFetch(`v1/payments/payouts/${encodeURIComponent(payoutBatchId)}`);
    res.json(status);
  } catch (e) { logger.error("payoutStatus", e); res.status(500).json({ error: e.message }); }
});
