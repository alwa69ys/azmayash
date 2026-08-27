/* =========================================================
   app.js — کلاینت آزمایا، متصل به بک‌اند واقعی (fetch API)
   ========================================================= */

const catLabel = { typing: "تایپ", translate: "ترجمه", language: "زبان انگلیسی", iq: "هوش", ielts: "آیلتس", employment: "استخدامی" };
const levelLabel = { basic: "پایه", mid: "متوسط", adv: "پیشرفته" };
const levelClass = { basic: "level-basic", mid: "level-mid", adv: "level-adv" };
const fmtPrice = (n) => Number(n).toLocaleString("fa-IR") + " تومان";

/* ---------------- کلاینت API ---------------- */
const Api = {
  async _handle(res) {
    let data = {};
    try { data = await res.json(); } catch { /* بدنه‌ی خالی */ }
    if (!res.ok) throw new Error(data.error || "خطایی رخ داد.");
    return data;
  },
  get(p) { return fetch(p, { credentials: "include" }).then(this._handle); },
  post(p, body) {
    return fetch(p, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body || {}) }).then(this._handle);
  },
  patch(p, body) {
    return fetch(p, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body || {}) }).then(this._handle);
  },
  del(p) { return fetch(p, { method: "DELETE", credentials: "include" }).then(this._handle); },
};

let currentUser = null;
async function refreshCurrentUser() {
  try { const { user } = await Api.get("/api/auth/me"); currentUser = user; }
  catch { currentUser = null; }
  return currentUser;
}

