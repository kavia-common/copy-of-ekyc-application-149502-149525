/**
 * REQUIREMENT TRACEABILITY - Module: BankDetails.tsx
 * REQ IDs: REQ-BANK-001, REQ-BANK-IFSC-001, REQ-ESIGN-001
 * User Story: Enter account twice (show match), validate IFSC format, require e-sign and reason, optional critical reauth.
 * Acceptance Criteria:
 * - AC-01: Double-entry match shows green tick and prevents submit if mismatch
 * - AC-02: IFSC must match regex and guides user
 * - AC-03: reasonForChange required (<=250)
 * - AC-04: If critical, prompt for password and block without it
 * - AC-05: Require full name + consent for e-sign
 * GxP Impact: YES — ensures UI parity with backend for regulated change
 * Risk Level: MEDIUM
 * Validation Protocols: VP-BANK-001, VP-ESIGN-001
 * RELEASE GATE CHECKLIST: [x] Regex parity [x] Disabled submit until valid [x] Clear guidance and statuses
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '../components/Form/Input';
import { IfscHelp } from '../components/Form/IfscHelp';
import { apiGetBank, apiSaveBank } from '../services/api';

const IFSC_REGEX = /^[A-Z]{4}0[0-9A-Z]{6}$/;

// PUBLIC_INTERFACE
export const BankDetails: React.FC<{ token: string }> = ({ token }) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [fullName, setFullName] = useState('');
  const [agree, setAgree] = useState(false);
  const [branchInfo, setBranchInfo] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [critical, setCritical] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const current = await apiGetBank(token);
        if (current) {
          setAccountNumber(current.account_number || '');
          setConfirmAccountNumber(current.account_number || '');
          setIfsc(current.ifsc || '');
          setBranchInfo(current.branch_info || null);
        }
      } catch {}
    })();
  }, [token]);

  const match = useMemo(() => accountNumber.replace(/\s+/g, '') !== '' &&
    accountNumber.replace(/\s+/g, '') === confirmAccountNumber.replace(/\s+/g, ''), [accountNumber, confirmAccountNumber]); // TRACE: AC-01

  const ifscValid = useMemo(() => IFSC_REGEX.test(ifsc), [ifsc]); // TRACE: AC-02

  const canSubmit = useMemo(() => {
    if (!match || !ifscValid || fullName.trim().length === 0 || !agree) return false; // TRACE: AC-01/AC-02/AC-05
    if (reason.trim().length === 0 || reason.length > 250) return false; // TRACE: AC-03
    if (critical && reauthPassword.length === 0) return false; // TRACE: AC-04
    return true;
  }, [match, ifscValid, fullName, agree, reason, critical, reauthPassword]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setMsg(null);
    try {
      const res = await apiSaveBank(token, {
        accountNumber,
        confirmAccountNumber,
        ifsc,
        fullNameForESign: fullName,
        agreeESign: agree,
        reasonForChange: reason,
        critical,
        reauthPassword: critical ? reauthPassword : undefined
      });
      setBranchInfo(res.branch_info || null);
      setMsg('Bank details saved.');
    } catch (err: any) {
      setMsg(err?.message || 'Failed to save bank details.');
    }
  };

  return (
    <form onSubmit={onSubmit} aria-labelledby="bank-title" style={{ maxWidth: 480, margin: '0 auto' }}>
      <h2 id="bank-title">Bank Details</h2>
      <Input id="acct1" label="Account Number" value={accountNumber} onChange={setAccountNumber} required
        error={!match && confirmAccountNumber ? 'Account numbers must match.' : null} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Input id="acct2" label="Re-enter Account Number" value={confirmAccountNumber} onChange={setConfirmAccountNumber} required
            error={!match && confirmAccountNumber ? 'Account numbers must match.' : null} />
        </div>
        {match && <span aria-label="match-indicator" title="Account numbers match" style={{ color: 'green', fontSize: 20 }}>✔</span>}
      </div>
      <Input id="ifsc" label="IFSC" value={ifsc} onChange={(v) => { setIfsc(v.toUpperCase()); setBranchInfo(null); }} required
        error={!ifscValid && ifsc ? 'Invalid IFSC format.' : null}
        helpText="" />
      <IfscHelp />
      {ifscValid && <div role="status" style={{ fontSize: 12, color: 'green', marginTop: 4 }}>IFSC format valid.</div>}
      {branchInfo && <div role="status" style={{ marginTop: 8 }}>Branch: {branchInfo}</div>}
      <Input id="fullname" label="Type Full Name as Signature" value={fullName} onChange={setFullName} required
        helpText="Type your full name to acknowledge and sign this change (required for electronic signature binding)." />
      <Input id="reason" label="Reason for Change" value={reason} onChange={setReason} required
        helpText="Provide a short reason (max 250 characters). This is required for compliance and audit." />
      <div style={{ marginBottom: 12 }}>
        <label><input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} /> Treat as critical change (requires password confirm)</label>
      </div>
      {critical && (
        <Input id="reauth" type="password" label="Confirm Password" value={reauthPassword} onChange={setReauthPassword} required />
      )}
      <div style={{ marginBottom: 12 }}>
        <label><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I agree and certify the above details are correct.</label>
      </div>
      <button type="submit" disabled={!canSubmit} aria-disabled={!canSubmit}>Save Bank Details</button>
      {msg && <div role="status" style={{ marginTop: 12 }}>{msg}</div>}
    </form>
  );
};
