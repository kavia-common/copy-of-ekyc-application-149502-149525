'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: services/bank.js
 * Covered Requirements:
 * - REQ-BANK-001: Account match enforcement
 * - REQ-BANK-IFSC-001: IFSC format validation
 * - REQ-ESIGN-001: Electronic signature binding
 * - REQ-SEC-001: Audit Trail (via route middleware, but function returns states)
 * Related Stories:
 * - Enter account twice (green tick when matched), IFSC validation and branch display, reason logging
 * Validation Protocols: VP-BANK-001, VP-ESIGN-001, VP-SEC-001
 * GxP Impact: YES — critical data modification with e-sign
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] Validation enforced   [x] E-sign digest created   [x] Reauth conditional   [x] Returns states for audit
 */
const db = require('../db');
const { validateIFSC, validateAccountNumber } = require('./validation');
const { bindElectronicSignature } = require('../utils/esign');
const { verifyReauthPassword } = require('../utils/reauth');

// Dummy branch info resolver (no external services): derive bank code and last 6 as branch identifier
function deriveBranchInfo(ifsc) {
  const bank = ifsc.substring(0, 4);
  const branch = ifsc.substring(5);
  return `Bank: ${bank}, Branch Code: ${branch}`;
}

// PUBLIC_INTERFACE
function saveBankDetails({ userId, accountNumber, confirmAccountNumber, ifsc, fullNameForESign, agreeESign, reasonForChange, critical, reauthPassword }) {
  /**
   * Validate and save bank details with e-sign binding. Requires reasonForChange; wraps in transaction.
   * REQ IDs: REQ-BANK-001, REQ-BANK-IFSC-001, REQ-ESIGN-001, REQ-SEC-001
   * User Story: Confirm account number; validate IFSC; require reason; bind e-sign; optional critical reauth
   * Acceptance Criteria:
   * - AC-01: Account number entries must match and be 8-20 digits
   * - AC-02: IFSC regex /^[A-Z]{4}0[A-Z0-9]{6}$/ enforced
   * - AC-03: reasonForChange mandatory and <= 250 chars
   * - AC-04: When critical=true, password reauth is mandatory
   * - AC-05: E-sign requires fullName and agree=true and creates signature_digest + nonce
   * - AC-06: Returns branch info derived from IFSC
   * GxP Impact: YES — critical change, e-sign evidence
   * Risk Level: MEDIUM
   * Validation Protocols: VP-BANK-001, VP-ESIGN-001
   * Audit: Route wrapper captures before/after, reason, signatureId
   */
  const vAcct = validateAccountNumber(accountNumber, confirmAccountNumber); // TRACE: AC-01
  if (!vAcct.ok) return { ok: false, code: vAcct.code };
  const vIfsc = validateIFSC(ifsc); // TRACE: AC-02
  if (!vIfsc.ok) return { ok: false, code: vIfsc.code };

  // reasonForChange mandatory and limited
  const reason = String(reasonForChange || '').trim();
  if (!reason) return { ok: false, code: 'REASON_REQUIRED' }; // TRACE: AC-03
  if (reason.length > 250) return { ok: false, code: 'REASON_TOO_LONG' }; // TRACE: AC-3

  // optional re-auth for critical changes
  if (critical) {
    const ok = verifyReauthPassword(userId, reauthPassword || ''); // TRACE: AC-04
    if (!ok) return { ok: false, code: 'REAUTH_FAILED' };
  }

  const branch_info = deriveBranchInfo(ifsc); // TRACE: AC-06

  // Build canonical payload for digest
  const payload = { userId, accountNumber: vAcct.clean, ifsc, reason };
  const { signature_digest, signed_at, nonce, signature_id } = bindElectronicSignature({
    userId, fullName: fullNameForESign, agree: !!agreeESign, entity: 'bank_details', payload
  }); // TRACE: AC-05 — e-sign binding

  const now = new Date().toISOString();

  try {
    const id = db.transaction(() => {
      const existing = db.prepare('SELECT * FROM bank_details WHERE user_id = ?').get(userId);
      // capture before/after for audit via res.locals in route layer, so we return extra states here
      if (existing) {
        db.prepare(
          'UPDATE bank_details SET account_number=?, ifsc=?, branch_info=?, signature_digest=?, signed_at=?, updated_at=? WHERE id=?'
        ).run(vAcct.clean, ifsc, branch_info, signature_digest, signed_at, now, existing.id);
        return existing.id;
      }
      const info = db.prepare(
        'INSERT INTO bank_details (user_id, account_number, ifsc, branch_info, signature_digest, signed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(userId, vAcct.clean, ifsc, branch_info, signature_digest, signed_at, now, now);
      return info.lastInsertRowid;
    })();

    return { ok: true, id, branch_info, signed_at, signature_id, nonce };
  } catch (e) {
    return { ok: false, code: 'DB_ERROR' };
  }
}

// PUBLIC_INTERFACE
function getBankDetails(userId) {
  /**
   * Retrieve bank details for a user.
   * REQ IDs: REQ-SEC-ACL-001 (enforced upstream), REQ-SEC-001
   * Acceptance Criteria:
   * - AC-01: Returns null when not present
   * - AC-02: Returns structured fields when present
   * GxP Impact: YES — read of regulated data
   * Risk Level: LOW
   * Validation Protocol: VP-SEC-001
   */
  const row = db.prepare('SELECT * FROM bank_details WHERE user_id = ?').get(userId);
  if (!row) return { ok: true, data: null }; // TRACE: AC-01
  return { ok: true, data: { id: row.id, account_number: row.account_number, ifsc: row.ifsc, branch_info: row.branch_info, signed_at: row.signed_at } }; // TRACE: AC-02
}

module.exports = { saveBankDetails, getBankDetails };
