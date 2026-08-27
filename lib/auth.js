// lib/auth.js — احراز هویت با JWT در کوکی httpOnly (امن‌تر از localStorage)

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "azmaya_session";

function issueSession(res, user) {
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearSession(res) {
  res.clearCookie(COOKIE_NAME);
}

function readSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET); // { id, role }
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: "ابتدا وارد حساب کاربری خود شوید." });
  req.session = session;
  next();
}

function requireAdmin(req, res, next) {
  const session = readSession(req);
  if (!session || session.role !== "admin") return res.status(403).json({ error: "دسترسی مدیریتی لازم است." });
  req.session = session;
  next();
}

module.exports = {
  issueSession,
  clearSession,
  readSession,
  requireAuth,
  requireAdmin,
  hashPassword: (pw) => bcrypt.hashSync(pw, 10),
  checkPassword: (pw, hash) => bcrypt.compareSync(pw, hash),
};