function toast(msg) {
  let el = document.getElementById("globalToast");
  if (!el) { el = document.createElement("div"); el.id = "globalToast"; el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(() => el.classList.remove("show"), 3200);
}
function go(hash) { location.hash = hash; }
function parseHash() {
  const h = location.hash.replace(/^#/, "") || "/";
  return { parts: h.split("/").filter(Boolean) };
}

function renderHeader() {
  const actions = document.getElementById("headerActions");
  if (currentUser) {
    actions.innerHTML = `
      <span class="badge-pill">👤 ${currentUser.name}</span>
      <a class="btn btn-ghost btn-sm" href="#/dashboard">پنل من</a>
      <button class="btn btn-outline btn-sm" id="logoutBtn">خروج</button>`;
    document.getElementById("logoutBtn").onclick = async () => { await Api.post("/api/auth/logout"); currentUser = null; toast("با موفقیت خارج شدید."); go("/"); };
  } else {
    actions.innerHTML = `<a class="btn btn-ghost btn-sm" href="#/login">ورود</a><a class="btn btn-gold btn-sm" href="#/register">ثبت‌نام رایگان</a>`;
  }
  document.getElementById("footerContact").innerHTML = `<a href="tel:021-91001234">021-91001234</a><a href="mailto:support@azmaya.ir">support@azmaya.ir</a>`;
  document.querySelectorAll(".nav-link").forEach((a) => a.classList.toggle("active", a.dataset.r === "/" + (parseHash().parts[0] || "")));
}

function loadingHtml() { return `<div class="empty-state">در حال بارگذاری…</div>`; }
function errorHtml(msg) { return `<div class="container section"><div class="empty-state">${msg}</div></div>`; }

/* ==================================================================
   صفحه خانه
   ================================================================== */
async function viewHome() {
  let tests = [];
  try { tests = (await Api.get("/api/tests")).slice(0, 3); } catch {}
  return `
  <section class="hero">
    <div class="container hero-grid">
      <div>
        <div class="eyebrow">مرکز رسمی سنجش مهارت</div>
        <h1>توانایی‌های خود را با آزمونی معتبر، بی‌طرف و قابل استناد ثابت کنید</h1>
        <p class="lead">آزمایا آزمون‌های تایپ، ترجمه، زبان انگلیسی، هوش و استخدامی را به‌صورت آنلاین برگزار می‌کند و برای هر آزمون، گواهی رسمی و قابل ارائه صادر می‌کند.</p>
        <div style="display:flex;gap:12px;margin-top:26px;flex-wrap:wrap">
          <a href="#/tests" class="btn btn-primary">مشاهده‌ی آزمون‌ها</a>
          <a href="#/register" class="btn btn-outline">ساخت حساب رایگان</a>
        </div>
        <div class="trust-row">
          <div class="trust-item"><div class="num">۱۲,۴۰۰+</div><div class="label">آزمون برگزارشده</div></div>
          <div class="trust-item"><div class="num">۷</div><div class="label">نوع آزمون فعال</div></div>
          <div class="trust-item"><div class="num">۴.۸ / ۵</div><div class="label">رضایت شرکت‌کنندگان</div></div>
        </div>
      </div>
      <div class="seal-panel">
        <svg class="seal" viewBox="0 0 54 54" fill="none">
          <circle cx="27" cy="27" r="25" stroke="#7C3AED" stroke-width="2"/>
          <circle cx="27" cy="27" r="19" stroke="#7C3AED" stroke-width="1" stroke-dasharray="2 3"/>
          <path d="M18 28l6 6 12-13" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3 style="color:#fff;margin-top:16px">گواهی معتبر آزمایا</h3>
        <p style="color:rgba(255,255,255,.65);font-size:13.5px">هر آزمون پس از پرداخت و تکمیل، یک کد رهگیری منحصربه‌فرد و کارنامه‌ی قابل دانلود دریافت می‌کند.</p>
        <div class="badge-list">
          <div class="seal-item"><span>🔒</span><span>پرداخت واقعی از طریق درگاه بانکی زرین‌پال</span></div>
          <div class="seal-item"><span>⏱</span><span>زمان‌سنج دقیق و استاندارد</span></div>
          <div class="seal-item"><span>📄</span><span>کارنامه‌ی قابل دانلود پس از آزمون</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:20px">
    <div class="container">
      <div class="eyebrow">فرایند آزمایا</div>
      <h2>در سه گام ساده، آزمون خود را شروع کنید</h2>
      <div class="grid grid-3" style="margin-top:30px">
        ${[
          ["۱","انتخاب آزمون","از میان آزمون‌های تایپ، ترجمه، زبان، هوش و استخدامی، آزمون موردنظر خود را انتخاب کنید."],
          ["۲","پرداخت امن هزینه","هزینه‌ی آزمون را از طریق درگاه بانکی زرین‌پال پرداخت می‌کنید و بلافاصله دسترسی فعال می‌شود."],
          ["۳","شرکت در آزمون و دریافت کارنامه","آزمون را در زمان تعیین‌شده انجام می‌دهید و کارنامه‌ی نهایی را دریافت می‌کنید."]
        ].map(([n,t,d])=>`
        <div class="card">
          <div class="mono" style="color:var(--accent-1);font-weight:700;font-size:14px">مرحله ${n}</div>
          <h3 style="margin-top:8px">${t}</h3>
          <p style="margin:0">${d}</p>
        </div>`).join("")}
      </div>
    </div>
  </section>

  <section class="section-tight" style="background:#fff;border-top:1px solid var(--line-200);border-bottom:1px solid var(--line-200)">
    <div class="container">
      <div style="display:flex;justify-content:space-between;align-items:end;flex-wrap:wrap;gap:12px">
        <div><div class="eyebrow">پرمخاطب‌ترین آزمون‌ها</div><h2 style="margin-bottom:0">شروع کنید با یکی از این آزمون‌ها</h2></div>
        <a href="#/tests" class="btn btn-outline">مشاهده همه</a>
      </div>
      <div class="grid grid-3" style="margin-top:28px">
        ${tests.length ? tests.map(testCardHtml).join("") : `<div class="empty-state">در حال حاضر آزمونی فعال نیست.</div>`}
      </div>
    </div>
  </section>`;
}

function testCardHtml(t) {
  return `
  <div class="card test-card">
    <span class="top-badge">🎖 دارای گواهی</span>
    <span class="cat">${catLabel[t.category] || t.category}</span>
    <h3 style="margin:2px 0">${t.title}</h3>
    <span class="level-tag ${levelClass[t.level]}">سطح ${levelLabel[t.level]}</span>
    <p style="font-size:13.5px;margin-top:6px">${t.desc || ""}</p>
    <div class="meta-row">
      <span>⏱ ${t.duration} دقیقه</span>
      ${t.questions ? `<span>📋 ${t.questions} سؤال</span>` : ""}
    </div>
    <div class="price-row">
      <div class="price">${fmtPrice(t.price)}</div>
      <a href="#/test/${t.id}" class="btn btn-primary btn-sm">مشاهده و شروع</a>
    </div>
  </div>`;
}

/* ==================================================================
   کاتالوگ آزمون‌ها
   ================================================================== */
let allTestsCache = [];
let activeFilter = "all";
async function viewTests() {
  try { allTestsCache = await Api.get("/api/tests"); } catch { return errorHtml("خطا در دریافت لیست آزمون‌ها."); }
  const cats = ["all", ...new Set(allTestsCache.map((t) => t.category))];
  const list = allTestsCache.filter((t) => activeFilter === "all" || t.category === activeFilter);
  return `
  <section class="section">
    <div class="container">
      <div class="eyebrow">کاتالوگ آزمون‌ها</div>
      <h1 style="font-size:30px">همه‌ی آزمون‌های مهارتی</h1>
      <p>تمام آزمون‌ها پیش از شروع نیازمند پرداخت آنلاین هزینه‌ی ثبت‌نام هستند.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:22px 0 30px">
        ${cats.map((c) => `<button class="btn ${activeFilter===c?"btn-primary":"btn-outline"} btn-sm" onclick="setFilter('${c}')">${c==="all"?"همه":catLabel[c]}</button>`).join("")}
      </div>
      <div class="grid grid-3">${list.length ? list.map(testCardHtml).join("") : `<div class="empty-state">آزمونی در این دسته یافت نشد.</div>`}</div>
    </div>
  </section>`;
}
function setFilter(c) { activeFilter = c; renderApp(); }

/* ==================================================================
   جزئیات آزمون
   ================================================================== */
async function viewTestDetail(id) {
  let t, paid = false;
  try { t = await Api.get(`/api/tests/${id}`); } catch { return errorHtml("آزمون یافت نشد."); }
  if (currentUser) {
    try { const myTx = await Api.get("/api/transactions/mine"); paid = myTx.some((x) => x.testId === id && x.status === "paid"); } catch {}
  }
  return `
  <section class="section">
    <div class="container" style="max-width:920px">
      <a href="#/tests" style="font-size:13px;color:var(--slate-500)">← بازگشت به فهرست آزمون‌ها</a>
      <div class="card" style="margin-top:16px;padding:34px">
        <span class="level-tag ${levelClass[t.level]}">سطح ${levelLabel[t.level]}</span>
        <h1 style="margin-top:12px">${t.title}</h1>
        <p style="font-size:15.5px">${t.desc || ""}</p>
        <div class="meta-row" style="font-size:14px;margin:14px 0 22px">
          <span>⏱ مدت زمان: ${t.duration} دقیقه</span>
          ${t.questions ? `<span>📋 ${t.questions} سؤال</span>` : ""}
          <span>🎖 صدور گواهی پس از قبولی</span>
        </div>
        <hr class="hairline">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px;flex-wrap:wrap;gap:14px">
          <div><div style="font-size:12.5px;color:var(--slate-500)">هزینه‌ی ثبت‌نام در این آزمون</div><div class="price" style="font-size:26px">${fmtPrice(t.price)}</div></div>
          ${paid ? `<a href="#/exam/${t.id}" class="btn btn-gold">شروع آزمون</a>` : `<button class="btn btn-primary" id="payBtn">پرداخت و ثبت‌نام</button>`}
        </div>
        ${paid ? `<p style="margin-top:14px;color:var(--success-600);font-size:13px">✅ هزینه‌ی این آزمون قبلاً پرداخت شده و آماده‌ی شروع است.</p>` : ""}
      </div>
    </div>
  </section>`;
}
function bindTestDetail(id) {
  const btn = document.getElementById("payBtn");
  if (!btn) return;
  btn.onclick = async () => {
    if (!currentUser) { toast("ابتدا وارد حساب کاربری خود شوید."); go("/login"); return; }
    btn.disabled = true; btn.textContent = "در حال اتصال به درگاه…";
    try {
      const { payUrl } = await Api.post("/api/payments/request", { testId: id });
      location.href = payUrl; // هدایت واقعی به درگاه زرین‌پال
    } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = "پرداخت و ثبت‌نام"; }
  };
}

/* ==================================================================
   نتیجه‌ی بازگشت از درگاه پرداخت
   ================================================================== */
async function viewPayResult(txId, testId, ok) {
  let t = null;
  try { t = await Api.get(`/api/tests/${testId}`); } catch {}
  return `
  <section class="section">
    <div class="container-narrow" style="text-align:center">
      <div class="form-card">
        <div style="font-size:48px">${ok === "1" ? "✅" : "⚠️"}</div>
        <h2>${ok === "1" ? "پرداخت با موفقیت انجام شد" : "پرداخت ناموفق بود یا لغو شد"}</h2>
        <p>${ok === "1" ? `اکنون می‌توانید در آزمون «${t?t.title:""}» شرکت کنید.` : "مبلغی از حساب شما با موفقیت کسر نشده است. می‌توانید دوباره تلاش کنید."}</p>
        ${ok === "1" ? `<a href="#/exam/${testId}" class="btn btn-gold btn-block">شروع آزمون</a>` : `<a href="#/test/${testId}" class="btn btn-primary btn-block">بازگشت به صفحه آزمون</a>`}
        <a href="#/dashboard" class="btn btn-ghost btn-block" style="margin-top:8px">رفتن به پنل کاربری</a>
      </div>
    </div>
  </section>`;
}

/* ==================================================================
   ورود / ثبت‌نام با کد پیامکی
   ================================================================== */
function authVisual(mode) {
  return mode === "login"
    ? { eyebrow: "خوش آمدید", title: "با کد پیامکی وارد حساب خود شوید", desc: "شماره موبایل خود را وارد کنید تا کد تأیید برایتان پیامک شود؛ نیازی به رمز عبور نیست." }
    : { eyebrow: "عضویت رایگان", title: "در چند ثانیه با شماره موبایل ثبت‌نام کنید", desc: "ثبت‌نام رایگان است؛ فقط برای شرکت در هر آزمون، هزینه‌ی همان آزمون را پرداخت می‌کنید." };
}
function viewAuth(mode) {
  const v = authVisual(mode);
  return `
  <div class="split-auth">
    <div class="visual">
      <div class="eyebrow" style="color:#A78BFA">${v.eyebrow}</div>
      <h2>${v.title}</h2>
      <p style="color:rgba(255,255,255,.65)">${v.desc}</p>
      <div class="seal-item" style="margin-top:26px;max-width:300px"><span>🔒</span><span style="font-size:12.5px">ورود امن با احراز هویت پیامکی واقعی از طریق آزمایا</span></div>
    </div>
    <div class="form-side">
      <div style="width:100%;max-width:380px" id="authBox">
        ${authStepPhoneHtml(mode)}
        <p style="text-align:center;margin-top:16px;font-size:13.5px">
          ${mode === "login" ? `حساب ندارید؟ <a href="#/register" style="color:var(--ink-900);font-weight:700">ثبت‌نام کنید</a>` : `قبلاً ثبت‌نام کرده‌اید؟ <a href="#/login" style="color:var(--ink-900);font-weight:700">ورود</a>`}
        </p>
      </div>
    </div>
  </div>`;
}
function authStepPhoneHtml(mode) {
  return `
  <h2>${mode === "login" ? "ورود با شماره موبایل" : "ثبت‌نام با شماره موبایل"}</h2>
  <form id="authPhoneForm">
    ${mode === "register" ? `<div class="field"><label>نام و نام‌خانوادگی</label><input name="name" required></div>` : ""}
    <div class="field"><label>شماره موبایل</label><input name="phone" required pattern="09[0-9]{9}" placeholder="09xxxxxxxxx" dir="ltr" style="text-align:left"></div>
    <button class="btn btn-gold btn-block" id="sendCodeBtn">ارسال کد تأیید پیامکی</button>
  </form>`;
}
function viewLogin() { return viewAuth("login"); }
function viewRegister() { return viewAuth("register"); }

function bindAuthForm(mode) {
  const f = document.getElementById("authPhoneForm");
  if (!f) return;
  f.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const phone = fd.get("phone").trim();
    const name = fd.get("name") ? fd.get("name").trim() : "";
    const btn = document.getElementById("sendCodeBtn");
    btn.disabled = true; btn.textContent = "در حال ارسال…";
    try {
      const r = await Api.post("/api/otp/send", { phone });
      document.getElementById("authBox").innerHTML = authStepCodeHtml(mode, phone, name);
      bindCodeForm(mode, phone, name);
      toast(r.delivered ? "کد تأیید پیامک شد." : "کد صادر شد؛ اگر پیامک نرسید، لطفاً از پشتیبانی بپرسید (کد در لاگ سرور هم ثبت می‌شود).");
    } catch (err) { toast(err.message); btn.disabled = false; btn.textContent = "ارسال کد تأیید پیامکی"; }
  };
}
function authStepCodeHtml(mode, phone) {
  return `
  <h2>کد تأیید را وارد کنید</h2>
  <p style="font-size:13.5px">کد ۵ رقمی به شماره <span class="mono">${phone}</span> پیامک شد.</p>
  <form id="authCodeForm">
    <div class="field"><label>کد تأیید</label><input name="code" required maxlength="5" pattern="[0-9]{5}" dir="ltr" style="text-align:center;letter-spacing:6px;font-size:20px" placeholder="•••••"></div>
    <button class="btn btn-gold btn-block" id="verifyBtn">تأیید و ${mode === "login" ? "ورود" : "تکمیل ثبت‌نام"}</button>
    <button type="button" id="resendCodeBtn" class="btn btn-ghost btn-block" style="margin-top:6px">ارسال مجدد کد</button>
  </form>`;
}
function bindCodeForm(mode, phone, name) {
  const f = document.getElementById("authCodeForm");
  f.onsubmit = async (e) => {
    e.preventDefault();
    const code = new FormData(f).get("code").trim();
    const btn = document.getElementById("verifyBtn");
    btn.disabled = true; btn.textContent = "در حال بررسی…";
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { phone, code } : { name, phone, code };
      const r = await Api.post(endpoint, body);
      currentUser = r.user;
      toast(mode === "login" ? "ورود موفقیت‌آمیز بود." : "ثبت‌نام با موفقیت انجام شد.");
      go("/dashboard");
    } catch (err) { toast(err.message); btn.disabled = false; btn.textContent = `تأیید و ${mode === "login" ? "ورود" : "تکمیل ثبت‌نام"}`; }
  };
  document.getElementById("resendCodeBtn").onclick = async () => {
    try { const r = await Api.post("/api/otp/send", { phone }); toast(r.delivered ? "کد جدید پیامک شد." : "کد جدید صادر شد."); }
    catch (err) { toast(err.message); }
  };
}

