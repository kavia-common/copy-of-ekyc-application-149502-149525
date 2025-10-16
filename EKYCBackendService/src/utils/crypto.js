'use strict';
const crypto = require('crypto');

const ITERATIONS = 120000;
const KEYLEN = 64;
const DIGEST = 'sha512';

// PUBLIC_INTERFACE
function hashPassword(password) {
  /** Hash a password using PBKDF2 with random salt; returns 'salt:hash' string */
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

// PUBLIC_INTERFACE
function verifyPassword(password, stored) {
  /** Verify password against stored 'salt:hash' string */
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const computed = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
}

// Minimal JWT (HS256) without external libs
function base64url(input) {
  return Buffer.from(JSON.stringify(input))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signHS256(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// PUBLIC_INTERFACE
function createJWT(payload, secret, expiresInSeconds = 3600) {
  /** Create a JWT HS256 signed token with expiration (exp) */
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const headerB64 = base64url(header);
  const payloadB64 = base64url(body);
  const toSign = `${headerB64}.${payloadB64}`;
  const sig = signHS256(toSign, secret);
  return `${toSign}.${sig}`;
}

// PUBLIC_INTERFACE
function verifyJWT(token, secret) {
  /** Verify HS256 JWT signature and expiration; returns payload or null */
  try {
    const [h, p, s] = token.split('.');
    const expected = signHS256(`${h}.${p}`, secret);
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
function sha256Hex(input) {
  /** Return hex SHA-256 digest */
  return crypto.createHash('sha256').update(input).digest('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  createJWT,
  verifyJWT,
  sha256Hex
};
