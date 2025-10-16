'use strict';
/**
 * REQUIREMENT TRACEABILITY - Module: middleware/rbac.js
 * Covered Requirements:
 * - REQ-SEC-ACL-001: RBAC and Access Controls
 * - REQ-SEC-001: Supports audit attribution via consistent responses
 * Validation Protocol: VP-SEC-001
 * GxP Impact: YES — prevents unauthorized access to critical operations
 * Risk Level: MEDIUM
 * RELEASE GATE CHECKLIST:
 * [x] Roles defined   [x] Permissions mapped   [x] Consistent 401/403 responses
 */

const PERMISSIONS = {
  AUTH_SELF_UPDATE_BANK: 'auth.self.update.bank',
};

const ROLE_PERMISSIONS = {
  user: new Set([PERMISSIONS.AUTH_SELF_UPDATE_BANK]),
  admin: new Set([PERMISSIONS.AUTH_SELF_UPDATE_BANK]),
};

// PUBLIC_INTERFACE
function requireRole(roles = []) {
  /**
   * Enforce least privilege by role list.
   * REQ IDs: REQ-SEC-ACL-001
   * Acceptance Criteria:
   * - AC-01: 401 if unauthenticated
   * - AC-02: 403 if role not allowed
   */
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' }); // TRACE: AC-01
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Insufficient role' }); // TRACE: AC-02
    }
    next();
  };
}

// PUBLIC_INTERFACE
function requirePermission(permission) {
  /**
   * Enforce permission membership for current role.
   * REQ IDs: REQ-SEC-ACL-001
   * Acceptance Criteria:
   * - AC-01: 401 if unauthenticated
   * - AC-02: 403 if permission missing
   */
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' }); // TRACE: AC-01
    const perms = ROLE_PERMISSIONS[req.user.role] || new Set();
    if (!perms.has(permission)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Missing permission' }); // TRACE: AC-02
    }
    next();
  };
}

module.exports = { requireRole, requirePermission, PERMISSIONS };
