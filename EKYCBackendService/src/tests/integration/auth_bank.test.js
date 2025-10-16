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

  test('save bank details requires auth and e-sign', async () => {
    let res = await request(app).post('/api/bank-details').send({
      accountNumber: '12345678', confirmAccountNumber: '12345678', ifsc: 'HDFC0ABC123'
    });
    expect(res.status).toBe(401);

    res = await request(app)
      .post('/api/bank-details')
      .set('Authorization', `Bearer ${token}`)
      .send({
        accountNumber: '12345678',
        confirmAccountNumber: '12345678',
        ifsc: 'HDFC0ABC123',
        fullNameForESign: 'John Doe',
        agreeESign: true
      });
    expect(res.status).toBe(200);
    expect(res.body.branch_info).toContain('Bank: HDFC');
  });

  test('audit entries created', () => {
    const count = db.prepare('SELECT COUNT(*) as c FROM audit_trail').get().c;
    expect(count).toBeGreaterThanOrEqual(3); // register, login, bank update
  });
});