/* ==================================================================
   پنل کاربری
   ================================================================== */
async function viewDashboard() {
  if (!currentUser) { go("/login"); return loadingHtml(); }
  let myTx = [], myResults = [], tests = [];
  try { [myTx, myResults, tests] = await Promise.all([Api.get("/api/transactions/mine"), Api.get("/api/results/mine"), Api.get("/api/tests")]); }
  catch { return errorHtml("خطا در بارگذاری پنل کاربری."); }
  const testMap = Object.fromEntries(tests.map((t) => [t.id, t]));
  return `
  <section class="section">
    <div class="container">
      <div class="eyebrow">پنل کاربری</div>
      <h1 style="font-size:28px">سلام، ${currentUser.name.split(" ")[0]} 👋</h1>
      <div class="grid grid-3" style="margin:26px 0">
        <div class="stat-card"><div class="stat-label">آزمون‌های خریداری‌شده</div><div class="stat-value">${myTx.filter((t)=>t.status==="paid").length}</div></div>
        <div class="stat-card"><div class="stat-label">آزمون‌های تکمیل‌شده</div><div class="stat-value">${myResults.length}</div></div>
        <div class="stat-card"><div class="stat-label">در انتظار پرداخت</div><div class="stat-value">${myTx.filter((t)=>t.status==="pending").length}</div></div>
      </div>
      <h3>تراکنش‌های من</h3>
      <div class="card" style="padding:0;overflow:auto">
        <table>
          <thead><tr><th>کد تراکنش</th><th>آزمون</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead>
          <tbody>
          ${myTx.length ? myTx.map((tx) => `<tr>
            <td class="mono">${tx.id}</td><td>${testMap[tx.testId]?.title || "-"}</td><td class="mono">${fmtPrice(tx.amount)}</td>
            <td><span class="status status-${tx.status==="paid"?"paid":tx.status==="pending"?"pending":"failed"}">${tx.status==="paid"?"پرداخت‌شده":tx.status==="pending"?"در انتظار":"ناموفق"}</span></td>
            <td class="mono" style="font-size:12px">${tx.createdAt}</td>
            <td>${tx.status==="paid"?`<a href="#/exam/${tx.testId}" class="btn btn-sm btn-outline">شروع آزمون</a>`:tx.status==="pending"?`<a href="#/test/${tx.testId}" class="btn btn-sm btn-outline">مشاهده آزمون</a>`:""}</td>
          </tr>`).join("") : `<tr><td colspan="6"><div class="empty-state">هنوز تراکنشی ثبت نشده است.</div></td></tr>`}
          </tbody>
        </table>
      </div>
      <h3 style="margin-top:30px">کارنامه‌ها</h3>
      <div class="grid grid-3">
        ${myResults.length ? myResults.map((r) => `<div class="result-stat"><div class="v">${r.score}</div><div class="l">${testMap[r.testId]?.title || ""}</div><div style="font-size:12px;color:var(--slate-500);margin-top:8px">${r.detail}</div></div>`).join("") : `<div class="empty-state">هنوز کارنامه‌ای ثبت نشده.</div>`}
      </div>
    </div>
  </section>`;
}

