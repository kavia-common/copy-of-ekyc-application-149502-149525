# EKYCWebFrontend - Traceability Matrix

Covered Requirements (UI scope):
- REQ-VAL-001: Input Validation and User Guidance (registration/login)
- REQ-BANK-001: Bank Account Number Confirmation (match check)
- REQ-BANK-IFSC-001: IFSC Format Validation
- REQ-ESIGN-001: E-sign acknowledgement UI for bank update

Mapping (Requirement → Implementation → Tests)

- REQ-VAL-001
  - Implementation:
    - src/pages/Register.tsx (module header; validation regexes; disabled submit)
    - src/pages/Login.tsx (module header; disabled submit until valid)
    - src/components/Form/Input.tsx (inline errors, aria)
  - Tests:
    - src/tests/register_bank.test.tsx: "disables submit until valid"

- REQ-BANK-001
  - Implementation:
    - src/pages/BankDetails.tsx (double-entry match, green tick)
  - Tests:
    - src/tests/register_bank.test.tsx: "shows green tick when account numbers match"

- REQ-BANK-IFSC-001
  - Implementation:
    - src/pages/BankDetails.tsx (IFSC regex, status)
    - src/components/Form/IfscHelp.tsx (help text)
  - Tests:
    - Manual/integration coverage via backend tests; UI asserts status message

- REQ-ESIGN-001
  - Implementation:
    - src/pages/BankDetails.tsx (full name as signature + consent; reason; critical reauth prompt)
  - Tests:
    - Covered via backend integration; UI guards via disabled submit

References:
- API client: src/services/api.ts preserves backend codes/messages for UI guidance.
