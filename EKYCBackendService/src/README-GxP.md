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
- Tables:
  - audit_log (insert-only): request_id, user_id, unauth_actor, entity, entity_id, action, before_state, after_state, reason, outcome, error_code, error_message, stack, ip, user_agent, signature_id, created_at
  - signatures: id, signer_user_id, nonce (UNIQUE), payload_digest, created_at, linked_audit_id
- Middleware: src/middleware/audit.js wraps handlers via withAudit(entity, action) capturing requestId/IP/UserAgent and errors.
- For bank updates, e-sign binding stored as signature_digest, signed_at in bank_details and signatures entry recorded.

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

Traceability
- In-code: Module-level REQUIREMENT TRACEABILITY headers and function docblocks citing REQ IDs, AC, GxP impact, risk, and protocol placeholders (VP-VAL-001/VP-BANK-001/VP-SEC-001/VP-ESIGN-001). Inline comments prefixed with `TRACE:` mark where AC are enforced.
- Matrix: See TRACEABILITY-MATRIX.md for Requirement → Implementation → Tests mapping.

