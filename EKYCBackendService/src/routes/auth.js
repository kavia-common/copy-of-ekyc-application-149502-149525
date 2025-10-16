'use strict';
const express = require('express');
const router = express.Router();
const authService = require('../services/auth');
const db = require('../db');
const { withAudit } = require('../middleware/audit');

/**
 * Register
 */
router.post('/register', withAudit('users', 'CREATE')(async (req, res) => {
  const { email, mobile, password } = req.body || {};
  const now = new Date().toISOString();

  const result = authService.register({ email, mobile, password });
  if (!result.ok) {
    db.prepare('INSERT INTO registration_attempts (email, mobile, outcome, error_code, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(email || null, mobile || null, 'FAILURE', result.code, null, now);
    const err = new Error(result.code);
    err.code = result.code;
    throw err;
  }
  db.prepare('INSERT INTO registration_attempts (email, mobile, outcome, error_code, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(email, mobile, 'SUCCESS', null, null, now);

  res.locals.entityId = String(result.userId);
  res.locals.afterState = { id: result.userId, email, mobile };
  res.status(201).json({ id: result.userId, email, mobile });
}));

/**
 * Login
 */
router.post('/login', withAudit('users', 'READ')(async (req, res) => {
  const { identifier, password } = req.body || {};
  const result = authService.login({ identifier, password });
  if (!result.ok) {
    const err = new Error(result.code);
    err.code = result.code;
    throw err;
  }
  res.status(200).json({ token: result.token, user: result.user });
}));

module.exports = router;
