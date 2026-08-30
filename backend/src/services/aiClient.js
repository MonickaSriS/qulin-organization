import axios from "axios";

/**
 * IMPORTANT: baseURL/headers are read INSIDE each function call, not baked
 * into a module-level axios.create() config. ES Modules hoist all static
 * imports to run before a module's own top-level code — so if this file
 * is imported (even transitively) before server.js's dotenv.config() call
 * finishes executing, process.env.AI_SERVICE_KEY would be undefined at
 * axios.create() time and get baked in permanently. Reading it fresh on
 * every call sidesteps that ordering issue entirely.
 */
function getClient() {
  return axios.create({
    baseURL: process.env.AI_SERVICE_URL || "http://localhost:8000",
    timeout: 10000,
    headers: { "X-Internal-Key": process.env.AI_SERVICE_KEY },
  });
}

/**
 * Builds the named feature payload the AI service expects (see
 * ai-service/app/schemas/predict.py). Centralized here so both
 * predictDemand and predictWasteRisk send an identical shape.
 */
function buildFeaturePayload({ item, meal, date, features }) {
  return {
    item,
    meal,
    date,
    day_of_week: features.dayOfWeek,
    is_weekend: features.isWeekend,
    is_holiday: features.isHoliday,
    rolling_7day_avg_consumption: features.rollingAvg,
    prepared_qty_last_week_same_day: features.preparedQtyLastWeek,
    days_to_expiry: features.daysToExpiry,
    stock_level: features.stockLevel,
  };
}

export async function predictDemand({ item, meal, date, features }) {
  const payload = buildFeaturePayload({ item, meal, date, features });
  const res = await getClient().post("/predict/demand", payload);
  return res.data; // { item, expectedDemand }
}

export async function predictWasteRisk({ item, meal, date, features }) {
  const payload = buildFeaturePayload({ item, meal, date, features });
  const res = await getClient().post("/predict/waste-risk", payload);
  return res.data; // { item, riskScore, band }
}

export async function getRecommendation({
  item,
  riskScore,
  band,
  recentFeatureDeltas,
}) {
  const res = await getClient().post("/recommend", {
    item,
    riskScore,
    band,
    recentFeatureDeltas,
  });
  return res.data; // { item, cause, evidence, recommendation, suggestedQty }
}
