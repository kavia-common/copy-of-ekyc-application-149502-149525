# EKYCWebFrontend

This frontend includes pages and components to support two stories:
- Registration/Login validation and guidance
- Bank details double-entry + IFSC validation with e-sign placeholder fields

Files
- src/pages/Register.tsx
- src/pages/Login.tsx
- src/pages/BankDetails.tsx
- src/components/Form/Input.tsx
- src/components/Form/IfscHelp.tsx
- src/services/api.ts (uses REACT_APP_API_BASE)
- src/accessibility/aria-helpers.ts

Usage
- Import and render the pages in your app routing as needed.
- Provide REACT_APP_API_BASE pointing to the backend (e.g., http://localhost:3000).

Example
// App integration example (pseudo)
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { BankDetails } from './pages/BankDetails';

Notes
- Submit buttons are disabled until validations pass.
- Input components are accessible (labels, aria-invalid, role alerts).
- BankDetails requires a JWT token prop to call protected APIs.
