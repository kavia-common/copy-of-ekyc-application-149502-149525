'use strict';
/**
 * REQUIREMENT TRACEABILITY - Tests: integration/bank_happy_path.test.js
 * Validates end-to-end happy path for PUT /api/bank-details and subsequent GET.
 * REQ IDs: REQ-BANK-001, REQ-BANK-IFSC-001, REQ-ESIGN-001, REQ-SEC-ACL-001
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');

process.env.SQLITE_PATH = path.join(__dirname, '..', '..', 'data', 'test_bank_happy.sqlite');
try { fs.rmSync(process.env.SQLITE_PATH, { force: true }); } catch {}

const app = require('../../app');

describe('Bank details happy path persistence', () => {
  let token;
  test('register and login', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'happypath@example.com',
      mobile: '9000000000',
      password: 'Aa1!aaaa'
    });
    expect(reg.status).toBe(201);
    const login = await request(app).post('/api/auth/login').send({
      identifier: 'happypath@example.com',
      password: 'Aa1!aaaa'
    });
    expect(login.status).toBe(200);
    token = login.body.token;
    expect(token).toBeTruthy();
  });

  test('PUT then GET returns current state', async () => {
    const put = await request(app)
      .put('/api/bank-details')
      .set('Authorization', `Bearer ${token}`)
      .send({
        accountNumber: '12345678',
        confirmAccountNumber: '12345678',
        ifsc: 'HDFC0ABC123',
        fullNameForESign: 'Happy User',
        agreeESign: true,
        reasonForChange: 'Initial add',
        critical: false
      });
    expect(put.status).toBe(200);
    expect(put.body).toHaveProperty('id');
    expect(put.body.ifsc).toBe('HDFC0ABC123');
    expect(put.body).toHaveProperty('nonce');

    const get = await request(app)
      .get('/api/bank-details')
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body).not.toBeNull();
    expect(get.body.ifsc).toBe('HDFC0ABC123');
    expect(get.body).toHaveProperty('account_number', '12345678');
  });
});
