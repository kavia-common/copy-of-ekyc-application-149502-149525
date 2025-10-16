'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: routes/bank.js
 * Covered Requirements:
 * - REQ-BANK-001: Bank Account Number Confirmation (double entry match)
 * - REQ-BANK-IFSC-001: IFSC Format Validation and User Confirmation
 * - REQ-ESIGN-001: Electronic Signature Binding for Critical Operations
 * - REQ-SEC-001: Audit Trail Implementation (ALCOA+)
 * - REQ-SEC-ACL-001: RBAC and Access Controls
 * Related Stories:
 * - "As a user, I want to enter my bank account number twice and see a green tick when they match."
 * - "As a user, I want to input my IFSC and see derived branch info."
 * Validation Protocols: VP-BANK-001, VP-ESIGN-001, VP-SEC-001
 * GxP Impact: YES — critical data changes, requires attributable audit and e-sign
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] Requirements mapped    [x] RBAC enforced    [x] Audit enforced    [x] E-sign binding    [x] Tests referenced
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole, requirePermission, PERMISSIONS } = require('../middleware/rbac');
const { withAudit } = require('../middleware/audit');
const bankService = require('../services/bank');
const db = require('../db');

/**
 * Endpoint: GET /api/bank-details
 * REQ IDs: REQ-SEC-ACL-001, REQ-SEC-001
 * User Story: Authenticated user views own bank details
 * Acceptance Criteria:
 * - AC-01: Requires authentication and role (user/admin)
 * - AC-02: Audit trail created for read
 * GxP Impact: YES — access to regulated financial data
 * Risk Level: MEDIUM
 * Validation Protocol: VP-SEC-001
 * Audit: action=READ bank_details; outcome recorded
 */
router.get('/bank-details',
  authenticate, // TRACE: AC-01 — JWT auth
  requireRole(['user', 'admin']), // TRACE: AC-01 — role check
  withAudit('bank_details', 'READ')(async (req, res) => {
    const result = bankService.getBankDetails(req.user.id);
    res.status(200).json(result.data);
  })
);

/**
 * Endpoint: POST /api/bank-details
 * REQ IDs: REQ-BANK-001, REQ-BANK-IFSC-001, REQ-ESIGN-001, REQ-SEC-001, REQ-SEC-ACL-001
 * User Story: Update bank details with confirmation, IFSC validation, reason, e-sign, optional critical reauth
 * Acceptance Criteria:
 * - AC-01: Account number double-entry must match
 * - AC-02: IFSC must match /^[A-Z]{4}0[A-Z0-9]{6}$/
 * - AC-03: reasonForChange required (<=250 chars)
 * - AC-04: When critical=true, password re-auth is required
 * - AC-05: E-sign acknowledgement (fullName + agree) binds signature_digest/nonce
 * - AC-06: RBAC permission 'auth.self.update.bank' enforced
 * - AC-07: Audit captures before/after, reason, signatureId
 * GxP Impact: YES — critical change with e-sign and audit
 * Risk Level: MEDIUM
 * Validation Protocols: VP-BANK-001, VP-ESIGN-001, VP-SEC-001
 * Audit: action=UPDATE bank_details; captures before_state, after_state, reason, signature_id
 */
router.post('/bank-details',
  authenticate, // TRACE: AC-06 — authenticated
  requireRole(['user', 'admin']), // TRACE: AC-06 — role
  requirePermission(PERMISSIONS.AUTH_SELF_UPDATE_BANK), // TRACE: AC-06 — permission
  withAudit('bank_details', 'UPDATE')(async (req, res) => {
    const { accountNumber, confirmAccountNumber, ifsc, fullNameForESign, agreeESign, reasonForChange, critical, reauthPassword } = req.body || {};

    // TRACE: AC-07 — capture before_state for audit
    req.getBeforeState = () => {
      const existing = db.prepare('SELECT id, user_id, account_number, ifsc, branch_info, signed_at FROM bank_details WHERE user_id = ?').get(req.user.id);
      return existing || null;
    };

    // TRACE: AC-01/AC-02/AC-03/AC-04/AC-05 — enforced in bankService.saveBankDetails
    const result = bankService.saveBankDetails({
      userId: req.user.id,
      accountNumber,
      confirmAccountNumber, // TRACE: AC-01 — must match
      ifsc, // TRACE: AC-02 — IFSC regex validation
      fullNameForESign, // TRACE: AC-05 — e-sign full name
      agreeESign, // TRACE: AC-05 — consent flag
      reasonForChange, // TRACE: AC-03 — reason required
      critical: !!critical, // TRACE: AC-04 — triggers reauth
      reauthPassword
    });

    if (!result.ok) {
      const err = new Error(result.code);
      err.code = result.code;
      throw err;
    }

    // TRACE: AC-07 — link entity and signature for audit after_state
    res.locals.entityId = String(result.id);
    res.locals.afterState = { id: result.id, user_id: req.user.id, ifsc, branch_info: result.branch_info, signed_at: result.signed_at };
    res.locals.signatureId = result.signature_id;

    res.status(200).json({ id: result.id, ifsc, branch_info: result.branch_info, signed_at: result.signed_at, nonce: result.nonce });
  })
);

module.exports = router;
