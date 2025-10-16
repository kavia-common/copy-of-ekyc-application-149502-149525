'use strict';
const { verifyPassword } = require('./crypto');
const db = require('../db');

/**
 * Simple re-auth check by verifying password for current user.
 * PUBLIC_INTERFACE
 */
function verifyReauthPassword(userId, password) {
  /** Verify user password again for critical operations, returns boolean. */
  const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(userId);
  if (!user) return false;
  return verifyPassword(password, user.password_hash);
}

module.exports = { verifyReauthPassword };
