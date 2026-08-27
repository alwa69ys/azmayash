// server.js — سرور اصلی آزمایا
require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const Db = require("./db");
const { sendOtpSms } = require("./lib/sms");
const Zarinpal = require("./lib/zarinpal");
const {
  issueSession, clearSession, readSession, requireAuth, requireAdmin,
  hashPassword, checkPassword,
} = require("./lib/auth");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.get("/favicon.ico", (req, res) => res.sendFile(path.join(__dirname, "public", "assets", "logo.png")));

const catLabel = { typing: "تایپ", translate: "ترجمه", language: "زبان انگلیسی", iq: "هوش", ielts: "آیلتس", employment: "استخدامی" };

const QUIZBANK = {
  t4: [
    { q: "Choose the correct sentence.", options: ["She don't like coffee.", "She doesn't likes coffee.", "She doesn't like coffee.", "She not like coffee."], answer: 2 },
    { q: "I ____ this report since 9 AM.", options: ["write", "am writing", "have been writing", "wrote"], answer: 2 },
    { q: "Synonym of 'reluctant':", options: ["eager", "unwilling", "certain", "happy"], answer: 1 },
    { q: "By the time we arrived, the meeting ____.", options: ["already started", "has already started", "had already started", "already starts"], answer: 2 },
    { q: "Choose the correct preposition: interested ____ music.", options: ["on", "at", "in", "for"], answer: 2 },
  ],
  t5: [
    { q: "دنباله را ادامه دهید: ۲، ۴، ۸، ۱۶، ...", options: ["۲۰", "۲۴", "۳۲", "۳۰"], answer: 2 },
    { q: "کدام گزینه با بقیه فرق دارد؟", options: ["سیب", "موز", "هویج", "پرتقال"], answer: 2 },
    { q: "اگر همه‌ی گربه‌ها حیوان‌اند و برخی حیوان‌ها پرنده نیستند، کدام نتیجه درست است؟", options: ["همه گربه‌ها پرنده‌اند", "برخی گربه‌ها ممکن است پرنده نباشند", "هیچ گربه‌ای حیوان نیست", "همه پرنده‌ها گربه‌اند"], answer: 1 },
    { q: "عدد جای‌خالی: ۳، ۶، ۱۱، ۱۸، ...", options: ["۲۵", "۲۷", "۲۴", "۲۶"], answer: 1 },
    { q: "کدام شکل، ادامه‌ی منطقی الگوی مربع-مثلث-مربع-مثلث است؟", options: ["دایره", "مربع", "مثلث", "لوزی"], answer: 1 },
  ],
  t6: [
    { passage: "Urban green spaces play a growing role in the wellbeing of city residents. Studies suggest that regular access to parks reduces stress and improves concentration, particularly among children and the elderly.",
      q: "According to the passage, who benefits most from green spaces?", options: ["Only children", "Only the elderly", "Children and the elderly", "City planners"], answer: 2 },
    { q: "The word 'wellbeing' in the passage is closest in meaning to:", options: ["income", "health and happiness", "population", "architecture"], answer: 1 },
    { q: "What does the passage suggest about stress?", options: ["Parks increase it", "Parks have no effect", "Parks may reduce it", "Parks only affect adults"], answer: 2 },
    { q: "The passage is mainly about:", options: ["City traffic", "Green spaces and wellbeing", "Elderly housing", "Children's education"], answer: 1 },
    { q: "Which age groups are explicitly mentioned?", options: ["Teenagers and adults", "Children and the elderly", "Infants and teenagers", "None"], answer: 1 },
  ],
  t7: [
    { q: "پایتخت استرالیا کدام است؟", options: ["سیدنی", "ملبورن", "کانبرا", "پرت"], answer: 2 },
    { q: "حاصل عبارت ۱۵٪ از ۲۰۰ کدام است؟", options: ["۲۰", "۲۵", "۳۰", "۳۵"], answer: 2 },
    { q: "کدام گزینه جمع صحیح «دانشجو» است؟", options: ["دانشجوها", "دانشجویان", "هر دو گزینه صحیح است", "دانش‌آموزان"], answer: 2 },
    { q: "بزرگ‌ترین اقیانوس جهان کدام است؟", options: ["اقیانوس اطلس", "اقیانوس آرام", "اقیانوس هند", "اقیانوس منجمد شمالی"], answer: 1 },
    { q: "نویسنده‌ی شاهنامه کیست؟", options: ["سعدی", "حافظ", "فردوسی", "مولوی"], answer: 2 },
  ],
};

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}
function genId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ==================== OTP ==================== */
const OTP_TTL_MS = 2 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 45 * 1000;