/* ==================================================================
   موتور آزمون
   ================================================================== */
async function viewExam(id) {
  if (!currentUser) { go("/login"); return loadingHtml(); }
  let t;
  try { t = await Api.get(`/api/tests/${id}`); } catch { return errorHtml("آزمون یافت نشد."); }
  let paid = false;
  try { const myTx = await Api.get("/api/transactions/mine"); paid = myTx.some((x) => x.testId === id && x.status === "paid"); } catch {}
  if (!paid) return `<div class="container section"><div class="empty-state">برای شرکت در این آزمون ابتدا باید هزینه را پرداخت کنید.<br><br><a href="#/test/${id}" class="btn btn-primary">بازگشت به صفحه آزمون</a></div></div>`;
  if (t.category === "typing") return examTypingHtml(t);
  if (t.category === "translate") return examTranslateHtml(t);
  return await examQuizHtml(t);
}

function examTypingHtml(t) {
  return `
  <section class="section"><div class="container exam-shell">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h2 style="margin:0">${t.title}</h2><div class="timer-box">⏱ <span id="timeLeft">${t.duration*60}</span> ثانیه</div></div>
    <p style="font-size:13.5px">متن زیر را دقیقاً همان‌طور که نوشته شده تایپ کنید. سرعت (WPM) و صحت شما محاسبه می‌شود.</p>
    <div class="passage-box" id="passageBox">${renderPassage(t.content, "")}</div>
    <textarea id="typeInput" class="typing-input" rows="4" placeholder="اینجا تایپ کنید…" autofocus></textarea>
    <div style="display:flex;justify-content:space-between;margin-top:16px">
      <div class="mono" id="liveStats" style="font-size:13px;color:var(--slate-500)">سرعت: ۰ کلمه/دقیقه — صحت: ۱۰۰٪</div>
      <button class="btn btn-primary" id="submitTyping">پایان و ثبت نتیجه</button>
    </div>
  </div></section>`;
}
function renderPassage(text, typed) {
  return text.split("").map((ch, i) => {
    if (i < typed.length) return `<span class="${typed[i]===ch?"ok":"bad"}">${ch}</span>`;
    if (i === typed.length) return `<span class="cur">${ch}</span>`;
    return `<span>${ch}</span>`;
  }).join("");
}
function initTypingExam(testId, content, totalSeconds) {
  const input = document.getElementById("typeInput"), box = document.getElementById("passageBox");
  const timeEl = document.getElementById("timeLeft"), stats = document.getElementById("liveStats");
  let remaining = totalSeconds, started = false, timer = null;
  function tick() { remaining--; timeEl.textContent = remaining; if (remaining <= 0) { clearInterval(timer); finish(); } }
  input.addEventListener("input", () => {
    if (!started) { started = true; timer = setInterval(tick, 1000); }
    const typed = input.value;
    box.innerHTML = renderPassage(content, typed);
    const words = typed.trim().length ? typed.trim().split(/\s+/).length : 0;
    const elapsedMin = Math.max((totalSeconds - remaining) / 60, 1 / 60);
    const wpm = Math.round(words / elapsedMin);
    let correct = 0; for (let i = 0; i < typed.length; i++) if (typed[i] === content[i]) correct++;
    const acc = typed.length ? Math.round((correct / typed.length) * 100) : 100;
    stats.textContent = `سرعت: ${wpm} کلمه/دقیقه — صحت: ${acc}٪`;
    if (typed.length >= content.length) finish();
  });
  document.getElementById("submitTyping").onclick = finish;
  let done = false;
  function finish() {
    if (done) return; done = true;
    if (timer) clearInterval(timer);
    input.disabled = true;
    const typed = input.value;
    let correct = 0; for (let i = 0; i < typed.length; i++) if (typed[i] === content[i]) correct++;
    const acc = typed.length ? Math.round((correct / typed.length) * 100) : 0;
    const words = typed.trim().length ? typed.trim().split(/\s+/).length : 0;
    const elapsedMin = Math.max((totalSeconds - remaining) / 60, 1 / 60);
    const wpm = Math.round(words / elapsedMin);
    const score = Math.min(100, Math.round(wpm * 0.6 + acc * 0.4));
    saveResult(testId, score, `سرعت: ${wpm} کلمه در دقیقه — صحت: ${acc}٪`);
  }
}

