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
    accountNumber.replace(/\s+/g, '') === confirmAccountNumber.replace(/\s+/g, ''), [accountNumber, confirmAccountNumber]);

  const ifscValid = useMemo(() => IFSC_REGEX.test(ifsc), [ifsc]);

  const canSubmit = useMemo(() => match && ifscValid && fullName.trim().length > 0 && agree, [match, ifscValid, fullName, agree]);

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
        agreeESign: agree
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
        helpText="Type your full name to acknowledge and sign this change." />
      <div style={{ marginBottom: 12 }}>
        <label><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I agree and certify the above details are correct.</label>
      </div>
      <button type="submit" disabled={!canSubmit} aria-disabled={!canSubmit}>Save Bank Details</button>
      {msg && <div role="status" style={{ marginTop: 12 }}>{msg}</div>}
    </form>
  );
};
