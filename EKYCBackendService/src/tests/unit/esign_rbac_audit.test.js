'use strict';
const db = require('../../db');
const { bindElectronicSignature } = require('../../utils/esign');

describe('e-sign binding', () => {
  test('creates unique nonce and signature rows', () => {
    const before = db.prepare('SELECT COUNT(*) as c FROM signatures').get().c;
    const res = bindElectronicSignature({
      userId: 1,
      fullName: 'Test User',
      agree: true,
      entity: 'bank_details',
      payload: { foo: 'bar' }
    });
    expect(res.signature_id).toBeTruthy();
    const after = db.prepare('SELECT COUNT(*) as c FROM signatures').get().c;
    expect(after).toBe(before + 1);
  });
});
