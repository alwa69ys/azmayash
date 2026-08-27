// lib/sms.js — اتصال به وب‌سرویس پیامک پارس‌گرین برای ارسال کد تأیید (OTP)
// -----------------------------------------------------------------------
// ⚠️ نکته‌ی صادقانه: ساختار دقیق و نام پارامترهای متد وب‌سرویس پارس‌گرین
// (Send / SendOTP) در مستندات عمومی به‌طور کامل در دسترس نبود. داخل پنل
// خودتان، کنار هر متد در بخش «وب‌سرویس»، یک لینک «نمونه کد» هست که دقیقاً
// مطابق حساب و نسخه‌ی وب‌سرویس شماست. اگر تابع sendViaParsGreen زیر با
// شماره‌ی شما کار نکرد، فقط کافی‌ست بدنه‌ی همین یک تابع را با نمونه‌کدِ
// REST همان صفحه جایگزین کنید — بقیه‌ی سایت دست‌نخورده کار می‌کند.
//
// تا زمانی‌که این تابع را با نمونه‌کد دقیق پنل خودتان تطبیق ندهید، به‌عنوان
// شبکه‌ی ایمنی، کد تأیید همیشه در لاگ سرور (ترمینالی که `npm start` را
// اجرا کرده‌اید) هم چاپ می‌شود؛ یعنی سایت هرگز کاربر را «گیر» نمی‌اندازد.

const fetch = require("node-fetch");

const SMS_API_KEY = process.env.SMS_API_KEY || "";
const SMS_SENDER = process.env.SMS_SENDER_NUMBER || ""; // شماره خط ارسال‌کننده در پنل پارس‌گرین

async function sendViaParsGreen(phone, message) {
  if (!SMS_API_KEY) {
    console.warn("⚠️ SMS_API_KEY تنظیم نشده — پیامک واقعی ارسال نمی‌شود.");
    return { ok: false, error: "SMS_API_KEY not set" };
  }
  try {
    // ساختار زیر بر اساس متد REST عمومی «Send» پارس‌گرین نوشته شده است.
    // اگر پاسخ خطا داد یا پیامک نرسید: این URL و پارامترها را با نمونه‌کد
    // REST دقیق پنل خودتان (بخش وب‌سرویس → مستندات API) جایگزین کنید.
    const url = "https://login.parsgreen.com/webservice/v2rest/sendSMS/Send";
    const params = new URLSearchParams({
      apiKey: SMS_API_KEY,
      fromNumber: SMS_SENDER,
      toNumber: phone,
      messageContent: message,
    });
    const res = await fetch(`${url}?${params.toString()}`, { method: "GET" });
    const text = await res.text();
    if (!res.ok) {
      console.error("پارس‌گرین پاسخ خطا داد:", res.status, text);
      return { ok: false, error: text };
    }
    return { ok: true, raw: text };
  } catch (err) {
    console.error("خطا در اتصال به وب‌سرویس پارس‌گرین:", err.message);
    return { ok: false, error: err.message };
  }
}

async function sendOtpSms(phone, code) {
  const message = `آزمایا\nکد تأیید شما: ${code}\nاین کد تا ۲ دقیقه معتبر است.`;
  const result = await sendViaParsGreen(phone, message);
  // شبکه‌ی ایمنی: همیشه در لاگ سرور هم چاپ می‌شود
  console.log(`📩 [OTP] ${phone} → ${code}  (ارسال واقعی: ${result.ok ? "موفق" : "ناموفق، به لاگ مراجعه کنید"})`);
  return result;
}

module.exports = { sendOtpSms };
