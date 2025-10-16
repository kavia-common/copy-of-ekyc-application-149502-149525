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