function examTranslateHtml(t) {
  return `
  <section class="section"><div class="container exam-shell">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h2 style="margin:0">${t.title}</h2><div class="timer-box">⏱ <span id="timeLeft">${t.duration*60}</span> ثانیه</div></div>
    <p style="font-size:13.5px">متن زیر را با دقت به فارسی ترجمه کنید.</p>
    <div class="passage-box" style="font-family:var(--font-body);font-size:16px">${t.content}</div>
    <textarea id="translateInput" class="typing-input" rows="8" placeholder="ترجمه‌ی خود را اینجا بنویسید…" autofocus></textarea>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">
      <span class="mono" id="wordCount" style="font-size:13px;color:var(--slate-500)">۰ کلمه</span>
      <button class="btn btn-primary" id="submitTranslate">پایان و ثبت ترجمه</button>
    </div>
  </div></section>`;
}
function initTranslateExam(testId, totalSeconds) {
  const input = document.getElementById("translateInput"), timeEl = document.getElementById("timeLeft"), wc = document.getElementById("wordCount");
  let remaining = totalSeconds, done = false;
  const timer = setInterval(() => { remaining--; timeEl.textContent = remaining; if (remaining <= 0) { clearInterval(timer); finish(); } }, 1000);
  input.addEventListener("input", () => { const words = input.value.trim().length ? input.value.trim().split(/\s+/).length : 0; wc.textContent = words.toLocaleString("fa-IR") + " کلمه"; });
  document.getElementById("submitTranslate").onclick = finish;
  function finish() {
    if (done) return; done = true;
    clearInterval(timer); input.disabled = true;
    const words = input.value.trim().length ? input.value.trim().split(/\s+/).length : 0;
    const score = Math.min(100, Math.max(40, Math.round(words * 3)));
    saveResult(testId, score, `تعداد کلمات ترجمه‌شده: ${words} — در انتظار بازبینی نهایی داور`);
  }
}

async function examQuizHtml(t) {
  let bank = [];
  try { bank = await Api.get(`/api/tests/${t.id}/quiz`); } catch (e) { return errorHtml(e.message); }
  window.__quizBank = bank; // مستقیماً ست می‌شود چون <script> تزریق‌شده با innerHTML اجرا نمی‌شود
  return `
  <section class="section"><div class="container exam-shell">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h2 style="margin:0">${t.title}</h2><div class="timer-box">⏱ <span id="timeLeft">${t.duration*60}</span> ثانیه</div></div>
    <form id="quizForm">
      ${bank.map((q, i) => `
      <div class="card" style="margin-bottom:14px">
        ${q.passage ? `<p style="font-size:13.5px;background:var(--paper-100);padding:12px;border-radius:6px">${q.passage}</p>` : ""}
        <h3 style="font-size:15.5px">${i+1}. ${q.q}</h3>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">
          ${q.options.map((op, oi) => `<label style="display:flex;align-items:center;gap:8px;font-size:14px;padding:8px 10px;border:1px solid var(--line-200);border-radius:6px;cursor:pointer"><input type="radio" name="q${i}" value="${oi}"> ${op}</label>`).join("")}
        </div>
      </div>`).join("")}
      <button class="btn btn-primary btn-block" type="submit">پایان و ثبت نتیجه</button>
    </form>
  </div></section>`;
}
function initQuizExam(testId, totalSeconds) {
  const bank = window.__quizBank || [];
  const timeEl = document.getElementById("timeLeft");
  let remaining = totalSeconds, done = false;
  const timer = setInterval(() => { remaining--; timeEl.textContent = remaining; if (remaining <= 0) { clearInterval(timer); document.getElementById("quizForm").requestSubmit(); } }, 1000);
  document.getElementById("quizForm").onsubmit = async (e) => {
    e.preventDefault();
    if (done) return; done = true;
    clearInterval(timer);
    const fd = new FormData(e.target);
    const answers = bank.map((_, i) => { const v = fd.get("q" + i); return v === null ? null : parseInt(v); });
    try {
      const { result } = await Api.post(`/api/tests/${testId}/submit`, { answers });
      go("/result/" + result.id);
    } catch (err) { toast(err.message); done = false; }
  };
}
async function saveResult(testId, score, detail) {
  try {
    const { result } = await Api.post("/api/results", { testId, score, detail });
    go("/result/" + result.id);
  } catch (e) { toast(e.message); }
}

async function viewResult(id) {
  let r, t;
  try { r = await Api.get(`/api/results/${id}`); t = await Api.get(`/api/tests/${r.testId}`); }
  catch { return errorHtml("نتیجه‌ای یافت نشد."); }
  return `
  <section class="section"><div class="container-narrow" style="text-align:center">
    <div class="form-card">
      <div class="eyebrow" style="justify-content:center">کارنامه‌ی رسمی</div>
      <h2>${t.title}</h2>
      <div class="result-stat" style="margin:20px auto;max-width:220px"><div class="v">${r.score}</div><div class="l">امتیاز از ۱۰۰</div></div>
      <p>${r.detail}</p>
      <p style="font-size:12px" class="mono">کد رهگیری: ${r.id.toUpperCase()} — ${r.createdAt}</p>
      <div style="display:flex;gap:10px;margin-top:10px">
        <button class="btn btn-outline btn-block" onclick="toast('دانلود PDF در گام بعدی توسعه اضافه می‌شود.')">📄 دانلود گواهی PDF</button>
        <a href="#/dashboard" class="btn btn-primary btn-block">بازگشت به پنل من</a>
      </div>
    </div>
  </div></section>`;
}

