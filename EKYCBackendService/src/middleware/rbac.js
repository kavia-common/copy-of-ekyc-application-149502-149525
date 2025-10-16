'use strict';

const PERMISSIONS = {
  AUTH_SELF_UPDATE_BANK: 'auth.self.update.bank',
};

const ROLE_PERMISSIONS = {
  user: new Set([PERMISSIONS.AUTH_SELF_UPDATE_BANK]),
  admin: new Set([PERMISSIONS.AUTH_SELF_UPDATE_BANK]),
};

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

// PUBLIC_INTERFACE
function requirePermission(permission) {
  /** Enforce permission membership for current role */
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
    const perms = ROLE_PERMISSIONS[req.user.role] || new Set();
    if (!perms.has(permission)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Missing permission' });
    }
    next();
  };
}

module.exports = { requireRole, requirePermission, PERMISSIONS };
