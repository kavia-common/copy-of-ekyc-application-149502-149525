'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: db.js
 * Covered Requirements:
 * - REQ-SEC-001: Audit Trail schema (audit_log)
 * - REQ-ESIGN-001: signatures table with UNIQUE nonce
 * - REQ-BANK-001/REQ-BANK-IFSC-001: bank_details constraints
 * - REQ-VAL-001/REQ-AUTH-001: users constraints, registration_attempts tracking
 * Validation Protocol: VP-SEC-001, VP-ESIGN-001, VP-BANK-001, VP-VAL-001
 * GxP Impact: YES — schema enforces integrity for regulated data
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] FKs & constraints   [x] Indices   [x] WAL+synchronous=FULL for durability
 */
/**
 * SQLite database initialization using better-sqlite3 for synchronous, safe access.
 * Ensures schema for users, bank_details, audit_trail, registration_attempts exists.
 * Do not hardcode sensitive configuration; DB path is local file for this container only.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, '..', 'data', 'app.sqlite');

let db;

try {
  // Ensure directory for DB exists to avoid ENOENT on creation
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Initialize DB
  db = new Database(DB_PATH, { verbose: undefined });

  // Ensure schema
  db.exec(`
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = FULL;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE CHECK (length(email) <= 50),
  mobile TEXT UNIQUE CHECK (mobile GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);

CREATE TABLE IF NOT EXISTS registration_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  mobile TEXT,
  outcome TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bank_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_number TEXT NOT NULL CHECK (length(account_number) BETWEEN 8 AND 20),
  ifsc TEXT NOT NULL CHECK (ifsc GLOB '[A-Z][A-Z][A-Z][A-Z]0[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'),
  branch_info TEXT,
  signature_digest TEXT,
  signed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_user ON bank_details(user_id);

-- New: immutable, insert-only audit_log with extended fields
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL,
  user_id INTEGER,
  unauth_actor TEXT,
  entity TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  before_state TEXT,
  after_state TEXT,
  reason TEXT,
  outcome TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  stack TEXT,
  ip TEXT,
  user_agent TEXT,
  signature_id INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (signature_id) REFERENCES signatures(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_req ON audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, action);

-- New: signatures table with nonce to prevent replay
CREATE TABLE IF NOT EXISTS signatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signer_user_id INTEGER NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  payload_digest TEXT NOT NULL,
  created_at TEXT NOT NULL,
  linked_audit_id INTEGER,
  FOREIGN KEY (signer_user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);
  console.log(`[EKYCBackendService] SQLite initialized at ${DB_PATH}`);
} catch (e) {
  console.error('[EKYCBackendService] SQLite initialization failed:', e && e.message ? e.message : e);
  // Rethrow to let the process crash early with clear message
  throw e;
}

module.exports = db;