/* ==================================================================
   پنل مدیریت
   ================================================================== */
function adminShell(root, bodyHtml) {
  const NAV = [
    { r: "/admin", icon: "📊", label: "داشبورد" },
    { r: "/admin/users", icon: "👥", label: "کاربران" },
    { r: "/admin/tests", icon: "📝", label: "آزمون‌ها" },
    { r: "/admin/payments", icon: "💳", label: "تراکنش‌ها" },
    { r: "/admin/settings", icon: "⚙️", label: "تنظیمات سامانه" },
  ];
  return `
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="brand"><img class="brand-mark" src="/assets/logo.png" alt="آزمایا"><span>آزمایا <small>پنل مدیریت</small></span></div>
      <div class="admin-nav-divider">مدیریت</div>
      <div class="admin-nav">${NAV.map((n) => `<a href="#${n.r}" class="${root===n.r?"active":""}"><span class="ico">${n.icon}</span>${n.label}</a>`).join("")}</div>
      <div style="margin-top:auto;padding-top:20px">
        <a href="#/" style="display:flex;gap:10px;padding:11px 12px;color:rgba(255,255,255,.6);font-size:13.5px">🌐 مشاهده‌ی سایت</a>
        <button onclick="adminLogout()" style="display:flex;gap:10px;padding:11px 12px;color:rgba(255,255,255,.6);font-size:13.5px;background:none;border:none;width:100%;text-align:right;font-family:inherit">🚪 خروج از حساب</button>
      </div>
    </aside>
    <div class="admin-main">
      <div class="admin-topbar"><div style="font-weight:700;color:var(--ink-900)">${NAV.find((n) => n.r === root)?.label || ""}</div><div class="badge-pill">👤 ${currentUser ? currentUser.name : ""}</div></div>
      <div class="admin-body">${bodyHtml}</div>
    </div>
  </div>`;
}
async function adminLogout() { await Api.post("/api/auth/logout"); currentUser = null; go("/admin/login"); }

function viewAdminLogin() {
  return `
  <div class="split-auth">
    <div class="visual"><div class="eyebrow" style="color:#A78BFA">دسترسی محدود</div><h2>ورود به پنل مدیریت آزمایا</h2><p style="color:rgba(255,255,255,.65)">این بخش تنها برای مدیران سامانه در دسترس است.</p><p style="color:rgba(255,255,255,.4);font-size:12px;margin-top:24px">حساب نمونه: admin@azmaya.ir / admin123</p></div>
    <div class="form-side"><div style="width:100%;max-width:380px"><h2>ورود مدیر</h2>
      <form id="adminLoginForm">
        <div class="field"><label>ایمیل</label><input type="email" name="email" required></div>
        <div class="field"><label>رمز عبور</label><input type="password" name="password" required></div>
        <button class="btn btn-primary btn-block">ورود</button>
      </form>
    </div></div>
  </div>`;
}
function bindAdminLoginForm() {
  const f = document.getElementById("adminLoginForm");
  if (!f) return;
  f.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    try { const r = await Api.post("/api/auth/admin-login", { email: fd.get("email"), password: fd.get("password") }); currentUser = r.user; toast("ورود موفق."); go("/admin"); }
    catch (err) { toast(err.message); }
  };
}

async function adminDashboardView() {
  const d = await Api.get("/api/admin/dashboard");
  const max = Math.max(1, ...Object.values(d.byCat));
  return `
  <div class="grid grid-3" style="margin-bottom:22px">
    <div class="stat-card"><div class="stat-label">درآمد کل</div><div class="stat-value">${d.revenue.toLocaleString("fa-IR")}</div><div class="stat-delta up">تومان ▲ از تراکنش‌های موفق</div></div>
    <div class="stat-card"><div class="stat-label">تعداد کاربران</div><div class="stat-value mono">${d.userCount}</div><div class="stat-delta up">▲ فعال</div></div>
    <div class="stat-card"><div class="stat-label">تراکنش در انتظار</div><div class="stat-value mono">${d.pending}</div><div class="stat-delta down">نیازمند پیگیری</div></div>
  </div>
  <div class="grid grid-2">
    <div class="card"><h3>فروش به تفکیک دسته‌ی آزمون</h3>
      <div class="bar-chart">${Object.entries(d.byCat).map(([c,v])=>`<div class="bar" style="height:${(v/max)*100}%"><span>${v}</span></div>`).join("")}</div>
      <div class="bar-labels">${Object.keys(d.byCat).map((c) => `<div>${d.catLabel[c]||c}</div>`).join("")}</div>
    </div>
    <div class="card"><h3>آخرین تراکنش‌ها</h3>
      <table><tbody>${d.recentTx.map((t) => `<tr><td class="mono" style="font-size:12px">${t.id}</td><td class="mono" style="font-size:12px">${fmtPrice(t.amount)}</td><td><span class="status status-${t.status==="paid"?"paid":t.status==="pending"?"pending":"failed"}">${t.status==="paid"?"موفق":t.status==="pending"?"در انتظار":"ناموفق"}</span></td></tr>`).join("")}</tbody></table>
    </div>
  </div>`;
}

