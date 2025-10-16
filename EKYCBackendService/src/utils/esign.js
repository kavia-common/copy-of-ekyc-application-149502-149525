'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: utils/esign.js
 * Covered Requirements:
 * - REQ-ESIGN-001: Electronic Signature Binding for Critical Operations
 * - REQ-SEC-001: Audit linkage via signature_id
 * Validation Protocol: VP-ESIGN-001, VP-SEC-001
 * GxP Impact: YES — ensures non-repudiation and binding to change
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] Nonce uniqueness   [x] Digest over canonical payload   [x] Stored signature record
 */
const crypto = require('crypto');
const db = require('../db');
const { sha256Hex } = require('./crypto');

// PUBLIC_INTERFACE
function bindElectronicSignature({ userId, fullName, agree, entity, entityId, payload }) {
  /**
   * Create an e-sign binding with nonce and digest over payload+signer+nonce+timestamp. Prevents replay with UNIQUE nonce.
   * REQ IDs: REQ-ESIGN-001
   * Acceptance Criteria:
   * - AC-01: fullName and agree=true are mandatory
   * - AC-02: Generates nonce and signed_at, creates digest
   * - AC-03: Persists signature row with UNIQUE nonce
   * GxP Impact: YES — e-sign evidence
   * Risk Level: MEDIUM
   * Validation Protocol: VP-ESIGN-001
   */
  if (!agree || !fullName) {
    const err = new Error('ESIGN_VALIDATION_FAILED');
    err.code = 'ESIGN_VALIDATION_FAILED';
    throw err; // TRACE: AC-01
  }
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomBytes(16).toString('hex'); // TRACE: AC-02
  const canonicalPayload = JSON.stringify({ entity, entityId: entityId || null, payload });
  const digestBase = `${userId}|${fullName}|${nonce}|${timestamp}|${canonicalPayload}`;
  const signature_digest = sha256Hex(digestBase); // TRACE: AC-02

  const info = db.prepare(
    'INSERT INTO signatures (signer_user_id, nonce, payload_digest, created_at) VALUES (?, ?, ?, ?)'
  ).run(userId, nonce, signature_digest, timestamp); // TRACE: AC-03

  return { signature_digest, signed_at: timestamp, nonce, signature_id: info.lastInsertRowid };
}

module.exports = { bindElectronicSignature };
