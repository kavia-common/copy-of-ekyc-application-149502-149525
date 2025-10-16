# EKYCWebFrontend - GxP Compliance Notes (ALCOA+)

Scope: Implemented UI for
- REQ-VAL-001 Registration/Login input validation and guidance
- REQ-BANK-001 Bank account double-entry & IFSC pattern validation with e-sign placeholder

Validation & Guidance
- Client-side regex rules mirror backend to prevent invalid submissions.
- Help text for Aadhaar-mobile linkage and IFSC format.
- Submit buttons disabled until validations pass.

Accessibility (WCAG 2.1 AA)
- Inputs connect labels via htmlFor/aria.
- Inline errors use role="alert" with aria-invalid.
- Status messages use role="status".
- A11y helpers in src/accessibility/aria-helpers.ts.

Security & Privacy
- No secrets in client; API base via REACT_APP_API_BASE.
- JWT stored externally by hosting app; component exposes onLoggedIn callback.

Traceability
- In-code: Module headers and function docblocks cite REQ IDs and AC; inline `TRACE:` comments mark AC enforcement.
- Matrix: See TRACEABILITY-MATRIX.md for Requirement → Implementation → Tests mapping.

Electronic Signature Binding
- Name entry + consent checkbox required for bank updates; backend binds signature with nonce and digest to prevent replay.
- reasonForChange is mandatory for bank updates; optional critical flag will prompt for password confirmation.

Roles and Permissions
- Roles: user, admin
- Permission enforced on bank update: auth.self.update.bank

Release Checklist
- Validate OpenAPI reflects reasonForChange, critical, reauthPassword
- Verify audit_log population (requestId, IP, userAgent, error fields)
- Confirm signatures table nonce uniqueness
- Ensure ≥85% test coverage across backend; UI tests updated for reason field
