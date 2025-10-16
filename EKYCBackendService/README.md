# EKYCBackendService

This service implements endpoints for two approved stories:
- REQ-VAL-001: Registration/Login input validation, duplicate checks, guidance
- REQ-BANK-001: Bank account double-entry match, IFSC pattern validation, persistence, audit, and e-sign placeholder

Key features
- Express API with CORS and Swagger UI
- SQLite (better-sqlite3) with tables: users, registration_attempts, bank_details, audit_trail
- Auth: password hashing (PBKDF2), minimal JWT (HS256) without external libs
- RBAC middleware (roles: user, admin)
- Audit middleware capturing ALCOA+ fields (user, timestamps, before/after, reason, outcome, errors, IP)
- Unified error handler with friendly messages
- Electronic signature placeholder for bank details updates (signature_digest and signed_at)
- OpenAPI spec at interfaces/openapi.yaml

Run locally
1) npm install
2) npm run dev (or npm start)
3) Visit /docs for API documentation

Environment
- SQLITE_PATH: optional path to local sqlite file (default: data/app.sqlite)
- JWT_SECRET: secret key for JWT signing

Testing
- npm test (uses Jest and Supertest)
- Integration tests cover auth and bank endpoints; unit tests cover validation rules

Compliance notes
See src/README-GxP.md for ALCOA+, audit and traceability details.
