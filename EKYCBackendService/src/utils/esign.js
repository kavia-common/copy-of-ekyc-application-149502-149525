'use strict';
const crypto = require('crypto');
const db = require('../db');
const { sha256Hex } = require('./crypto');

// PUBLIC_INTERFACE
function bindElectronicSignature({ userId, fullName, agree, entity, entityId, payload }) {
  /** Create an e-sign binding with nonce and digest over payload+signer+nonce+timestamp. Prevents replay with UNIQUE nonce. */
  if (!agree || !fullName) {
    const err = new Error('ESIGN_VALIDATION_FAILED');
    err.code = 'ESIGN_VALIDATION_FAILED';
    throw err;
  }
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const canonicalPayload = JSON.stringify({ entity, entityId: entityId || null, payload });
  const digestBase = `${userId}|${fullName}|${nonce}|${timestamp}|${canonicalPayload}`;
  const signature_digest = sha256Hex(digestBase);

  const info = db.prepare(
    'INSERT INTO signatures (signer_user_id, nonce, payload_digest, created_at) VALUES (?, ?, ?, ?)'
  ).run(userId, nonce, signature_digest, timestamp);

  return { signature_digest, signed_at: timestamp, nonce, signature_id: info.lastInsertRowid };
}

module.exports = { bindElectronicSignature };