async function adminUsersView() {
  const users = await Api.get("/api/admin/users");
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div class="mono" style="font-size:13px;color:var(--slate-500)">${users.length} کاربر ثبت‌شده</div></div>
  <div class="card" style="padding:0;overflow:auto"><table id="usersTable">
    <thead><tr><th>نام</th><th>ایمیل</th><th>موبایل</th><th>نقش</th><th>وضعیت</th><th>تاریخ عضویت</th><th></th></tr></thead>
    <tbody>${usersRows(users)}</tbody>
  </table></div>`;
}
function usersRows(users) {
  return users.map((u) => `
    <tr>
      <td>${u.name}</td><td class="mono" style="font-size:12.5px">${u.email||"-"}</td><td class="mono" style="font-size:12.5px">${u.phone}</td>
      <td>${u.role==="admin"?'<span class="badge-pill">مدیر</span>':"کاربر"}</td>
      <td><span class="status ${u.status==="active"?"status-paid":"status-failed"}">${u.status==="active"?"فعال":"مسدود"}</span></td>
      <td class="mono" style="font-size:12px">${u.createdAt}</td>
      <td style="white-space:nowrap">${u.role!=="admin" ? `<button class="btn btn-sm btn-outline" onclick="toggleUserStatus('${u.id}','${u.status}')">${u.status==="active"?"مسدودسازی":"فعال‌سازی"}</button>
        <button class="btn btn-sm btn-danger" onclick="confirmAction('حذف کاربر','کاربر «${u.name}» حذف شود؟',async()=>{await Api.del('/api/admin/users/${u.id}'); renderApp();})">حذف</button>` : ""}</td>
    </tr>`).join("") || `<tr><td colspan="7"><div class="empty-state">کاربری یافت نشد.</div></td></tr>`;
}
async function toggleUserStatus(id, status) { await Api.patch(`/api/admin/users/${id}`, { status: status === "active" ? "blocked" : "active" }); renderApp(); toast("وضعیت کاربر به‌روزرسانی شد."); }

async function adminTestsView() {
  const tests = await Api.get("/api/admin/tests");
  return `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
    <div class="mono" style="font-size:13px;color:var(--slate-500)">${tests.length} آزمون تعریف‌شده</div>
    <button class="btn btn-primary btn-sm" onclick="openTestForm()">+ افزودن آزمون جدید</button>
  </div>
  <div id="testFormWrap"></div>
  <div class="card" style="padding:0;overflow:auto"><table>
    <thead><tr><th>عنوان</th><th>دسته</th><th>سطح</th><th>مدت</th><th>قیمت</th><th>وضعیت</th><th></th></tr></thead>
    <tbody>${tests.map((t) => `
    <tr>
      <td>${t.title}</td><td>${catLabel[t.category]||t.category}</td>
      <td><span class="level-tag ${levelClass[t.level]}">${levelLabel[t.level]}</span></td>
      <td class="mono">${t.duration} د</td><td class="mono">${fmtPrice(t.price)}</td>
      <td><span class="status ${t.status==="active"?"status-paid":"status-failed"}">${t.status==="active"?"فعال":"غیرفعال"}</span></td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm btn-outline" onclick='openTestForm(${JSON.stringify(t.id)})'>ویرایش</button>
        <button class="btn btn-sm btn-outline" onclick="toggleTestStatus('${t.id}','${t.status}')">${t.status==="active"?"غیرفعال‌سازی":"فعال‌سازی"}</button>
        <button class="btn btn-sm btn-danger" onclick="confirmAction('حذف آزمون','آزمون «${t.title}» حذف شود؟',async()=>{await Api.del('/api/admin/tests/${t.id}'); renderApp();})">حذف</button>
      </td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}
async function toggleTestStatus(id, status) { await Api.patch(`/api/admin/tests/${id}`, { status: status === "active" ? "inactive" : "active" }); renderApp(); toast("وضعیت آزمون به‌روزرسانی شد."); }
async function openTestForm(id) {
  const tests = id ? await Api.get("/api/admin/tests") : [];
  const t = id ? tests.find((x) => x.id === id) : null;
  document.getElementById("testFormWrap").innerHTML = `
  <div class="form-card" style="margin-bottom:20px"><h3>${t ? "ویرایش آزمون" : "افزودن آزمون جدید"}</h3>
    <form id="testForm">
      <div class="grid grid-2">
        <div class="field"><label>عنوان آزمون</label><input name="title" required value="${t?.title||""}"></div>
        <div class="field"><label>دسته‌بندی</label><select name="category">${Object.entries(catLabel).map(([k,v])=>`<option value="${k}" ${t?.category===k?"selected":""}>${v}</option>`).join("")}</select></div>
        <div class="field"><label>سطح</label><select name="level">${Object.entries(levelLabel).map(([k,v])=>`<option value="${k}" ${t?.level===k?"selected":""}>${v}</option>`).join("")}</select></div>
        <div class="field"><label>مدت زمان (دقیقه)</label><input type="number" name="duration" min="1" required value="${t?.duration||10}"></div>
        <div class="field"><label>قیمت (تومان)</label><input type="number" name="price" min="1000" step="1000" required value="${t?.price||50000}"></div>
        <div class="field"><label>تعداد سؤال</label><input type="number" name="questions" min="0" value="${t?.questions||0}"></div>
      </div>
      <div class="field"><label>توضیحات</label><textarea name="desc" rows="2">${t?.desc||""}</textarea></div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary">${t?"ذخیره تغییرات":"افزودن آزمون"}</button>
        <button type="button" class="btn btn-ghost" onclick="document.getElementById('testFormWrap').innerHTML=''">انصراف</button>
      </div>
    </form>
  </div>`;
  document.getElementById("testForm").onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    fd.duration = parseInt(fd.duration); fd.price = parseInt(fd.price); fd.questions = parseInt(fd.questions);
    try {
      if (t) { await Api.patch(`/api/admin/tests/${t.id}`, fd); toast("آزمون به‌روزرسانی شد."); }
      else { await Api.post("/api/admin/tests", fd); toast("آزمون جدید افزوده شد."); }
      renderApp();
    } catch (err) { toast(err.message); }
  };
}

async function adminPaymentsView() {
  const [tx, users, tests] = await Promise.all([Api.get("/api/admin/transactions"), Api.get("/api/admin/users"), Api.get("/api/admin/tests")]);
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const testMap = Object.fromEntries(tests.map((t) => [t.id, t]));
  return `
  <div class="card" style="padding:0;overflow:auto"><table>
    <thead><tr><th>کد تراکنش</th><th>کاربر</th><th>آزمون</th><th>مبلغ</th><th>درگاه</th><th>کد پیگیری</th><th>وضعیت</th><th>تاریخ</th></tr></thead>
    <tbody>${tx.map((t) => `<tr>
      <td class="mono">${t.id}</td><td>${userMap[t.userId]?.name||"-"}</td><td>${testMap[t.testId]?.title||"-"}</td>
      <td class="mono">${fmtPrice(t.amount)}</td><td>زرین‌پال</td><td class="mono" style="font-size:12px">${t.refId||t.ref||"-"}</td>
      <td><span class="status status-${t.status==="paid"?"paid":t.status==="pending"?"pending":"failed"}">${t.status==="paid"?"موفق":t.status==="pending"?"در انتظار":"ناموفق"}</span></td>
      <td class="mono" style="font-size:12px">${t.createdAt}</td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

async function adminSettingsView() {
  const [s, meta] = await Promise.all([Api.get("/api/admin/settings"), Api.get("/api/admin/meta")]);
  return `
  <div class="form-card" style="max-width:640px"><h3>اطلاعات عمومی سایت</h3>
    <form id="settingsForm">
      <div class="grid grid-2">
        <div class="field"><label>نام سایت (فارسی)</label><input name="siteName" value="${s.siteName}"></div>
        <div class="field"><label>نام سایت (انگلیسی)</label><input name="siteNameEn" value="${s.siteNameEn}"></div>
        <div class="field"><label>تلفن پشتیبانی</label><input name="supportPhone" value="${s.supportPhone}"></div>
        <div class="field"><label>ایمیل پشتیبانی</label><input name="supportEmail" value="${s.supportEmail}"></div>
      </div>
      <button class="btn btn-primary" style="margin-top:10px">ذخیره تنظیمات</button>
    </form>
  </div>
  <div class="form-card" style="max-width:640px;margin-top:20px">
    <h3>وضعیت اتصال‌های سرور (فقط نمایشی)</h3>
    <div class="grid grid-2">
      <div class="field"><label>وب‌سرویس پیامک</label><input value="${meta.smsProvider} — ${meta.smsApiKeySet?"کلید تنظیم‌شده ✅":"کلید تنظیم نشده ❌"}" disabled></div>
      <div class="field"><label>درگاه پرداخت زرین‌پال</label><input value="${meta.zarinpalMerchantSet?"مرچنت تنظیم‌شده ✅":"مرچنت تنظیم نشده ❌"} — حالت: ${meta.zarinpalSandbox?"آزمایشی (Sandbox)":"واقعی (Production)"}" disabled></div>
    </div>
    <div class="hint" style="background:var(--paper-100);padding:12px 14px;border-radius:8px;line-height:1.9;margin-top:8px">
      این کلیدها فقط از فایل <b>.env</b> روی سرور خوانده می‌شوند و از طریق این پنل قابل مشاهده یا تغییر نیستند — دقیقاً برای همین امن هستند. برای تغییرشان، فایل .env را روی سرور ویرایش کرده و سرور را ری‌استارت کنید.
    </div>
  </div>`;
}
function bindSettingsForm() {
  const f = document.getElementById("settingsForm");
  if (!f) return;
  f.onsubmit = async (e) => {
    e.preventDefault();
    try { await Api.patch("/api/admin/settings", Object.fromEntries(new FormData(f))); toast("تنظیمات ذخیره شد."); }
    catch (err) { toast(err.message); }
  };
}

function confirmAction(title, text, onConfirm) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmText").textContent = text;
  document.getElementById("confirmModal").classList.add("open");
  document.getElementById("confirmBtn").onclick = () => { onConfirm(); closeModal(); };
}
function closeModal() { document.getElementById("confirmModal").classList.remove("open"); }

/* ==================================================================
   روتر یکپارچه
   ================================================================== */
let __renderGen = 0;

async function renderPublicApp(parts, myGen) {
  const root = "/" + (parts[0] || "");
  const app = document.getElementById("app");
  app.innerHTML = loadingHtml();
  let html;
  try {
    switch (root) {
      case "/": html = await viewHome(); break;
      case "/tests": html = await viewTests(); break;
      case "/test": html = await viewTestDetail(parts[1]); break;
      case "/pay-result": html = await viewPayResult(parts[1], parts[2], parts[3]); break;
      case "/login": html = viewLogin(); break;
      case "/register": html = viewRegister(); break;
      case "/dashboard": html = await viewDashboard(); break;
      case "/exam": html = await viewExam(parts[1]); break;
      case "/result": html = await viewResult(parts[1]); break;
      default: html = errorHtml("صفحه‌ی موردنظر یافت نشد.");
    }
  } catch (e) { html = errorHtml(e.message || "خطایی رخ داد."); }

  if (myGen !== __renderGen) return; // یک ناوبری جدیدتر در همین حین اتفاق افتاده؛ این نتیجه‌ی قدیمی دور ریخته می‌شود
  app.innerHTML = html;
  renderHeader();
  if (root === "/login") bindAuthForm("login");
  if (root === "/register") bindAuthForm("register");
  if (root === "/test") bindTestDetail(parts[1]);
  if (root === "/exam" && currentUser) {
    Api.get(`/api/tests/${parts[1]}`).then((t) => {
      if (myGen !== __renderGen) return;
      if (t.category === "typing") initTypingExam(t.id, t.content, t.duration * 60);
      else if (t.category === "translate") initTranslateExam(t.id, t.duration * 60);
      else initQuizExam(t.id, t.duration * 60);
    }).catch(() => {});
  }
  const nav = document.getElementById("mainNav");
  if (nav) nav.classList.remove("open");
}

async function renderAdminApp(subParts, myGen) {
  const root = "/admin" + (subParts.length ? "/" + subParts.join("/") : "");
  const app = document.getElementById("app");

  if (root === "/admin/login") {
    app.innerHTML = viewAdminLogin();
    bindAdminLoginForm();
    return;
  }
  if (!currentUser || currentUser.role !== "admin") { go("/admin/login"); return; }

  app.innerHTML = loadingHtml();
  let body;
  try {
    switch (root) {
      case "/admin": body = await adminDashboardView(); break;
      case "/admin/users": body = await adminUsersView(); break;
      case "/admin/tests": body = await adminTestsView(); break;
      case "/admin/payments": body = await adminPaymentsView(); break;
      case "/admin/settings": body = await adminSettingsView(); break;
      default: body = `<div class="empty-state">صفحه یافت نشد.</div>`;
    }
  } catch (e) { body = `<div class="empty-state">${e.message}</div>`; }

  if (myGen !== __renderGen) return;
  app.innerHTML = adminShell(root, body);
  bindSettingsForm();
}

async function renderApp() {
  const myGen = ++__renderGen;
  const { parts } = parseHash();
  const isAdmin = parts[0] === "admin";
  const header = document.getElementById("siteHeader"), footer = document.getElementById("siteFooter");
  if (header) header.style.display = isAdmin ? "none" : "";
  if (footer) footer.style.display = isAdmin ? "none" : "";
  await refreshCurrentUser();
  if (myGen !== __renderGen) return;
  if (isAdmin) await renderAdminApp(parts.slice(1), myGen);
  else await renderPublicApp(parts, myGen);
  if (myGen === __renderGen) window.scrollTo(0, 0);
}

window.addEventListener("hashchange", renderApp);
window.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  if (navToggle) navToggle.onclick = () => document.getElementById("mainNav").classList.toggle("open");
  renderApp();
});
