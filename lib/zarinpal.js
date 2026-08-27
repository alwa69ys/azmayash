// lib/zarinpal.js — اتصال واقعی به درگاه پرداخت زرین‌پال (REST v4)
// مستندات رسمی: https://docs.zarinpal.com
// برای تست بدون تراکنش واقعی، ZARINPAL_SANDBOX=true را در .env بگذارید.

const fetch = require("node-fetch");

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || "";
const SANDBOX = String(process.env.ZARINPAL_SANDBOX || "true") === "true";

const BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/v4/payment"
  : "https://api.zarinpal.com/pg/v4/payment";
const GATEWAY_BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/StartPay"
  : "https://www.zarinpal.com/pg/StartPay";

async function requestPayment({ amount, description, callbackUrl, mobile }) {
  if (!MERCHANT_ID) {
    return { ok: false, error: "ZARINPAL_MERCHANT_ID تنظیم نشده است. آن را در فایل .env قرار دهید." };
  }
  try {
    const res = await fetch(`${BASE}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount, // به تومان؛ اگر مرچنت شما ریالی است این مقدار را ضربدر ۱۰ کنید
        description,
        callback_url: callbackUrl,
        metadata: mobile ? { mobile } : undefined,
      }),
    });
    const data = await res.json();
    if (data?.data?.code === 100) {
      return { ok: true, authority: data.data.authority, payUrl: `${GATEWAY_BASE}/${data.data.authority}` };
    }
    return { ok: false, error: data?.errors?.message || "خطای نامشخص از زرین‌پال" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function verifyPayment({ amount, authority }) {
  if (!MERCHANT_ID) return { ok: false, error: "ZARINPAL_MERCHANT_ID تنظیم نشده است." };
  try {
    const res = await fetch(`${BASE}/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_id: MERCHANT_ID, amount, authority }),
    });
    const data = await res.json();
    if (data?.data?.code === 100 || data?.data?.code === 101) {
      return { ok: true, refId: data.data.ref_id, alreadyVerified: data.data.code === 101 };
    }
    return { ok: false, error: data?.errors?.message || "پرداخت تأیید نشد" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { requestPayment, verifyPayment, SANDBOX };
