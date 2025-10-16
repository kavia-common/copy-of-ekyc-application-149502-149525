'use strict';
const db = require('../db');

// PUBLIC_INTERFACE
function withAudit(entity, action) {
  /** Wrap handler and record audit trail entry for CREATE/READ/UPDATE/DELETE actions */
  return (handler) => {
    return async (req, res, next) => {
      const start = new Date().toISOString();
      const userId = req.user ? req.user.id : null;
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
      let before_state = null;
      if (typeof req.getBeforeState === 'function') {
        try { before_state = JSON.stringify(await req.getBeforeState()); } catch { before_state = null; }
      }
      const reason = req.body?.reason || req.query?.reason || null;

      const record = (outcome, after_state, error) => {
        const stmt = db.prepare(`
          INSERT INTO audit_trail (user_id, entity, entity_id, action, before_state, after_state, reason, outcome, error, ip, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          userId,
          entity,
          res.locals.entityId || null,
          action,
          before_state,
          after_state ? JSON.stringify(after_state) : null,
          reason,
          outcome,
          error || null,
          ip,
          start
        );
      };

      try {
        await handler(req, res, (err) => { if (err) throw err; });
        // Handler ended successfully only if response not yet sent? We'll capture after based on res.locals.afterState
        record('SUCCESS', res.locals.afterState || null, null);
      } catch (e) {
        record('FAILURE', null, String(e && e.message || e));
        next(e);
      }
    };
  };
}

module.exports = { withAudit };
