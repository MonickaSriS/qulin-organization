import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Branch from '../src/models/Branch.js';
import Ingredient from '../src/models/Ingredient.js';

let token;
let orgId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const res = await request(app).post('/api/v1/auth/register').send({
    name: 'Inventory Tester',
    email: 'inventory@test.qulin.local',
    password: 'password123',
    orgName: 'Test Org Inventory',
  });
  token = res.body.token;
  orgId = res.body.user.orgId;
});

afterAll(async () => {
  await Ingredient.deleteMany({ orgId });
  await User.deleteMany({ email: 'inventory@test.qulin.local' });
  await Organization.deleteMany({ _id: orgId });
  await Branch.deleteMany({ orgId });
  await mongoose.disconnect();
});

describe('Inventory CRUD', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/v1/inventory');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  let createdId;

  it('creates an ingredient', async () => {
    const res = await request(app)
      .post('/api/v1/inventory')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Rice', unit: 'kg', currentStock: 80, costPerUnit: 55 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Rice');
    createdId = res.body._id;
  });

  it('lists ingredients for the org', async () => {
    const res = await request(app)
      .get('/api/v1/inventory')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((i) => i.name === 'Rice')).toBe(true);
  });

  it('updates an ingredient', async () => {
    const res = await request(app)
      .put(`/api/v1/inventory/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentStock: 60 });

    expect(res.status).toBe(200);
    expect(res.body.currentStock).toBe(60);
  });

  it('rejects invalid update payloads', async () => {
    const res = await request(app)
      .put(`/api/v1/inventory/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentStock: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('deletes an ingredient', async () => {
    const res = await request(app)
      .delete(`/api/v1/inventory/${createdId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for a deleted/nonexistent ingredient', async () => {
    const res = await request(app)
      .put(`/api/v1/inventory/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ currentStock: 10 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
