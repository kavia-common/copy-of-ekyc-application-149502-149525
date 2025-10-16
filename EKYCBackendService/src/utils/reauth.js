'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: utils/reauth.js
 * Covered Requirements:
 * - REQ-ESIGN-001 (critical change flow requires reauth)
 * - REQ-SEC-001: Security control for high-risk operations
 * Validation Protocol: VP-ESIGN-001, VP-SEC-001
 * GxP Impact: YES — prevents unauthorized critical updates
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] Password verified against stored hash   [x] Returns boolean, no leakage
 */
const { verifyPassword } = require('./crypto');
const db = require('../db');

/**
 * Simple re-auth check by verifying password for current user.
 * PUBLIC_INTERFACE
 */
function verifyReauthPassword(userId, password) {
  /**
   * Verify user password again for critical operations, returns boolean.
   * REQ IDs: REQ-ESIGN-001 (critical changes), REQ-SEC-001
   * Acceptance Criteria:
   * - AC-01: Returns false if user missing or password invalid
   * - AC-02: Uses timing-safe comparison via verifyPassword
   */
  const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(userId);
  if (!user) return false; // TRACE: AC-01
  return verifyPassword(password, user.password_hash); // TRACE: AC-02
}

module.exports = { verifyReauthPassword };
