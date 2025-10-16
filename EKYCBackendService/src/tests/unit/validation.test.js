'use strict';
const v = require('../../services/validation');

describe('validation service', () => {
  test('email validation', () => {
    expect(v.validateEmail('user@example.com').ok).toBe(true);
    expect(v.validateEmail('').ok).toBe(false);
    expect(v.validateEmail('bad').ok).toBe(false);
    expect(v.validateEmail('a'.repeat(51) + '@x.com').ok).toBe(false);
  });
  test('mobile validation', () => {
    expect(v.validateMobile('1234567890').ok).toBe(true);
    expect(v.validateMobile('123').ok).toBe(false);
  });
  test('password validation', () => {
    expect(v.validatePassword('Aa1!aaaa').ok).toBe(true);
    expect(v.validatePassword('weak').ok).toBe(false);
  });
  test('IFSC validation', () => {
    expect(v.validateIFSC('HDFC0ABC123').ok).toBe(true);
    expect(v.validateIFSC('HDFC0123').ok).toBe(false);
  });
  test('account validation', () => {
    expect(v.validateAccountNumber('12345678', '12345678').ok).toBe(true);
    expect(v.validateAccountNumber('123 456 78', '12345678').ok).toBe(true);
    expect(v.validateAccountNumber('1234567', '1234567').ok).toBe(false);
    expect(v.validateAccountNumber('12345678', '00000000').ok).toBe(false);
  });
});
