'use strict';
const db = require('../db');
const { validateIFSC, validateAccountNumber } = require('./validation');
const { bindElectronicSignature } = require('../utils/esign');

// Dummy branch info resolver (no external services): derive bank code and last 6 as branch identifier
function deriveBranchInfo(ifsc) {
  const bank = ifsc.substring(0, 4);
  const branch = ifsc.substring(5);
  return `Bank: ${bank}, Branch Code: ${branch}`;
}

// PUBLIC_INTERFACE
function saveBankDetails({ userId, accountNumber, confirmAccountNumber, ifsc, fullNameForESign, agreeESign, reason }) {
  /** Validate account double-entry, IFSC pattern, and save bank details with e-sign digest. Uses transaction and audit via middleware. */
  const vAcct = validateAccountNumber(accountNumber, confirmAccountNumber);
  if (!vAcct.ok) return { ok: false, code: vAcct.code };
  const vIfsc = validateIFSC(ifsc);
  if (!vIfsc.ok) return { ok: false, code: vIfsc.code };

  const branch_info = deriveBranchInfo(ifsc);
  const { signature_digest, signed_at } = bindElectronicSignature({
    userId, fullName: fullNameForESign, agree: !!agreeESign, entity: 'bank_details'
  });
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    const existing = db.prepare('SELECT * FROM bank_details WHERE user_id = ?').get(userId);
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
  });
  const id = tx();
  return { ok: true, id, branch_info, signed_at };
}

// PUBLIC_INTERFACE
function getBankDetails(userId) {
  /** Retrieve bank details for a user */
  const row = db.prepare('SELECT * FROM bank_details WHERE user_id = ?').get(userId);
  if (!row) return { ok: true, data: null };
  return { ok: true, data: { id: row.id, account_number: row.account_number, ifsc: row.ifsc, branch_info: row.branch_info, signed_at: row.signed_at } };
}

module.exports = { saveBankDetails, getBankDetails };
