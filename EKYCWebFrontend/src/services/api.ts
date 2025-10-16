/**
 * REQUIREMENT TRACEABILITY - Module: services/api.ts
 * REQ IDs: REQ-VAL-001, REQ-AUTH-001, REQ-BANK-001, REQ-BANK-IFSC-001, REQ-ESIGN-001
 * Acceptance Criteria:
 * - AC-API-01: Include Authorization header where required
 * - AC-API-02: Surface backend codes/messages to UI for guidance
 * GxP Impact: YES — preserves server error semantics for audit/test traceability
 * Risk Level: LOW
 */
 /**
  * Simple API client without external deps.
  * Uses fetch and returns JSON with error handling.
  */
const API_BASE = process.env.REACT_APP_API_BASE || '';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data.code || 'REQUEST_FAILED';
    const message = data.message || 'Request failed';
    const err: any = new Error(message);
    err.code = code;
    err.status = res.status;
    throw err; // TRACE: AC-API-02
  }
  return data;
}

// PUBLIC_INTERFACE
export function apiRegister(email: string, mobile: string, password: string) {
  /** Register a new user — REQ-VAL-001, REQ-AUTH-001 */
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, mobile, password }) });
}

// PUBLIC_INTERFACE
export function apiLogin(identifier: string, password: string) {
  /** Login and receive JWT token — REQ-AUTH-001 */
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
}

// PUBLIC_INTERFACE
export function apiGetBank(token: string) {
  /** Get current user's bank details — REQ-SEC-ACL-001 enforced server-side */
  return request('/api/bank-details', { headers: { Authorization: `Bearer ${token}` } }); // TRACE: AC-API-01
}

// PUBLIC_INTERFACE
export function apiSaveBank(token: string, payload: {
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  fullNameForESign: string;
  agreeESign: boolean;
  reasonForChange: string;
  critical?: boolean;
  reauthPassword?: string;
}) {
  /** Save bank details with e-sign placeholder — REQ-BANK-001, REQ-BANK-IFSC-001, REQ-ESIGN-001 */
  return request('/api/bank-details', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // TRACE: AC-API-01
    body: JSON.stringify(payload),
  });
}
