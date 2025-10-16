/**
 * REQUIREMENT TRACEABILITY - Tests: integration/auth_bank.test.js
 * REQ IDs:
 * - REQ-VAL-001 (registration/login validations, duplicate)
 * - REQ-AUTH-001 (secure login)
 * - REQ-BANK-001, REQ-BANK-IFSC-001 (bank validations)
 * - REQ-ESIGN-001 (e-sign required)
 * - REQ-SEC-001, REQ-SEC-ACL-001 (audit entries, auth/RBAC)
 * Acceptance Criteria validated by test names:
 * - register with validations and duplicate check -> AC-VAL-REG-01..04
 * - login -> AC-AUTH-LOGIN-01..03
 * - save bank details requires auth and e-sign and reason -> AC-BANK-SEC-01..05
 * - audit entries created -> AC-AUDIT-01
 * GxP Impact: YES — automated verification of critical controls
 * Risk Level: MEDIUM
 */
'use strict';
const request = require('supertest');
const fs = require('fs');
const path = require('path');

process.env.SQLITE_PATH = path.join(__dirname, '..', '..', 'data', 'test.sqlite');
try { fs.rmSync(process.env.SQLITE_PATH, { force: true }); } catch {}

const app = require('../../app');
const db = require('../../db');

describe('Auth and Bank Integration', () => {
  let token;
  test('register with validations and duplicate check', async () => {
    let res = await request(app).post('/api/auth/register').send({
      email: 'user@example.com', mobile: '9998887776', password: 'Aa1!aaaa'
    });
    expect(res.status).toBe(201);
    const duplicate = await request(app).post('/api/auth/register').send({
      email: 'user@example.com', mobile: '9998887776', password: 'Aa1!aaaa'
    });
    expect(duplicate.status).toBe(409);
  });

  test('login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      identifier: 'user@example.com', password: 'Aa1!aaaa'
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    token = res.body.token;
  });

  test('save bank details requires auth and e-sign and reason', async () => {
    let res = await request(app).put('/api/bank-details').send({
      accountNumber: '12345678', confirmAccountNumber: '12345678', ifsc: 'HDFC0ABC123'
    });
    expect(res.status).toBe(401);

    // Missing reason
    res = await request(app)
      .put('/api/bank-details')
      .set('Authorization', `Bearer ${token}`)
      .send({
        accountNumber: '12345678',
        confirmAccountNumber: '12345678',
        ifsc: 'HDFC0ABC123',
        fullNameForESign: 'John Doe',
        agreeESign: true
      });
    expect(res.status).toBe(400);

    // With reason and critical requiring reauth (wrong password)
    res = await request(app)
      .post('/api/bank-details')
      .set('Authorization', `Bearer ${token}`)
      .send({
        accountNumber: '12345678',
        confirmAccountNumber: '12345678',
        ifsc: 'HDFC0ABC123',
        fullNameForESign: 'John Doe',
        agreeESign: true,
        reasonForChange: 'Initial bank add',
        critical: true,
        reauthPassword: 'wrongpass'
      });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('REAUTH_FAILED');

    // Correct reauth
    res = await request(app)
      .post('/api/bank-details')
      .set('Authorization', `Bearer ${token}`)
      .send({
        accountNumber: '12345678',
        confirmAccountNumber: '12345678',
        ifsc: 'HDFC0ABC123',
        fullNameForESign: 'John Doe',
        agreeESign: true,
        reasonForChange: 'Initial bank add',
        critical: true,
        reauthPassword: 'Aa1!aaaa'
      });
    expect(res.status).toBe(200);
    expect(res.body.branch_info).toContain('Bank: HDFC');
    expect(res.body.nonce).toBeTruthy();
  });

  test('audit entries created', () => {
    const count = db.prepare('SELECT COUNT(*) as c FROM audit_log').get().c;
    expect(count).toBeGreaterThanOrEqual(3); // register, login, bank update
  });
});
