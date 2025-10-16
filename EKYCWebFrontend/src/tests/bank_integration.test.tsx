import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BankDetails } from '../pages/BankDetails';

// Simple fetch mock
const originalFetch = global.fetch as any;

describe('BankDetails wiring to API', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(async (url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.endsWith('/api/bank-details') && (!init || init.method === 'GET')) {
        return {
          ok: true,
          json: async () => null,
          status: 200,
        };
      }
      if (u.endsWith('/api/bank-details') && init && init.method === 'PUT') {
        const body = JSON.parse(String(init.body || '{}'));
        // Assert payload keys present
        expect(body).toHaveProperty('accountNumber', '12345678');
        expect(body).toHaveProperty('confirmAccountNumber', '12345678');
        expect(body).toHaveProperty('ifsc', 'HDFC0ABC123');
        expect(body).toHaveProperty('reasonForChange', 'Initial add');
        expect(body).toHaveProperty('fullNameForESign', 'John Doe');
        expect(body).toHaveProperty('agreeESign', true);
        expect(body).toHaveProperty('critical', true);
        expect(body).toHaveProperty('reauthPassword', 'Aa1!aaaa');
        return {
          ok: true,
          json: async () => ({ id: 1, ifsc: 'HDFC0ABC123', branch_info: 'Bank: HDFC, Branch Code: ABC123', signed_at: new Date().toISOString(), nonce: 'n' }),
          status: 200,
        };
      }
      return { ok: false, json: async () => ({}), status: 404 };
    }) as any;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  test('submits correct payload and shows success message', async () => {
    render(<BankDetails token="fake" />);

    fireEvent.change(screen.getByLabelText(/Account Number/i), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText(/Re-enter Account Number/i), { target: { value: '12345678' } });
    fireEvent.change(screen.getByLabelText(/^IFSC$/i), { target: { value: 'HDFC0ABC123' } });
    fireEvent.change(screen.getByLabelText(/Type Full Name as Signature/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Reason for Change/i), { target: { value: 'Initial add' } });
    fireEvent.click(screen.getByLabelText(/Treat as critical change/i)); // enable critical
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Aa1!aaaa' } });
    // consent checkbox
    const consent = screen.getByLabelText(/I agree and certify/i) as HTMLInputElement;
    fireEvent.click(consent);

    const btn = screen.getByRole('button', { name: /Save Bank Details/i });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/Bank details saved/i)).toBeInTheDocument();
    });
  });
});
