'use strict';

/**
 * Centralized validation rules to meet acceptance criteria:
 * - Email: max 50, standard pattern
 * - Mobile: exactly 10 digits
 * - Password: min 8, at least 1 upper, 1 lower, 1 digit, 1 special
 * - IFSC: /^[A-Z]{4}0[0-9A-Z]{6}$/
 * - Bank account: digits (8-20 typical), allow spaces stripped
 */

const EMAIL_MAX = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
const ACCT_ALLOWED = /^[0-9]{8,20}$/;

// PUBLIC_INTERFACE
function validateEmail(email) {
  /** Validate email length and format */
  if (!email || typeof email !== 'string') return { ok: false, code: 'EMAIL_REQUIRED' };
  if (email.length > EMAIL_MAX) return { ok: false, code: 'EMAIL_TOO_LONG' };
  if (!EMAIL_REGEX.test(email)) return { ok: false, code: 'EMAIL_INVALID' };
  return { ok: true };
}

// PUBLIC_INTERFACE
function validateMobile(mobile) {
  /** Validate mobile as 10 digits */
  if (!mobile || typeof mobile !== 'string') return { ok: false, code: 'MOBILE_REQUIRED' };
  if (!MOBILE_REGEX.test(mobile)) return { ok: false, code: 'MOBILE_INVALID' };
  return { ok: true };
}

// PUBLIC_INTERFACE
function validatePassword(pw) {
  /** Validate strong password policy */
  if (!pw || typeof pw !== 'string') return { ok: false, code: 'PASSWORD_REQUIRED' };
  if (!PASSWORD_POLICY.test(pw)) return { ok: false, code: 'PASSWORD_WEAK' };
  return { ok: true };
}

// PUBLIC_INTERFACE
function validateIFSC(ifsc) {
  /** Validate IFSC code with pattern */
  if (!ifsc || typeof ifsc !== 'string') return { ok: false, code: 'IFSC_REQUIRED' };
  if (!IFSC_REGEX.test(ifsc)) return { ok: false, code: 'IFSC_INVALID' };
  return { ok: true };
}

// PUBLIC_INTERFACE
function validateAccountNumber(acct, confirm) {
  /** Validate bank account number digits and matching confirm */
  if (!acct || typeof acct !== 'string') return { ok: false, code: 'ACCOUNT_REQUIRED' };
  const clean = acct.replace(/\s+/g, '');
  if (!ACCT_ALLOWED.test(clean)) return { ok: false, code: 'ACCOUNT_INVALID' };
  if (confirm !== undefined) {
    const clean2 = String(confirm).replace(/\s+/g, '');
    if (clean !== clean2) return { ok: false, code: 'ACCOUNT_MISMATCH' };
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