app.post("/api/otp/send", async (req, res) => {
  const phone = String(req.body.phone || "").trim();
  if (!/^09\d{9}$/.test(phone)) return res.status(400).json({ error: "شماره موبایل معتبر نیست." });

  const existing = Db.otps()[phone];
  if (existing && Date.now() - existing.sentAt < OTP_RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000);
    return res.status(429).json({ error: `لطفاً ${wait} ثانیه‌ی دیگر دوباره تلاش کنید.` });
  }

  const code = crypto.randomInt(10000, 99999).toString();
  Db.saveOtp(phone, { code, expires: Date.now() + OTP_TTL_MS, sentAt: Date.now(), attempts: 0 });
  const result = await sendOtpSms(phone, code);
  res.json({ ok: true, delivered: result.ok });
});

app.post("/api/otp/verify-only", (req, res) => {
  const phone = String(req.body.phone || "").trim();
  const code = String(req.body.code || "").trim();
  const entry = Db.otps()[phone];
  if (!entry) return res.status(400).json({ error: "ابتدا درخواست کد بدهید." });
  if (Date.now() > entry.expires) return res.status(400).json({ error: "کد منقضی شده است." });
  if (entry.attempts >= 5) return res.status(429).json({ error: "تعداد تلاش بیش از حد مجاز است." });
  if (entry.code !== code) {
    Db.saveOtp(phone, { ...entry, attempts: entry.attempts + 1 });
    return res.status(400).json({ error: "کد وارد شده صحیح نیست." });
  }
  res.json({ ok: true });
});

/* ==================== احراز هویت عمومی (پیامکی) ==================== */
function verifyOtpOrThrow(phone, code) {
  const entry = Db.otps()[phone];
  if (!entry) return { ok: false, error: "ابتدا درخواست کد بدهید." };
  if (Date.now() > entry.expires) return { ok: false, error: "کد منقضی شده است." };
  if (entry.code !== code) return { ok: false, error: "کد وارد شده صحیح نیست." };
  return { ok: true };
}

app.post("/api/auth/register", (req, res) => {
  const { name, phone, code } = req.body;
  if (!name || !phone || !code) return res.status(400).json({ error: "همه‌ی فیلدها الزامی است." });
  const check = verifyOtpOrThrow(phone, code);
  if (!check.ok) return res.status(400).json({ error: check.error });
  if (Db.userByPhone(phone)) return res.status(400).json({ error: "این شماره قبلاً ثبت‌نام کرده است." });

  const user = {
    id: genId("u"), name, email: "", phone, passwordHash: null,
    role: "user", createdAt: new Date().toISOString().slice(0, 10), status: "active",
  };
  Db.addUser(user);
  Db.consumeOtp(phone);
  issueSession(res, user);
  res.json({ ok: true, user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { phone, code } = req.body;
  const check = verifyOtpOrThrow(phone, code);
  if (!check.ok) return res.status(400).json({ error: check.error });
  const user = Db.userByPhone(phone);
  if (!user) return res.status(400).json({ error: "این شماره ثبت‌نام نشده است." });
  if (user.status === "blocked") return res.status(403).json({ error: "دسترسی شما مسدود شده است." });
  Db.consumeOtp(phone);
  issueSession(res, user);
  res.json({ ok: true, user: publicUser(user) });
});

app.post("/api/auth/admin-login", (req, res) => {
  const { email, password } = req.body;
  const user = Db.userByEmail(email);
  if (!user || user.role !== "admin" || !checkPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "ایمیل یا رمز عبور نادرست است." });
  }
  issueSession(res, user);
  res.json({ ok: true, user: publicUser(user) });
});

