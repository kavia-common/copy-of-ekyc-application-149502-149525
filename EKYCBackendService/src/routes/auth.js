'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: routes/auth.js
 * Covered Requirements:
 * - REQ-VAL-001: Input Validation and User Guidance (Registration/Login)
 * - REQ-AUTH-001: Password Creation and Secure Login
 * - REQ-SEC-001: Audit Trail Implementation (ALCOA+)
 * - REQ-SEC-ACL-001: RBAC and Access Controls (via middleware chain where applicable)
 * Related Stories:
 * - "As a user, I want to receive clear validation messages and guidance during registration and login..."
 * - "As a user, I want to create a strong password during registration so that my account is secure."
 * - "As a registered user, I want to securely log in..."
 * Validation Protocols: VP-VAL-001, VP-SEC-001 (audit visibility)
 * GxP Impact: YES — Authentication and validation controls affect data integrity and access
 * Risk Level: MEDIUM
 * Code Structure Template Notes:
 * - Endpoints wrap with withAudit(...) to ensure ALCOA+ audit creation
 * - Validation errors are surfaced via services returning codes consumed by error handler
 * RELEASE GATE CHECKLIST:
 * [x] Requirements mapped    [x] Audit covered    [x] RBAC considered (N/A here)    [x] Tests referenced
 */
const express = require('express');
const router = express.Router();
const authService = require('../services/auth');
const db = require('../db');
const { withAudit } = require('../middleware/audit');

/**
 * Endpoint: POST /api/auth/register
 * REQ IDs: REQ-VAL-001, REQ-AUTH-001, REQ-SEC-001
 * User Story: As a user, I want clear validation and guidance; create strong password
 * Acceptance Criteria:
 * - AC-01: Email <=50 chars, valid format
 * - AC-02: Mobile 10 digits
 * - AC-03: Strong password policy
 * - AC-04: Duplicate account check returns 409
 * GxP Impact: YES — user identity/account creation, audit evidence
 * Risk Level: MEDIUM
 * Validation Protocol: VP-VAL-001
 * Audit: action=CREATE users; logs outcome, error_code/message; unauth_actor when applicable
 */
router.post('/register', withAudit('users', 'CREATE')(async (req, res) => {
  const { email, mobile, password } = req.body || {};
  const now = new Date().toISOString();

  // TRACE: AC-01/AC-02/AC-03 — validation occurs in service; errors mapped to user-friendly codes
  const result = authService.register({ email, mobile, password });
  if (!result.ok) {
    // TRACE: AC-04 — duplicate and other validation failures recorded as FAILED attempt
    db.prepare('INSERT INTO registration_attempts (email, mobile, outcome, error_code, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(email || null, mobile || null, 'FAILURE', result.code, null, now);
    const err = new Error(result.code);
    err.code = result.code;
    throw err;
  }
  // TRACE: AC-OK — successful registration attempt captured
  db.prepare('INSERT INTO registration_attempts (email, mobile, outcome, error_code, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(email, mobile, 'SUCCESS', null, null, now);

  // TRACE: Audit after_state for CREATE users entity
  res.locals.entityId = String(result.userId);
  res.locals.afterState = { id: result.userId, email, mobile };
  res.status(201).json({ id: result.userId, email, mobile });
}));

/**
 * Endpoint: POST /api/auth/login
 * REQ IDs: REQ-VAL-001, REQ-AUTH-001, REQ-SEC-001
 * User Story: As a registered user, I want to securely log in
 * Acceptance Criteria:
 * - AC-01: Accepts identifier (email/mobile) and password
 * - AC-02: Invalid credentials return 401
 * - AC-03: On success returns token and user info
 * GxP Impact: YES — controls access to regulated functions and data
 * Risk Level: MEDIUM
 * Validation Protocol: VP-VAL-001
 * Audit: action=READ users; outcome and any error captured
 */
router.post('/login', withAudit('users', 'READ')(async (req, res) => {
  const { identifier, password } = req.body || {};
  // TRACE: AC-01 — credentials presence validated in service
  const result = authService.login({ identifier, password });
  if (!result.ok) {
    // TRACE: AC-02 — invalid credentials surfaced with standard code
    const err = new Error(result.code);
    err.code = result.code;
    throw err;
  }
  // TRACE: AC-03 — returns token + user payload (role for RBAC elsewhere)
  res.status(200).json({ token: result.token, user: result.user });
}));

module.exports = router;
