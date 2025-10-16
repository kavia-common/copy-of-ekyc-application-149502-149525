# EKYCBackendService - Traceability Matrix

Scope of current implementation:
- REQ-VAL-001: Input Validation and User Guidance (Registration/Login)
- REQ-AUTH-001: Password Creation and Secure Login
- REQ-BANK-001: Bank Account Number Confirmation (Match Check)
- REQ-BANK-IFSC-001: IFSC Format Validation and User Confirmation
- REQ-SEC-001: Audit Trail Implementation (ALCOA+)
- REQ-SEC-ACL-001: RBAC and Access Controls
- REQ-ESIGN-001: Electronic Signature Binding for Critical Operations

Mapping (Requirement → Implementation file:section → Tests)

- REQ-VAL-001
  - Implementation:
    - src/routes/auth.js: POST /api/auth/register (module header, endpoint doc)
    - src/services/auth.js: register() (doc + TRACE comments)
    - src/services/validation.js: validateEmail, validateMobile, validatePassword
    - src/middleware/errorHandler.js: friendly messages
  - Tests:
    - src/tests/unit/validation.test.js: email/mobile/password
    - src/tests/integration/auth_bank.test.js: "register with validations and duplicate check"

- REQ-AUTH-001
  - Implementation:
    - src/services/auth.js: register(), login()
    - src/utils/crypto.js: hashPassword, verifyPassword, createJWT, verifyJWT
    - src/routes/auth.js: POST /api/auth/login
  - Tests:
    - src/tests/integration/auth_bank.test.js: "login"

- REQ-BANK-001
  - Implementation:
    - src/services/validation.js: validateAccountNumber
    - src/services/bank.js: saveBankDetails (double-entry validation)
    - src/routes/bank.js: POST /api/bank-details
  - Tests:
    - src/tests/unit/validation.test.js: account validation
    - src/tests/integration/auth_bank.test.js: bank details save scenarios

- REQ-BANK-IFSC-001
  - Implementation:
    - src/services/validation.js: validateIFSC (regex)
    - src/services/bank.js: saveBankDetails (IFSC validation, branch derive)
    - src/routes/bank.js: POST /api/bank-details
  - Tests:
    - src/tests/unit/validation.test.js: IFSC validation
    - src/tests/integration/auth_bank.test.js: flow uses valid IFSC

- REQ-SEC-001 (Audit)
  - Implementation:
    - src/middleware/audit.js: withAudit()
    - src/db.js: audit_log schema
    - route usage: auth/bank endpoints wrapped with withAudit()
  - Tests:
    - src/tests/integration/auth_bank.test.js: "audit entries created"

- REQ-SEC-ACL-001 (RBAC)
  - Implementation:
    - src/middleware/auth.js: authenticate
    - src/middleware/rbac.js: requireRole, requirePermission
    - src/routes/bank.js: GET/POST guard chain
  - Tests:
    - Covered indirectly by integration test (401 without token)

- REQ-ESIGN-001
  - Implementation:
    - src/utils/esign.js: bindElectronicSignature
    - src/services/bank.js: e-sign invocation and signature_id propagation
    - src/db.js: signatures table
  - Tests:
    - src/tests/unit/esign_rbac_audit.test.js

Notes:
- Line/section references are indicated via module headers and function docblocks with TRACE tags.
- Validation Protocol placeholders: VP-VAL-001, VP-BANK-001, VP-SEC-001, VP-ESIGN-001 appear in code comments.

