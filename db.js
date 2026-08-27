// db.js — لایه‌ی داده‌ی ساده مبتنی بر فایل JSON روی دیسک سرور.
// برای شروع سریع و انتشار آسان روی هر هاست ایرانی (بدون نیاز به
// نصب دیتابیس جداگانه یا ماژول‌های native) طراحی شده. اگر بعداً
// حجم کاربران بالا رفت، به‌سادگی می‌توان همین لایه را با
// PostgreSQL/MySQL جایگزین کرد چون همه‌ی توابع از یک نقطه (این فایل)
// صدا زده می‌شوند.

const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "data", "db.json");

function loadSeedIfMissing() {
  if (!fs.existsSync(DB_FILE)) {
    const seed = require("./data/seed.json");
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}
loadSeedIfMissing();

function read() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function write(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

const Db = {
  all: () => read(),
  settings: () => read().settings,
  saveSettings(patch) {
    const db = read();
    db.settings = { ...db.settings, ...patch };
    write(db);
    return db.settings;
  },

  users: () => read().users,
  userById: (id) => read().users.find((u) => u.id === id),
  userByPhone: (phone) => read().users.find((u) => u.phone === phone),
  userByEmail: (email) => read().users.find((u) => u.email === email),
  addUser(u) {
    const db = read();
    db.users.push(u);
    write(db);
    return u;
  },
  updateUser(id, patch) {
    const db = read();
    const i = db.users.findIndex((u) => u.id === id);
    if (i === -1) return null;
    db.users[i] = { ...db.users[i], ...patch };
    write(db);
    return db.users[i];
  },
  deleteUser(id) {
    const db = read();
    db.users = db.users.filter((u) => u.id !== id);
    write(db);
  },

  tests: () => read().tests,
  testById: (id) => read().tests.find((t) => t.id === id),
  addTest(t) {
    const db = read();
    db.tests.push(t);
    write(db);
    return t;
  },
  updateTest(id, patch) {
    const db = read();
    const i = db.tests.findIndex((t) => t.id === id);
    if (i === -1) return null;
    db.tests[i] = { ...db.tests[i], ...patch };
    write(db);
    return db.tests[i];
  },
  deleteTest(id) {
    const db = read();
    db.tests = db.tests.filter((t) => t.id !== id);
    write(db);
  },

  transactions: () => read().transactions,
  transactionById: (id) => read().transactions.find((t) => t.id === id),
  addTransaction(tx) {
    const db = read();
    db.transactions.unshift(tx);
    write(db);
    return tx;
  },
  updateTransaction(id, patch) {
    const db = read();
    const i = db.transactions.findIndex((t) => t.id === id);
    if (i === -1) return null;
    db.transactions[i] = { ...db.transactions[i], ...patch };
    write(db);
    return db.transactions[i];
  },
  userHasPaid(userId, testId) {
    return read().transactions.some(
      (t) => t.userId === userId && t.testId === testId && t.status === "paid"
    );
  },

  results: () => read().results,
  addResult(r) {
    const db = read();
    db.results.unshift(r);
    write(db);
    return r;
  },

  // کدهای تأیید پیامکی به‌صورت جدا و کوتاه‌عمر نگه‌داری می‌شوند
  otps: () => read().otps || {},
  saveOtp(phone, entry) {
    const db = read();
    db.otps = db.otps || {};
    db.otps[phone] = entry;
    write(db);
  },
  consumeOtp(phone) {
    const db = read();
    db.otps = db.otps || {};
    const entry = db.otps[phone];
    delete db.otps[phone];
    write(db);
    return entry;
  },
};

module.exports = Db;
