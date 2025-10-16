import { apiRegister, apiLogin } from '../services/api';

const originalFetch = global.fetch as any;

describe('API client wiring', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(async (url: string, init?: RequestInit) => {
      const u = String(url);
      if (u.endsWith('/api/auth/register')) {
        const b = JSON.parse(String(init?.body || '{}'));
        expect(b).toEqual({ email: 'e@x.com', mobile: '9999999999', password: 'Aa1!aaaa' });
        return { ok: true, json: async () => ({ id: 1, email: 'e@x.com', mobile: '9999999999' }), status: 201 };
      }
      if (u.endsWith('/api/auth/login')) {
        const b = JSON.parse(String(init?.body || '{}'));
        expect(b).toEqual({ identifier: 'e@x.com', password: 'Aa1!aaaa' });
        return { ok: true, json: async () => ({ token: 't', user: { id: 1, role: 'user' } }), status: 200 };
      }
      return { ok: false, json: async () => ({}), status: 404 };
    }) as any;
  });
  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  test('apiRegister sends correct payload', async () => {
    const res = await apiRegister('e@x.com', '9999999999', 'Aa1!aaaa');
    expect(res).toHaveProperty('id', 1);
  });

  test('apiLogin sends correct payload', async () => {
    const res = await apiLogin('e@x.com', 'Aa1!aaaa');
    expect(res).toHaveProperty('token', 't');
  });
});
