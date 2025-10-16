'use strict';
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
  /** Validate and save bank details with e-sign binding. Requires reasonForChange; wraps in transaction. */
  const vAcct = validateAccountNumber(accountNumber, confirmAccountNumber);
  if (!vAcct.ok) return { ok: false, code: vAcct.code };
  const vIfsc = validateIFSC(ifsc);
  if (!vIfsc.ok) return { ok: false, code: vIfsc.code };

  // reasonForChange mandatory and limited
  const reason = String(reasonForChange || '').trim();
  if (!reason) return { ok: false, code: 'REASON_REQUIRED' };
  if (reason.length > 250) return { ok: false, code: 'REASON_TOO_LONG' };

  // optional re-auth for critical changes
  if (critical) {
    const ok = verifyReauthPassword(userId, reauthPassword || '');
    if (!ok) return { ok: false, code: 'REAUTH_FAILED' };
  }

  const branch_info = deriveBranchInfo(ifsc);

  // Build canonical payload for digest
  const payload = { userId, accountNumber: vAcct.clean, ifsc, reason };
  const { signature_digest, signed_at, nonce, signature_id } = bindElectronicSignature({
    userId, fullName: fullNameForESign, agree: !!agreeESign, entity: 'bank_details', payload
  });

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
  /** Retrieve bank details for a user */
  const row = db.prepare('SELECT * FROM bank_details WHERE user_id = ?').get(userId);
  if (!row) return { ok: true, data: null };
  return { ok: true, data: { id: row.id, account_number: row.account_number, ifsc: row.ifsc, branch_info: row.branch_info, signed_at: row.signed_at } };
}

module.exports = { saveBankDetails, getBankDetails };
