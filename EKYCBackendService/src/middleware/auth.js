'use strict';
const { verifyJWT } = require('../utils/crypto');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_env';

// PUBLIC_INTERFACE
function authenticate(req, res, next) {
  /** Verify Bearer token and attach user to request */
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing token' });
  const payload = verifyJWT(token, JWT_SECRET);
  if (!payload) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  const user = db.prepare('SELECT id, email, mobile, role FROM users WHERE id = ?').get(payload.sub);
  if (!user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found' });
  req.user = user;
  next();
}

module.exports = { authenticate };
