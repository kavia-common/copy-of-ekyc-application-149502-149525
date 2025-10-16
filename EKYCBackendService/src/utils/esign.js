'use strict';
const { sha256Hex } = require('./crypto');

// PUBLIC_INTERFACE
function bindElectronicSignature({ userId, fullName, agree, entity, entityId }) {
  /** Create an e-sign placeholder binding: returns digest and signed_at. Requires agree=true and non-empty fullName. */
  if (!agree || !fullName) {
    throw new Error('ESIGN_VALIDATION_FAILED');
  }
  const timestamp = new Date().toISOString();
  const payload = `${userId}|${fullName}|${entity}|${entityId || ''}|${timestamp}`;
  const signature_digest = sha256Hex(payload);
  return { signature_digest, signed_at: timestamp };
}

module.exports = { bindElectronicSignature };
