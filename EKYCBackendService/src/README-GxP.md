# EKYCBackendService - GxP Compliance Notes (ALCOA+)

Scope: Two implemented stories
- REQ-VAL-001 Input Validation and User Guidance (Registration/Login)
- REQ-BANK-001 Bank Account Double-Entry Match + IFSC Pattern Validation

ALCOA+ Principles
- Attributable: Audit entries record user_id, IP, ISO timestamps, entity/action, before/after state.
- Legible: JSON entries with clear fields and standardized codes.
- Contemporaneous: Audit created at the time of request handling.
- Original: Raw request-derived states recorded; before/after kept.
- Accurate: Server-side validation ensures input integrity.

Audit Trail
- Table: audit_trail(user_id, entity, action, before_state, after_state, reason, outcome, error, ip, created_at)
- Middleware: src/middleware/audit.js wraps handlers via withAudit(entity, action).
- For bank updates, e-sign placeholder binding stored as signature_digest, signed_at in bank_details.

Access Controls
- JWT Auth: src/middleware/auth.js
- RBAC: src/middleware/rbac.js (roles: user, admin)

Validation Controls
- Central service: src/services/validation.js
- Enforced in register/login and bank save flows.

Electronic Signature Placeholder
- src/utils/esign.js generates signature_digest and signed_at using SHA-256 over (userId, name, entity, timestamp).
- Enabled for bank update ops.

Error Handling
- Unified handler: src/middleware/errorHandler.js returns consistent codes/messages.

Traceability Matrix
- REQ-VAL-001:
  - Backend: routes/auth.js, services/auth.js, services/validation.js, middleware/errorHandler.js, db tables users, registration_attempts, audit_trail
  - Frontend: client pages Register, Login, shared Input with help text
  - Tests: unit/validation.test.js, integration/auth_bank.test.js (auth section)
- REQ-BANK-001:
  - Backend: routes/bank.js, services/bank.js, services/validation.js, utils/esign.js, audit middleware, bank_details table
  - Frontend: BankDetails page, IfscHelp component, Input component
  - Tests: integration/auth_bank.test.js (bank section)
