'use strict';

// PUBLIC_INTERFACE
function requireRole(roles = []) {
  /** Enforce least privilege by role list */
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Insufficient role' });
    }
    next();
  };
}

module.exports = { requireRole };
