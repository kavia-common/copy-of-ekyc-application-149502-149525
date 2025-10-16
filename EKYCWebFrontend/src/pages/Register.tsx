/**
 * REQUIREMENT TRACEABILITY - Module: Register.tsx
 * REQ IDs: REQ-VAL-001, REQ-AUTH-001
 * User Story: As a user, I want clear validation during registration and strong password creation.
 * Acceptance Criteria:
 * - AC-01: Email <=50 and valid format
 * - AC-02: Mobile 10 digits
 * - AC-03: Strong password policy and confirmation match
 * GxP Impact: YES — front-end validation reduces invalid writes
 * Risk Level: MEDIUM
 * Validation Protocol: VP-VAL-001 (UI parity with backend)
 * RELEASE GATE CHECKLIST: [x] Regex parity [x] Errors inline [x] Submit disabled until valid
 */
import React, { useMemo, useState } from 'react';
import { Input } from '../components/Form/Input';
import { apiRegister } from '../services/api';

// Validation regexes to match backend
const EMAIL_MAX = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

// PUBLIC_INTERFACE
export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [rePw, setRePw] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const isValid = useMemo(() => {
    const errs: Record<string, string | null> = {};
    if (!email) errs.email = 'Email is required.';
    else if (email.length > EMAIL_MAX) errs.email = 'Email must be at most 50 characters.'; // TRACE: AC-01
    else if (!EMAIL_REGEX.test(email)) errs.email = 'Please enter a valid email address.'; // TRACE: AC-01

    if (!mobile) errs.mobile = 'Mobile number is required.';
    else if (!MOBILE_REGEX.test(mobile)) errs.mobile = 'Mobile number must be exactly 10 digits.'; // TRACE: AC-02

    if (!password) errs.password = 'Password is required.';
    else if (!PASSWORD_POLICY.test(password)) errs.password = 'Password must be at least 8 characters with upper, lower, digit, and special.'; // TRACE: AC-03

    if (!rePw) errs.rePw = 'Please re-enter password.';
    else if (password !== rePw) errs.rePw = 'Passwords do not match.'; // TRACE: AC-03

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [email, mobile, password, rePw]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setMsg(null);
    try {
      await apiRegister(email, mobile, password);
      setMsg('Registration successful. You may login now.');
    } catch (err: any) {
      setMsg(err?.message || 'Registration failed.');
    }
  };

  return (
    <form onSubmit={onSubmit} aria-labelledby="reg-title" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h2 id="reg-title">Register</h2>
      <p style={{ fontSize: 12, color: '#555' }}>
        Note: Ensure your mobile number is linked with Aadhaar to continue eKYC. Visit telecom portal/Aadhaar services to check linkage.
      </p>
      <Input id="email" label="Email" value={email} onChange={setEmail} required error={errors.email || null} />
      <Input id="mobile" label="Mobile (10 digits)" value={mobile} onChange={setMobile} required error={errors.mobile || null} />
      <Input id="password" type="password" label="Password" value={password} onChange={setPassword} required error={errors.password || null} helpText="At least 8 chars incl. upper, lower, number, special." />
      <Input id="rePw" type="password" label="Re-enter Password" value={rePw} onChange={setRePw} required error={errors.rePw || null} />
      <button type="submit" disabled={!isValid} aria-disabled={!isValid}>Create Account</button>
      {msg && <div role="status" style={{ marginTop: 12 }}>{msg}</div>}
    </form>
  );
};
