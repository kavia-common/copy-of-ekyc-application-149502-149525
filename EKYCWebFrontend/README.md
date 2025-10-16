# EKYCWebFrontend

This frontend includes pages and components to support two stories:
- Registration/Login validation and guidance
- Bank details double-entry + IFSC validation with e-sign placeholder fields

Files
- src/App.tsx (Router + navbar + links)
- src/index.tsx (entrypoint)
- src/pages/Register.tsx
- src/pages/Login.tsx
- src/pages/BankDetails.tsx
- src/components/Form/Input.tsx
- src/components/Form/IfscHelp.tsx
- src/services/api.ts (uses REACT_APP_API_BASE)
- src/accessibility/aria-helpers.ts

Running locally
1) Copy .env.example to .env and set REACT_APP_API_BASE to the backend base URL (e.g., http://localhost:3001).
   - Ensure the backend is running and /openapi.json lists Auth and Bank endpoints.
   - If frontend runs on a different origin (3000) and backend on 3001, CORS is already enabled. You may restrict backend CORS by setting FRONTEND_ORIGIN in backend .env.
2) Install deps and start dev server with your React tooling (create-react-app/Vite/etc.). Ensure index.html has a <div id="root"></div>.
3) Visit:
   - /           Home with links
   - /register   Register page
   - /login      Login page
   - /bank       Bank details (requires token from Login)
   - /docs       Backend Swagger UI (proxied if same origin)

Notes
- Submit buttons are disabled until validations pass.
- Input components are accessible (labels, aria-invalid, role alerts).
- BankDetails requires a JWT token; this app stores it in memory after login.
- Ensure the backend runs and serves /health, /docs, and /openapi.json as documented.
- For API base, set REACT_APP_API_BASE (see .env.example). If you run frontend on a different origin (e.g., :3000) and backend on :3001, CORS is already enabled in the backend (src/app.js). Alternatively, you can serve both from the same origin using a dev proxy that maps /api and /docs to the backend, or set REACT_APP_API_BASE to http://localhost:3001 to avoid proxying.
