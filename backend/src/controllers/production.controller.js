import Production from '../models/Production.js';
import { createProductionSchema } from '../validators/production.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/v1/production?branchId=&date=&meal=
export const listProduction = asyncHandler(async (req, res) => {
  const filter = { orgId: req.user.orgId };
  if (req.query.branchId) filter.branchId = req.query.branchId;
  if (req.query.meal) filter.meal = req.query.meal;
  if (req.query.date) {
    const day = new Date(req.query.date);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    filter.date = { $gte: day, $lt: nextDay };
  }

  const records = await Production.find(filter).sort({ date: -1 });
  res.status(200).json(records);
});

// POST /api/v1/production
export const createProduction = asyncHandler(async (req, res) => {
  const data = createProductionSchema.parse(req.body);

  const record = await Production.create({
    ...data,
    orgId: req.user.orgId,
    branchId: req.user.branchId,
  });
  res.status(201).json(record);
});
