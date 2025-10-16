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
    throw err;
  }
  return data;
}

// PUBLIC_INTERFACE
export function apiRegister(email: string, mobile: string, password: string) {
  /** Register a new user */
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, mobile, password }) });
}

// PUBLIC_INTERFACE
export function apiLogin(identifier: string, password: string) {
  /** Login and receive JWT token */
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
}

// PUBLIC_INTERFACE
export function apiGetBank(token: string) {
  /** Get current user's bank details */
  return request('/api/bank-details', { headers: { Authorization: `Bearer ${token}` } });
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
  /** Save bank details with e-sign placeholder */
  return request('/api/bank-details', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}
