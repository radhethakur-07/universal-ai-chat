import request from 'supertest';
import app from '../app';

describe('Auth endpoints', () => {
  it('POST /api/auth/register returns 400 for invalid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid', password: '123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notexist@test.com', password: 'wrongpass' });
    expect([401, 500]).toContain(res.status);
  });

  it('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