app.post("/api/auth/logout", (req, res) => { clearSession(res); res.json({ ok: true }); });

app.get("/api/auth/me", (req, res) => {
  const session = readSession(req);
  if (!session) return res.json({ user: null });
  const user = Db.userById(session.id);
  res.json({ user: publicUser(user) });
});

/* ==================== آزمون‌ها (عمومی) ==================== */
app.get("/api/tests", (req, res) => {
  res.json(Db.tests().filter((t) => t.status === "active"));
});
app.get("/api/tests/:id", (req, res) => {
  const t = Db.testById(req.params.id);
  if (!t) return res.status(404).json({ error: "آزمون یافت نشد." });
  res.json(t);
});
app.get("/api/tests/:id/quiz", requireAuth, (req, res) => {
  const t = Db.testById(req.params.id);
  if (!t) return res.status(404).json({ error: "آزمون یافت نشد." });
  if (!Db.userHasPaid(req.session.id, t.id)) return res.status(403).json({ error: "ابتدا هزینه‌ی آزمون را پرداخت کنید." });
  const bank = (QUIZBANK[t.id] || []).map(({ answer, ...q }) => q); // پاسخ صحیح برای کاربر فاش نمی‌شود
  res.json(bank);
});

// نمره‌دهی چهارگزینه‌ای‌ها همیشه سمت سرور انجام می‌شود چون پاسخ صحیح
// هرگز به مرورگر کاربر فرستاده نمی‌شود (وگرنه با «مشاهده‌ی کد صفحه» قابل تقلب بود)
app.post("/api/tests/:id/submit", requireAuth, (req, res) => {
  const t = Db.testById(req.params.id);
  if (!t) return res.status(404).json({ error: "آزمون یافت نشد." });
  if (!Db.userHasPaid(req.session.id, t.id)) return res.status(403).json({ error: "این آزمون پرداخت نشده است." });
  const bank = QUIZBANK[t.id] || [];
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  let correct = 0;
  bank.forEach((q, i) => { if (String(answers[i]) === String(q.answer)) correct++; });
  const score = bank.length ? Math.round((correct / bank.length) * 100) : 0;
  const result = {
    id: genId("r"), userId: req.session.id, testId: t.id, score,
    detail: `${correct} پاسخ صحیح از ${bank.length} سؤال`, createdAt: new Date().toLocaleString("fa-IR"),
  };
  Db.addResult(result);
  res.json({ ok: true, result });
});

/* ==================== پرداخت (زرین‌پال واقعی) ==================== */
app.post("/api/payments/request", requireAuth, async (req, res) => {
  const { testId } = req.body;
  const test = Db.testById(testId);
  if (!test) return res.status(404).json({ error: "آزمون یافت نشد." });

  const txId = genId("TX-").toUpperCase();
  const callbackUrl = `${PUBLIC_URL}/api/payments/callback?tx=${txId}`;
  const result = await Zarinpal.requestPayment({
    amount: test.price,
    description: `پرداخت آزمون: ${test.title}`,
    callbackUrl,
  });

  if (!result.ok) return res.status(400).json({ error: result.error });

  Db.addTransaction({
    id: txId, userId: req.session.id, testId, amount: test.price, status: "pending",
    gateway: "zarinpal", ref: result.authority, createdAt: new Date().toLocaleString("fa-IR"),
  });
  res.json({ ok: true, payUrl: result.payUrl });
});

app.get("/api/payments/callback", async (req, res) => {
  const { Authority, Status, tx } = req.query;
  const transaction = Db.transactionById(tx);
  if (!transaction) return res.redirect(`/#/pay-result/${tx}/unknown/0`);

  if (Status !== "OK") {
    Db.updateTransaction(tx, { status: "failed" });
    return res.redirect(`/#/pay-result/${tx}/${transaction.testId}/0`);
  }

  const verify = await Zarinpal.verifyPayment({ amount: transaction.amount, authority: Authority });
  Db.updateTransaction(tx, { status: verify.ok ? "paid" : "failed", refId: verify.refId || "" });
  res.redirect(`/#/pay-result/${tx}/${transaction.testId}/${verify.ok ? "1" : "0"}`);
});

