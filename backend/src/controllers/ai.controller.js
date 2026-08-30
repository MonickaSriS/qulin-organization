import Ingredient from '../models/Ingredient.js';
import Production from '../models/Production.js';
import Consumption from '../models/Consumption.js';
import Recommendation from '../models/Recommendation.js';
import { predictDemand, predictWasteRisk, getRecommendation } from '../services/aiClient.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

/**
 * Computes the feature bundle for one item on a given date, using the
 * org's recent Production/Consumption history. This mirrors the feature
 * engineering logic in ml/preprocessing/features.py closely enough for
 * live inference, though it's a simplified real-time version (no full
 * historical rolling window recomputation on every request).
 */
async function computeFeatures(orgId, branchId, item, date) {
  const targetDate = new Date(date);
  const sevenDaysAgo = new Date(targetDate);
  sevenDaysAgo.setDate(targetDate.getDate() - 7);

  const recentConsumption = await Consumption.find({
    orgId, branchId, item, date: { $gte: sevenDaysAgo, $lt: targetDate },
  });
  const rollingAvg = recentConsumption.length
    ? recentConsumption.reduce((sum, r) => sum + r.consumedQty, 0) / recentConsumption.length
    : 0;

  const lastWeekSameDay = new Date(targetDate);
  lastWeekSameDay.setDate(targetDate.getDate() - 7);
  const lastWeekProd = await Production.findOne({
    orgId, branchId, item,
    date: { $gte: lastWeekSameDay, $lt: new Date(lastWeekSameDay.getTime() + 86400000) },
  });

  const ingredient = await Ingredient.findOne({ orgId, branchId, name: item });
  const daysToExpiry = ingredient?.expiryDate
    ? Math.max(0, Math.round((new Date(ingredient.expiryDate) - targetDate) / 86400000))
    : -1;

  const dayOfWeek = (targetDate.getDay() + 6) % 7; // convert JS Sun=0 to Mon=0 convention
  const isWeekend = dayOfWeek >= 5 ? 1 : 0;

  return {
    dayOfWeek,
    isWeekend,
    isHoliday: 0, // real holiday-calendar check could be added here later
    rollingAvg,
    preparedQtyLastWeek: lastWeekProd?.preparedQty ?? 0,
    daysToExpiry,
    stockLevel: ingredient?.currentStock ?? 0,
  };
}

// GET /api/v1/ai/dashboard?branchId=&date=
export const getDashboard = asyncHandler(async (req, res) => {
  const { branchId, date } = req.query;
  if (!branchId || !date) {
    throw new AppError(400, 'VALIDATION_ERROR', 'branchId and date query params are required');
  }

  const ingredients = await Ingredient.find({ orgId: req.user.orgId, branchId });

  const riskList = [];
  const recommendations = [];

  for (const ingredient of ingredients) {
    const features = await computeFeatures(req.user.orgId, branchId, ingredient.name, date);

    const [demandResult, riskResult] = await Promise.all([
      predictDemand({ item: ingredient.name, meal: 'lunch', date, features }),
      predictWasteRisk({ item: ingredient.name, meal: 'lunch', date, features }),
    ]);

    riskList.push({
      item: ingredient.name,
      expectedDemand: demandResult.expectedDemand,
      riskScore: riskResult.riskScore,
      band: riskResult.band,
    });

    // Only fetch a recommendation for elevated-risk items — no point
    // calling /recommend for a comfortably green item every time
    if (riskResult.band !== 'green') {
      const recentFeatureDeltas = {
        preparedQtyTrend: 0, // simplified for now — real trend calc can be refined in Phase 11
        consumedQtyTrend: 0,
        daysToExpiry: features.daysToExpiry,
      };

      const rec = await getRecommendation({
        item: ingredient.name,
        riskScore: riskResult.riskScore,
        band: riskResult.band,
        recentFeatureDeltas,
      });

      const savedRec = await Recommendation.create({
        orgId: req.user.orgId,
        branchId,
        item: ingredient.name,
        date,
        riskScore: riskResult.riskScore,
        riskBand: riskResult.band,
        cause: rec.cause,
        evidence: rec.evidence,
        recommendation: rec.recommendation,
        suggestedQty: rec.suggestedQty,
      });

      recommendations.push(savedRec);
    }
  }

  res.status(200).json({
    riskList,
    recommendations,
    impact: null, // populated once Outcome data exists — Phase 9
  });
});
