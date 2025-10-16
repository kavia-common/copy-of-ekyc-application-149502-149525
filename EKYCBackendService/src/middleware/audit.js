'use strict';
const crypto = require('crypto');
const db = require('../db');

/**
 * Generate a UUID v4 string without external deps.
 */
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
  );
}

// PUBLIC_INTERFACE
function withAudit(entity, action) {
  /** Wrap handler and record audit log with ALCOA+ and request metadata. Insert-only, durable. */
  return (handler) => {
    return async (req, res, next) => {
      const start = new Date().toISOString();
      const userId = req.user ? req.user.id : null;
      const requestId = (req.id && String(req.id)) || uuidv4();
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
      // Optional unauthenticated attribution before account creation (hashed contact if provided)
      let unauth_actor = null;
      if (!userId && (req.body?.email || req.body?.mobile)) {
        const basis = (req.body.email || req.body.mobile);
        const hash = crypto.createHash('sha256').update(String(basis)).digest('hex');
        unauth_actor = `sha256:${hash.substring(0, 16)}`;
      }
      let before_state = null;
      if (typeof req.getBeforeState === 'function') {
        try { before_state = JSON.stringify(await req.getBeforeState()); } catch { before_state = null; }
      }
      const reason = req.body?.reasonForChange || req.body?.reason || req.query?.reasonForChange || null;

      const insertAudit = (payload) => {
        // enforce durability
        db.exec('PRAGMA synchronous = FULL;');
        const stmt = db.prepare(`
          INSERT INTO audit_log
            (request_id, user_id, unauth_actor, entity, entity_id, action, before_state, after_state, reason, outcome, error_code, error_message, stack, ip, user_agent, signature_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          requestId,
          userId,
          unauth_actor,
          entity,
          payload.entity_id || null,
          action,
          before_state,
          payload.after_state || null,
          reason,
          payload.outcome,
          payload.error_code || null,
          payload.error_message || null,
          payload.stack || null,
          ip,
          userAgent,
          payload.signature_id || null,
          start
        );
      };

      try {
        await handler(req, res, (err) => { if (err) throw err; });
        insertAudit({
          outcome: 'SUCCESS',
          entity_id: res.locals.entityId || null,
          after_state: res.locals.afterState ? JSON.stringify(res.locals.afterState) : null,
          signature_id: res.locals.signatureId || null
        });
      } catch (e) {
        insertAudit({
          outcome: 'FAILURE',
          entity_id: res.locals?.entityId || null,
          error_code: (e && e.code) || 'INTERNAL_ERROR',
          error_message: e && e.message ? String(e.message) : 'Error',
          stack: e && e.stack ? String(e.stack).substring(0, 4000) : null
        });
        next(e);
      }
    };
  };
}

module.exports = { withAudit };