app.get("/api/transactions/mine", requireAuth, (req, res) => {
  res.json(Db.transactions().filter((t) => t.userId === req.session.id));
});

/* ==================== نتایج آزمون ==================== */
app.post("/api/results", requireAuth, (req, res) => {
  const { testId, score, detail } = req.body;
  if (!Db.userHasPaid(req.session.id, testId)) return res.status(403).json({ error: "این آزمون پرداخت نشده است." });
  const result = {
    id: genId("r"), userId: req.session.id, testId,
    score: Math.max(0, Math.min(100, Number(score) || 0)),
    detail: String(detail || ""), createdAt: new Date().toLocaleString("fa-IR"),
  };
  Db.addResult(result);
  res.json({ ok: true, result });
});
app.get("/api/results/mine", requireAuth, (req, res) => {
  res.json(Db.results().filter((r) => r.userId === req.session.id));
});
app.get("/api/results/:id", requireAuth, (req, res) => {
  const r = Db.results().find((x) => x.id === req.params.id);
  if (!r || r.userId !== req.session.id) return res.status(404).json({ error: "یافت نشد." });
  res.json(r);
});

/* ==================== پنل مدیریت ==================== */
app.get("/api/admin/dashboard", requireAdmin, (req, res) => {
  const users = Db.users(), tests = Db.tests(), tx = Db.transactions();
  const revenue = tx.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const pending = tx.filter((t) => t.status === "pending").length;
  const byCat = {};
  tests.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + tx.filter((x) => x.testId === t.id && x.status === "paid").length; });
  res.json({ revenue, userCount: users.length, pending, byCat, recentTx: tx.slice(0, 5), catLabel });
});

app.get("/api/admin/users", requireAdmin, (req, res) => res.json(Db.users().map(publicUser)));
app.patch("/api/admin/users/:id", requireAdmin, (req, res) => {
  const u = Db.updateUser(req.params.id, req.body);
  res.json(publicUser(u));
});
app.delete("/api/admin/users/:id", requireAdmin, (req, res) => { Db.deleteUser(req.params.id); res.json({ ok: true }); });

app.get("/api/admin/tests", requireAdmin, (req, res) => res.json(Db.tests()));
app.post("/api/admin/tests", requireAdmin, (req, res) => {
  const t = { id: genId("t"), status: "active", lang: "fa", content: "", questions: 0, ...req.body };
  Db.addTest(t);
  res.json(t);
});
app.patch("/api/admin/tests/:id", requireAdmin, (req, res) => res.json(Db.updateTest(req.params.id, req.body)));
app.delete("/api/admin/tests/:id", requireAdmin, (req, res) => { Db.deleteTest(req.params.id); res.json({ ok: true }); });

app.get("/api/admin/transactions", requireAdmin, (req, res) => res.json(Db.transactions()));

app.get("/api/admin/settings", requireAdmin, (req, res) => res.json(Db.settings()));
app.patch("/api/admin/settings", requireAdmin, (req, res) => res.json(Db.saveSettings(req.body)));

app.get("/api/admin/meta", requireAdmin, (req, res) => res.json({
  catLabel,
  levelLabel: { basic: "پایه", mid: "متوسط", adv: "پیشرفته" },
  smsProvider: "پارس‌گرین (ParsGreen)",
  smsApiKeySet: Boolean(process.env.SMS_API_KEY),
  zarinpalMerchantSet: Boolean(process.env.ZARINPAL_MERCHANT_ID),
  zarinpalSandbox: Zarinpal.SANDBOX,
}));

/* ==================== fallback SPA ==================== */
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "not found" });
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ آزمایا در حال اجرا روی ${PUBLIC_URL}`);
  console.log(Zarinpal.SANDBOX ? "🧪 حالت زرین‌پال: SANDBOX (تستی)" : "💳 حالت زرین‌پال: واقعی (Production)");
});
