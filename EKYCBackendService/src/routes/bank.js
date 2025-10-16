'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { withAudit } = require('../middleware/audit');
const bankService = require('../services/bank');

// Get current user's bank details
router.get('/bank-details', authenticate, requireRole(['user', 'admin']), withAudit('bank_details', 'READ')(async (req, res) => {
  const result = bankService.getBankDetails(req.user.id);
  res.status(200).json(result.data);
}));

// Create/Update bank details (critical update -> require e-sign placeholder)
router.post('/bank-details', authenticate, requireRole(['user', 'admin']), withAudit('bank_details', 'UPDATE')(async (req, res) => {
  const { accountNumber, confirmAccountNumber, ifsc, fullNameForESign, agreeESign, reason } = req.body || {};
  const result = bankService.saveBankDetails({ userId: req.user.id, accountNumber, confirmAccountNumber, ifsc, fullNameForESign, agreeESign, reason });
  if (!result.ok) {
    const err = new Error(result.code);
    err.code = result.code;
    throw err;
  }
  // Expose for audit after_state
  res.locals.entityId = String(result.id);
  res.locals.afterState = { id: result.id, user_id: req.user.id, ifsc, branch_info: result.branch_info, signed_at: result.signed_at };
  res.status(200).json({ id: result.id, ifsc, branch_info: result.branch_info, signed_at: result.signed_at });
}));

module.exports = router;
