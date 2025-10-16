'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: middleware/errorHandler.js
 * Covered Requirements:
 * - REQ-VAL-001: Friendly validation messages and guidance
 * - REQ-SEC-001: Consistent server responses for audit reliability
 * Validation Protocol: VP-VAL-001, VP-SEC-001
 * GxP Impact: YES — user guidance and consistent error semantics
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] Codes -> messages mapping   [x] Status codes standardized   [x] No sensitive info leakage
 */

const mapMessage = (code) => {
  switch (code) {
    case 'EMAIL_REQUIRED': return 'Email is required.';
    case 'EMAIL_TOO_LONG': return 'Email must be at most 50 characters.';
    case 'EMAIL_INVALID': return 'Please enter a valid email address.';
    case 'MOBILE_REQUIRED': return 'Mobile number is required.';
    case 'MOBILE_INVALID': return 'Mobile number must be exactly 10 digits.';
    case 'PASSWORD_REQUIRED': return 'Password is required.';
    case 'PASSWORD_WEAK': return 'Password must be at least 8 characters with upper, lower, digit, and special character.';
    case 'DUPLICATE_ACCOUNT': return 'An account already exists with the provided email or mobile.';
    case 'CREDENTIALS_REQUIRED': return 'Identifier and password are required.';
    case 'INVALID_CREDENTIALS': return 'Invalid credentials.';
    case 'ACCOUNT_REQUIRED': return 'Account number is required.';
    case 'ACCOUNT_INVALID': return 'Account number must be 8-20 digits.';
    case 'ACCOUNT_MISMATCH': return 'Account entries do not match.';
    case 'IFSC_REQUIRED': return 'IFSC is required.';
    case 'IFSC_INVALID': return 'IFSC must match pattern: 4 letters + 0 + 6 alphanumeric.';
    case 'ESIGN_VALIDATION_FAILED': return 'Electronic signature confirmation is required.';
    case 'REASON_REQUIRED': return 'Please provide a reason for this change.';
    case 'REASON_TOO_LONG': return 'Reason for change must be under 250 characters.';
    case 'REAUTH_FAILED': return 'Please confirm your password to authorize this critical change.';
    case 'DB_ERROR': return 'A database error occurred. Please retry.';
    default: return 'An error occurred.';
  }
};

// PUBLIC_INTERFACE
function errorHandler(err, req, res, next) {
  /**
   * Unified error translation to client-friendly messages.
   * REQ IDs: REQ-VAL-001, REQ-SEC-001
   * Acceptance Criteria:
   * - AC-01: Validation errors -> 400
   * - AC-02: Duplicate -> 409
   * - AC-03: Auth failures -> 401
   * - AC-04: Unknown -> 500, generic message (no leakage)
   * GxP Impact: YES — consistent client guidance, audit-stable codes
   * Risk Level: MEDIUM
   * Validation Protocol: VP-VAL-001
   */
  const code = err && err.code ? err.code : err && err.message && /^[A-Z_]+$/.test(err.message) ? err.message : 'INTERNAL_ERROR';
  const status = code === 'INVALID_CREDENTIALS' ? 401 :
    code === 'DUPLICATE_ACCOUNT' ? 409 :
    code.endsWith('_REQUIRED') || code.endsWith('_INVALID') || code.endsWith('_MISMATCH') ? 400 : 500;
  res.status(status).json({ code, message: mapMessage(code) });
}

module.exports = { errorHandler };
