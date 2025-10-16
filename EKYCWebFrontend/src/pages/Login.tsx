/**
 * REQUIREMENT TRACEABILITY - Module: Login.tsx
 * REQ IDs: REQ-VAL-001, REQ-AUTH-001
 * User Story: As a registered user, I want to securely log in using mobile/email and password.
 * Acceptance Criteria:
 * - AC-01: Accepts identifier (email/mobile) and password
 * - AC-02: Disable submit until both filled
 * - AC-03: Show clear error on failure
 * GxP Impact: YES — authentication UI correctness affects regulated access
 * Risk Level: MEDIUM
 * Validation Protocol: VP-VAL-001
 */
import React, { useMemo, useState } from 'react';
import { Input } from '../components/Form/Input';
import { apiLogin } from '../services/api';

// PUBLIC_INTERFACE
export const Login: React.FC<{ onLoggedIn?: (token: string) => void }> = ({ onLoggedIn }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const valid = useMemo(() => identifier.length > 0 && password.length > 0, [identifier, password]); // TRACE: AC-02

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await apiLogin(identifier, password); // TRACE: AC-01
      onLoggedIn?.(res.token);
      setMsg('Login successful.');
    } catch (err: any) {
      setMsg(err?.message || 'Login failed.'); // TRACE: AC-03
    }
  };

  return (
    <form onSubmit={onSubmit} aria-labelledby="login-title" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h2 id="login-title">Login</h2>
      <Input id="identifier" label="Email or Mobile" value={identifier} onChange={setIdentifier} required />
      <Input id="password" type="password" label="Password" value={password} onChange={setPassword} required />
      <button type="submit" disabled={!valid} aria-disabled={!valid}>Login</button>
      <p style={{ fontSize: 12, color: '#555' }}>Forgot password? Contact support to reset.</p>
      {msg && <div role="status" style={{ marginTop: 12 }}>{msg}</div>}
    </form>
  );
};
