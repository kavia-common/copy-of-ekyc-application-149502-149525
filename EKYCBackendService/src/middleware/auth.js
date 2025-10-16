'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: middleware/auth.js
 * Covered Requirements:
 * - REQ-SEC-ACL-001: RBAC and Access Controls (auth pre-req)
 * - REQ-SEC-001: Audit Trail support (user attribution via req.user)
 * Validation Protocols: VP-SEC-001
 * GxP Impact: YES — access control to protected endpoints
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] JWT verified   [x] User loaded   [x] Standardized errors
 */
const { verifyJWT } = require('../utils/crypto');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_env';

// PUBLIC_INTERFACE
function authenticate(req, res, next) {
  /**
   * Verify Bearer token and attach user to request.
   * REQ IDs: REQ-SEC-ACL-001, REQ-SEC-001
   * Acceptance Criteria:
   * - AC-01: Missing token yields 401
   * - AC-02: Invalid/expired token yields 401
   * - AC-03: User must exist; otherwise 401
   * GxP Impact: YES — ensures only authorized actors perform operations
   * Risk Level: MEDIUM
   * Validation Protocol: VP-SEC-001
   */
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing token' }); // TRACE: AC-01
  const payload = verifyJWT(token, JWT_SECRET);
  if (!payload) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' }); // TRACE: AC-02
  const user = db.prepare('SELECT id, email, mobile, role FROM users WHERE id = ?').get(payload.sub);
  if (!user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found' }); // TRACE: AC-03
  req.user = user;
  next();
}

module.exports = { authenticate };
