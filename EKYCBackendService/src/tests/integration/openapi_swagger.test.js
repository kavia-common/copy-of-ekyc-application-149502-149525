'use strict';
/**
 * REQUIREMENT TRACEABILITY - Tests: integration/openapi_swagger.test.js
 * Validates that /openapi.json serves the YAML-converted OpenAPI with populated paths,
 * and /docs (Swagger UI) is reachable. Ensures Swagger shows all operations.
 * REQ IDs: NONFUNC-API-DOCS
 */
const request = require('supertest');
const app = require('../../app');

describe('OpenAPI and Swagger UI exposure', () => {
  test('GET /openapi.json returns spec with populated paths and servers', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body).toHaveProperty('paths');
    expect(Object.keys(res.body.paths || {}).length).toBeGreaterThan(0);
    expect(res.body.paths).toHaveProperty('/api/auth/register');
    expect(res.body.paths).toHaveProperty('/api/auth/login');
    expect(res.body.paths).toHaveProperty('/api/bank-details');
    expect(res.body).toHaveProperty('servers');
    expect(Array.isArray(res.body.servers)).toBe(true);
  });

  test('GET /docs (Swagger UI) is reachable', async () => {
    const res = await request(app).get('/docs');
    // Swagger UI serves HTML
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });
});
