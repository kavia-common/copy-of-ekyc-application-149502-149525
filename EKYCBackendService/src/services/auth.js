'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: services/auth.js
 * Covered Requirements:
 * - REQ-VAL-001: Input Validation and User Guidance
 * - REQ-AUTH-001: Password Creation and Secure Login
 * - REQ-SEC-001: Audit Trail (via route-level wrapper)
 * Related Stories:
 * - Register with strong password and guidance; Secure login
 * Validation Protocols: VP-VAL-001, VP-SEC-001
 * GxP Impact: YES — authentication, identity creation
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] Validation rules aligned   [x] Errors return standardized codes   [x] No PII leakage in messages
 */
const db = require('../db');
const { hashPassword, verifyPassword, createJWT } = require('../utils/crypto');
const { validateEmail, validateMobile, validatePassword } = require('./validation');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_env';

// PUBLIC_INTERFACE
function register({ email, mobile, password }) {
  /**
   * Register a new user after validation and uniqueness checks.
   * REQ IDs: REQ-VAL-001, REQ-AUTH-001
   * User Story: Clear validation + strong password during registration
   * Acceptance Criteria:
   * - AC-01: Email <=50, valid format
   * - AC-02: Mobile 10 digits
   * - AC-03: Strong password policy
   * - AC-04: Duplicate account returns standardized code
   * GxP Impact: YES — user identity creation
   * Risk Level: MEDIUM
   * Validation Protocol: VP-VAL-001
   */
  const now = new Date().toISOString();
  // TRACE: AC-01 — email validation
  const vEmail = validateEmail(email);
  if (!vEmail.ok) return { ok: false, code: vEmail.code };
  // TRACE: AC-02 — mobile validation
  const vMobile = validateMobile(mobile);
  if (!vMobile.ok) return { ok: false, code: vMobile.code };
  // TRACE: AC-03 — password strength validation
  const vPw = validatePassword(password);
  if (!vPw.ok) return { ok: false, code: vPw.code };

  // TRACE: AC-04 — uniqueness enforcement
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR mobile = ?').get(email, mobile);
  if (existing) return { ok: false, code: 'DUPLICATE_ACCOUNT' };

  const password_hash = hashPassword(password);
  const stmt = db.prepare('INSERT INTO users (email, mobile, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
  const info = stmt.run(email, mobile, password_hash, 'user', now, now);
  return { ok: true, userId: info.lastInsertRowid };
}

// PUBLIC_INTERFACE
function login({ identifier, password }) {
  /**
   * Login by email or mobile + password; returns token and user.
   * REQ IDs: REQ-AUTH-001, REQ-VAL-001
   * User Story: Secure login using email/mobile and password
   * Acceptance Criteria:
   * - AC-01: Requires identifier and password
   * - AC-02: Invalid credentials return standardized error
   * - AC-03: Returns JWT token and user info on success
   * GxP Impact: YES — access control to regulated operations
   * Risk Level: MEDIUM
   * Validation Protocol: VP-VAL-001
   */
  if (!identifier || !password) return { ok: false, code: 'CREDENTIALS_REQUIRED' }; // TRACE: AC-01
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(identifier);
  if (!user) user = db.prepare('SELECT * FROM users WHERE mobile = ?').get(identifier);
  if (!user) return { ok: false, code: 'INVALID_CREDENTIALS' }; // TRACE: AC-02
  if (!verifyPassword(password, user.password_hash)) return { ok: false, code: 'INVALID_CREDENTIALS' }; // TRACE: AC-02
  const token = createJWT({ sub: user.id, role: user.role }, JWT_SECRET, 3600);
  // TRACE: AC-03
  return { ok: true, token, user: { id: user.id, email: user.email, mobile: user.mobile, role: user.role } };
}

module.exports = { register, login };
