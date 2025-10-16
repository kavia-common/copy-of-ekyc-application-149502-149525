'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole, requirePermission, PERMISSIONS } = require('../middleware/rbac');
const { withAudit } = require('../middleware/audit');
const bankService = require('../services/bank');
const db = require('../db');

// Get current user's bank details
router.get('/bank-details',
  authenticate,
  requireRole(['user', 'admin']),
  withAudit('bank_details', 'READ')(async (req, res) => {
    const result = bankService.getBankDetails(req.user.id);
    res.status(200).json(result.data);
  })
);

// Create/Update bank details with reasonForChange and optional critical re-auth
router.post('/bank-details',
  authenticate,
  requireRole(['user', 'admin']),
  requirePermission(PERMISSIONS.AUTH_SELF_UPDATE_BANK),
  withAudit('bank_details', 'UPDATE')(async (req, res) => {
    const { accountNumber, confirmAccountNumber, ifsc, fullNameForESign, agreeESign, reasonForChange, critical, reauthPassword } = req.body || {};

    // Prepare before_state snapshot function for audit
    req.getBeforeState = () => {
      const existing = db.prepare('SELECT id, user_id, account_number, ifsc, branch_info, signed_at FROM bank_details WHERE user_id = ?').get(req.user.id);
      return existing || null;
    };

    const result = bankService.saveBankDetails({
      userId: req.user.id,
      accountNumber,
      confirmAccountNumber,
      ifsc,
      fullNameForESign,
      agreeESign,
      reasonForChange,
      critical: !!critical,
      reauthPassword
    });

    if (!result.ok) {
      const err = new Error(result.code);
      err.code = result.code;
      throw err;
    }

    // Link signature to audit via locals; after middleware write we'll backfill linkage
    res.locals.entityId = String(result.id);
    res.locals.afterState = { id: result.id, user_id: req.user.id, ifsc, branch_info: result.branch_info, signed_at: result.signed_at };
    res.locals.signatureId = result.signature_id;

    res.status(200).json({ id: result.id, ifsc, branch_info: result.branch_info, signed_at: result.signed_at, nonce: result.nonce });
  })
);

module.exports = router;
