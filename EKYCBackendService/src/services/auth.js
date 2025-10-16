'use strict';
const db = require('../db');
const { hashPassword, verifyPassword, createJWT } = require('../utils/crypto');
const { validateEmail, validateMobile, validatePassword } = require('./validation');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_env';

// PUBLIC_INTERFACE
function register({ email, mobile, password }) {
  /** Register a new user after validation and uniqueness checks. */
  const now = new Date().toISOString();
  // Validation
  const vEmail = validateEmail(email);
  if (!vEmail.ok) return { ok: false, code: vEmail.code };
  const vMobile = validateMobile(mobile);
  if (!vMobile.ok) return { ok: false, code: vMobile.code };
  const vPw = validatePassword(password);
  if (!vPw.ok) return { ok: false, code: vPw.code };

  // Uniqueness
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR mobile = ?').get(email, mobile);
  if (existing) return { ok: false, code: 'DUPLICATE_ACCOUNT' };

  const password_hash = hashPassword(password);
  const stmt = db.prepare('INSERT INTO users (email, mobile, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(email, mobile, password_hash, 'user', now, now);
  return { ok: true, userId: info.lastInsertRowid };
}

// PUBLIC_INTERFACE
function login({ identifier, password }) {
  /** Login by email or mobile + password; returns token and user. */
  if (!identifier || !password) return { ok: false, code: 'CREDENTIALS_REQUIRED' };
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(identifier);
  if (!user) user = db.prepare('SELECT * FROM users WHERE mobile = ?').get(identifier);
  if (!user) return { ok: false, code: 'INVALID_CREDENTIALS' };
  if (!verifyPassword(password, user.password_hash)) return { ok: false, code: 'INVALID_CREDENTIALS' };
  const token = createJWT({ sub: user.id, role: user.role }, JWT_SECRET, 3600);
  return { ok: true, token, user: { id: user.id, email: user.email, mobile: user.mobile, role: user.role } };
}

module.exports = { register, login };
