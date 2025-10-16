/**
 * REQUIREMENT TRACEABILITY - Tests: Frontend register_bank.test.tsx
 * REQ IDs:
 * - REQ-VAL-001 (registration validations and guidance)
 * - REQ-BANK-001 (double-entry match visual feedback)
 * Acceptance Criteria validated by test names:
 * - disables submit until valid -> AC-VAL-UI-Disable
 * - shows green tick when account numbers match -> AC-BANK-UI-MatchIndicator
 * GxP Impact: YES — automated verification of UI controls
 * Risk Level: LOW
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Register } from '../pages/Register';
import { BankDetails } from '../pages/BankDetails';

describe('Register form validations', () => {
  test('disables submit until valid', () => {
    render(<Register />);
    const btn = screen.getByRole('button', { name: /create account/i });
    expect(btn).toBeDisabled();
  });
});

describe('Bank details form', () => {
  test('shows green tick when account numbers match', () => {
    render(<BankDetails token="dummy" />);
    const acct1 = screen.getByLabelText(/account number/i) as HTMLInputElement;
    const acct2 = screen.getByLabelText(/re-enter account number/i) as HTMLInputElement;
    fireEvent.change(acct1, { target: { value: '12345678' } });
    fireEvent.change(acct2, { target: { value: '12345678' } });
    expect(screen.getByLabelText('match-indicator')).toBeInTheDocument();
  });
});
