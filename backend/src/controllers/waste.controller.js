import Waste from '../models/Waste.js';
import { createWasteSchema } from '../validators/waste.validator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/v1/waste?branchId=&date=
export const listWaste = asyncHandler(async (req, res) => {
  const filter = { orgId: req.user.orgId };
  if (req.query.branchId) filter.branchId = req.query.branchId;
  if (req.query.date) {
    const day = new Date(req.query.date);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    filter.date = { $gte: day, $lt: nextDay };
  }

  const records = await Waste.find(filter).sort({ date: -1 });
  res.status(200).json(records);
});

// POST /api/v1/waste
export const createWaste = asyncHandler(async (req, res) => {
  const data = createWasteSchema.parse(req.body);

  const record = await Waste.create({
    ...data,
    orgId: req.user.orgId,
    branchId: req.user.branchId,
  });
  res.status(201).json(record);
});
