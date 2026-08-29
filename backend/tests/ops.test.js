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
import Production from '../src/models/Production.js';
import Consumption from '../src/models/Consumption.js';
import Waste from '../src/models/Waste.js';

let token;
let orgId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const res = await request(app).post('/api/v1/auth/register').send({
    name: 'Ops Tester',
    email: 'ops@test.qulin.local',
    password: 'password123',
    orgName: 'Test Org Ops',
  });
  token = res.body.token;
  orgId = res.body.user.orgId;
});

afterAll(async () => {
  await Production.deleteMany({ orgId });
  await Consumption.deleteMany({ orgId });
  await Waste.deleteMany({ orgId });
  await User.deleteMany({ email: 'ops@test.qulin.local' });
  await Organization.deleteMany({ _id: orgId });
  await Branch.deleteMany({ orgId });
  await mongoose.disconnect();
});

describe('Production', () => {
  it('rejects without a token', async () => {
    const res = await request(app).get('/api/v1/production');
    expect(res.status).toBe(401);
  });

  it('creates a production record', async () => {
    const res = await request(app)
      .post('/api/v1/production')
      .set('Authorization', `Bearer ${token}`)
      .send({ item: 'Rice', meal: 'lunch', date: '2026-08-28', preparedQty: 500 });

    expect(res.status).toBe(201);
    expect(res.body.preparedQty).toBe(500);
  });

  it('rejects a negative preparedQty', async () => {
    const res = await request(app)
      .post('/api/v1/production')
      .set('Authorization', `Bearer ${token}`)
      .send({ item: 'Rice', meal: 'lunch', date: '2026-08-28', preparedQty: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('lists production filtered by date', async () => {
    const res = await request(app)
      .get('/api/v1/production?date=2026-08-28')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('Consumption', () => {
  it('creates a consumption record', async () => {
    const res = await request(app)
      .post('/api/v1/consumption')
      .set('Authorization', `Bearer ${token}`)
      .send({ item: 'Rice', meal: 'lunch', date: '2026-08-28', consumedQty: 430, customerCount: 300 });

    expect(res.status).toBe(201);
    expect(res.body.consumedQty).toBe(430);
  });

  it('rejects an invalid meal enum', async () => {
    const res = await request(app)
      .post('/api/v1/consumption')
      .set('Authorization', `Bearer ${token}`)
      .send({ item: 'Rice', meal: 'brunch', date: '2026-08-28', consumedQty: 430 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Waste', () => {
  it('creates a waste record', async () => {
    const res = await request(app)
      .post('/api/v1/waste')
      .set('Authorization', `Bearer ${token}`)
      .send({ item: 'Rice', date: '2026-08-28', wasteQty: 70, reason: 'overproduction' });

    expect(res.status).toBe(201);
    expect(res.body.reason).toBe('overproduction');
  });

  it('rejects an invalid reason enum', async () => {
    const res = await request(app)
      .post('/api/v1/waste')
      .set('Authorization', `Bearer ${token}`)
      .send({ item: 'Rice', date: '2026-08-28', wasteQty: 70, reason: 'bad_luck' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects zero or negative wasteQty', async () => {
    const res = await request(app)
      .post('/api/v1/waste')
      .set('Authorization', `Bearer ${token}`)
      .send({ item: 'Rice', date: '2026-08-28', wasteQty: 0, reason: 'spoilage' });

    expect(res.status).toBe(400);
  });
});
