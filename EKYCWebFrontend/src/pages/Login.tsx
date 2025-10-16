import React, { useMemo, useState } from 'react';
import { Input } from '../components/Form/Input';
import { apiLogin } from '../services/api';

// PUBLIC_INTERFACE
export const Login: React.FC<{ onLoggedIn?: (token: string) => void }> = ({ onLoggedIn }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const valid = useMemo(() => identifier.length > 0 && password.length > 0, [identifier, password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await apiLogin(identifier, password);
      onLoggedIn?.(res.token);
      setMsg('Login successful.');
    } catch (err: any) {
      setMsg(err?.message || 'Login failed.');
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
