'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: services/validation.js
 * Covered Requirements:
 * - REQ-VAL-001: Input Validation and User Guidance
 * - REQ-BANK-001: Account number confirmation
 * - REQ-BANK-IFSC-001: IFSC regex validation
 * Related Stories: Registration/Login guidance; Bank details validation and confirmation
 * Validation Protocols: VP-VAL-001, VP-BANK-001
 * GxP Impact: YES — data integrity via validation controls
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] Regex documented   [x] Error codes standardized   [x] Behavior mirrored by UI
 */

/**
 * Centralized validation rules to meet acceptance criteria:
 * - Email: max 50, standard pattern
 * - Mobile: exactly 10 digits
 * - Password: min 8, at least 1 upper, 1 lower, 1 digit, 1 special
 * - IFSC: /^[A-Z]{4}0[0-9A-Z]{6}$/
 * - Bank account: digits (8-20 typical), allow spaces stripped
 */

const EMAIL_MAX = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // TRACE: AC-VAL email format
const MOBILE_REGEX = /^\d{10}$/; // TRACE: AC-VAL mobile digits=10
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/; // TRACE: REQ-BANK-IFSC-001 regex
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/; // TRACE: password strength
const ACCT_ALLOWED = /^[0-9]{8,20}$/; // TRACE: account length 8-20 digits

// PUBLIC_INTERFACE
function validateEmail(email) {
  /** Validate email length and format — REQ-VAL-001, VP-VAL-001 */
  if (!email || typeof email !== 'string') return { ok: false, code: 'EMAIL_REQUIRED' };
  if (email.length > EMAIL_MAX) return { ok: false, code: 'EMAIL_TOO_LONG' };
  if (!EMAIL_REGEX.test(email)) return { ok: false, code: 'EMAIL_INVALID' };
  return { ok: true };
}

// PUBLIC_INTERFACE
function validateMobile(mobile) {
  /** Validate mobile as 10 digits — REQ-VAL-001 */
  if (!mobile || typeof mobile !== 'string') return { ok: false, code: 'MOBILE_REQUIRED' };
  if (!MOBILE_REGEX.test(mobile)) return { ok: false, code: 'MOBILE_INVALID' };
  return { ok: true };
}

// PUBLIC_INTERFACE
function validatePassword(pw) {
  /** Validate strong password policy — REQ-AUTH-001 */
  if (!pw || typeof pw !== 'string') return { ok: false, code: 'PASSWORD_REQUIRED' };
  if (!PASSWORD_POLICY.test(pw)) return { ok: false, code: 'PASSWORD_WEAK' };
  return { ok: true };
}

// PUBLIC_INTERFACE
function validateIFSC(ifsc) {
  /** Validate IFSC code with pattern — REQ-BANK-IFSC-001 */
  if (!ifsc || typeof ifsc !== 'string') return { ok: false, code: 'IFSC_REQUIRED' };
  if (!IFSC_REGEX.test(ifsc)) return { ok: false, code: 'IFSC_INVALID' }; // TRACE: AC-IFSC regex
  return { ok: true };
}

// PUBLIC_INTERFACE
function validateAccountNumber(acct, confirm) {
  /** Validate bank account number digits and matching confirm — REQ-BANK-001 */
  if (!acct || typeof acct !== 'string') return { ok: false, code: 'ACCOUNT_REQUIRED' };
  // Normalize: trim and remove all internal spaces for both fields before validation/compare
  const clean = String(acct).trim().replace(/\s+/g, '');
  if (!ACCT_ALLOWED.test(clean)) return { ok: false, code: 'ACCOUNT_INVALID' }; // TRACE: length 8-20 digits
  if (confirm !== undefined) {
    const clean2 = String(confirm).trim().replace(/\s+/g, '');
    if (!ACCT_ALLOWED.test(clean2)) return { ok: false, code: 'ACCOUNT_INVALID' };
    if (clean !== clean2) return { ok: false, code: 'ACCOUNT_MISMATCH' }; // TRACE: double-entry match
  }
  return { ok: true, clean };
}

module.exports = {
  validateEmail,
  validateMobile,
  validatePassword,
  validateIFSC,
  validateAccountNumber,
  constants: { EMAIL_MAX }
};
