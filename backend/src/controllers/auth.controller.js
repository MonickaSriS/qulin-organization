import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import Organization from '../models/Organization.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user._id, orgId: user.orgId, branchId: user.branchId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
  };
}

// POST /api/v1/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, orgName } = registerSchema.parse(req.body);

  // First user for a new org becomes admin of that org, with a default
  // branch created so they can start entering data immediately (Org →
  // Branch → Kitchen → Users hierarchy from the source doc, simplified
  // to one default branch per org at signup time — more branches can be
  // added later via a future branch-management endpoint if needed).
  const org = await Organization.create({ name: orgName });
  const branch = await Branch.create({ orgId: org._id, name: 'Main Branch' });

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    orgId: org._id,
    branchId: branch._id,
    name,
    email,
    passwordHash,
    role: 'admin',
  });

  const token = signToken(user);
  res.status(201).json({ token, user: toPublicUser(user) });
});

// POST /api/v1/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  // passwordHash has select:false on the schema — explicitly request it here
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const token = signToken(user);
  res.status(200).json({ token, user: toPublicUser(user) });
});
