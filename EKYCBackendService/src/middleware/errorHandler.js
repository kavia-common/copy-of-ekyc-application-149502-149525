'use strict';

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
    default: return 'An error occurred.';
  }
};

// PUBLIC_INTERFACE
function errorHandler(err, req, res, next) {
  const code = err && err.code ? err.code : err && err.message && /^[A-Z_]+$/.test(err.message) ? err.message : 'INTERNAL_ERROR';
  const status = code === 'INVALID_CREDENTIALS' ? 401 :
    code === 'DUPLICATE_ACCOUNT' ? 409 :
    code.endsWith('_REQUIRED') || code.endsWith('_INVALID') || code.endsWith('_MISMATCH') ? 400 : 500;
  res.status(status).json({ code, message: mapMessage(code) });
}

module.exports = { errorHandler };
