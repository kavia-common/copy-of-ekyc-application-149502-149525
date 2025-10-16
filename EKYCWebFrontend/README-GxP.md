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
- REQ-VAL-001: pages/Register.tsx, pages/Login.tsx, components/Form/Input.tsx
- REQ-BANK-001: pages/BankDetails.tsx, components/Form/IfscHelp.tsx

Electronic Signature Placeholder
- Name entry + consent checkbox required for critical bank updates; bound in backend using SHA-256 digest.
