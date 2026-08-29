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

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  // Clean up only records created by these tests, not the whole seeded dataset
  await User.deleteMany({ email: /@test\.qulin\.local$/ });
  await Organization.deleteMany({ name: /^Test Org/ });
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new admin user and org, returns a token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Admin',
      email: 'admin@test.qulin.local',
      password: 'password123',
      orgName: 'Test Org Alpha',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@test.qulin.local');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.passwordHash).toBeUndefined(); // must never leak
  });

  it('rejects a weak/short password with VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Admin',
      email: 'weak@test.qulin.local',
      password: '123',
      orgName: 'Test Org Beta',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a duplicate email', async () => {
    const payload = {
      name: 'Test Admin',
      email: 'dupe@test.qulin.local',
      password: 'password123',
      orgName: 'Test Org Gamma',
    };
    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/register').send(payload);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_KEY');
  });
});

describe('POST /api/v1/auth/login', () => {
  const credentials = {
    name: 'Login Test',
    email: 'login@test.qulin.local',
    password: 'password123',
    orgName: 'Test Org Delta',
  };

  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(credentials);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: credentials.email,
      password: credentials.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects incorrect password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: credentials.email,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a non-existent email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@test.qulin.local',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
