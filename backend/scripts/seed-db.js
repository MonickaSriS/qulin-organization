/**
 * QULIN — Synthetic Data Seeder
 * Owner: Member 1
 *
 * Generates realistic-but-synthetic Production, Consumption, and Waste records
 * for a single demo Organization/Branch, across a configurable date range.
 *
 * Why synthetic: the source doc gives only an illustrative example (Friday rice),
 * not a real dataset. This script deliberately reproduces that exact pattern
 * (item="Rice", Friday overproduction) so Phase 9/18's acceptance test has a
 * known, reproducible scenario to demonstrate against, while adding realistic
 * day-of-week noise for every other item/day so the ML models (Phase 5) aren't
 * trivially solving data they memorized.
 *
 * Usage:
 *   node scripts/seed-db.js
 *
 * Requires backend/.env to be configured (MONGO_URI) — run from repo root.
 */
import dns from "node:dns";

dns.setServers(["8.8.8.8"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// ---- Import schemas directly (script runs standalone, outside the Express app) ----
import Organization from "../src/models/Organization.js";
import Branch from "../src/models/Branch.js";
import Ingredient from "../src/models/Ingredient.js";
import Production from "../src/models/Production.js";
import Consumption from "../src/models/Consumption.js";
import Waste from "../src/models/Waste.js";

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const DAYS_TO_GENERATE = 150; // within the doc's recommended 90-180 day range
const MEALS = ["breakfast", "lunch", "dinner"];

const ITEMS = [
  { name: "Rice", unit: "kg", costPerUnit: 55, baseDemand: 430, baseNoise: 25 },
  {
    name: "Chicken",
    unit: "kg",
    costPerUnit: 220,
    baseDemand: 180,
    baseNoise: 15,
  },
  {
    name: "Vegetables",
    unit: "kg",
    costPerUnit: 40,
    baseDemand: 150,
    baseNoise: 20,
  },
  { name: "Bread", unit: "kg", costPerUnit: 60, baseDemand: 90, baseNoise: 12 },
  {
    name: "Spinach",
    unit: "kg",
    costPerUnit: 35,
    baseDemand: 60,
    baseNoise: 18,
  },
];

const WASTE_REASONS = [
  "overproduction",
  "spoilage",
  "preparation",
  "plate_waste",
  "damaged",
];

// A handful of injected "surprise" days (per roadmap Section 22 risk mitigation:
// deliberately inject noise/spikes so the model isn't solving a pattern it created itself)
function isSurpriseDay(dateIndex) {
  return dateIndex % 37 === 0; // irregular interval, not tied to day-of-week
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function gaussianNoise(mean, stdDev) {
  // Box-Muller transform for realistic bell-curve noise instead of flat uniform noise
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function dateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// CORE GENERATION LOGIC
// ---------------------------------------------------------------------------
function generateDayRecords(date, dayIndex, orgId, branchId) {
  const dayOfWeek = date.getDay(); // 0=Sunday..6=Saturday
  const isFriday = dayOfWeek === 5;
  const surprise = isSurpriseDay(dayIndex);

  const production = [];
  const consumption = [];
  const waste = [];

  for (const item of ITEMS) {
    for (const meal of MEALS) {
      // Base demand varies slightly by meal (lunch is the busiest, matches doc's example)
      const mealMultiplier =
        meal === "lunch" ? 1.0 : meal === "dinner" ? 0.8 : 0.5;
      let expectedDemand = item.baseDemand * mealMultiplier;

      // Weekend dip for institutional-style kitchens (Sat/Sun lower footfall)
      if (dayOfWeek === 0 || dayOfWeek === 6) expectedDemand *= 0.7;

      // Realistic day-to-day noise
      const actualConsumed = Math.max(
        0,
        Math.round(
          gaussianNoise(expectedDemand, item.baseNoise * mealMultiplier),
        ),
      );

      // --- THE FRIDAY RICE PATTERN (reproduces the doc's Section 3/6 example) ---
      // Kitchen keeps preparing a constant high quantity on Fridays regardless of
      // actual (lower) demand — this is the deliberate overproduction root-cause
      // the AI is supposed to detect later.
      let preparedQty;
      if (item.name === "Rice" && isFriday && meal === "lunch") {
        preparedQty = 500; // constant, doesn't adapt to demand — matches doc exactly
      } else if (surprise) {
        // Injected anomaly day: demand spikes or crashes unexpectedly
        const spike = Math.random() > 0.5;
        preparedQty = Math.round(expectedDemand * (spike ? 1.6 : 0.6));
      } else {
        // Normal days: prep tracks demand reasonably well, with mild overshoot
        preparedQty = Math.round(actualConsumed * randomBetween(1.05, 1.2));
      }

      const wasteQty = Math.max(0, preparedQty - actualConsumed);

      production.push({
        orgId,
        branchId,
        item: item.name,
        meal,
        date,
        preparedQty,
      });

      consumption.push({
        orgId,
        branchId,
        item: item.name,
        meal,
        date,
        consumedQty: actualConsumed,
        customerCount: Math.round(actualConsumed / randomBetween(0.3, 0.5)),
      });

      if (wasteQty > 0) {
        // Reason weighted: constant-prep-on-Friday → overproduction;
        // otherwise distributed across other realistic causes
        let reason;
        if (item.name === "Rice" && isFriday && meal === "lunch") {
          reason = "overproduction";
        } else {
          const r = Math.random();
          reason =
            r < 0.4
              ? "overproduction"
              : r < 0.6
                ? "spoilage"
                : r < 0.8
                  ? "plate_waste"
                  : r < 0.9
                    ? "preparation"
                    : "damaged";
        }

        waste.push({
          orgId,
          branchId,
          item: item.name,
          date,
          wasteQty,
          reason,
        });
      }
    }
  }

  return { production, consumption, waste };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  console.log("Clearing existing demo data...");
  await Promise.all([
    Organization.deleteMany({}),
    Branch.deleteMany({}),
    Ingredient.deleteMany({}),
    Production.deleteMany({}),
    Consumption.deleteMany({}),
    Waste.deleteMany({}),
  ]);

  console.log("Creating demo Organization + Branch...");
  const org = await Organization.create({ name: "QULIN Demo Cafeteria" });
  const branch = await Branch.create({
    orgId: org._id,
    name: "Main Kitchen",
    location: "Chennai, TN",
  });

  console.log("Creating Ingredient records...");
  for (const item of ITEMS) {
    await Ingredient.create({
      orgId: org._id,
      branchId: branch._id,
      name: item.name,
      unit: item.unit,
      currentStock: Math.round(randomBetween(50, 150)),
      costPerUnit: item.costPerUnit,
      purchaseDate: dateNDaysAgo(3),
      expiryDate: dateNDaysAgo(-Math.round(randomBetween(2, 10))), // future date
    });
  }

  console.log(`Generating ${DAYS_TO_GENERATE} days of operational data...`);
  let allProduction = [];
  let allConsumption = [];
  let allWaste = [];

  for (let i = DAYS_TO_GENERATE; i >= 0; i--) {
    const date = dateNDaysAgo(i);
    const dayIndex = DAYS_TO_GENERATE - i;
    const { production, consumption, waste } = generateDayRecords(
      date,
      dayIndex,
      org._id,
      branch._id,
    );
    allProduction.push(...production);
    allConsumption.push(...consumption);
    allWaste.push(...waste);
  }

  console.log(
    `Inserting ${allProduction.length} production, ${allConsumption.length} consumption, ${allWaste.length} waste records...`,
  );
  await Production.insertMany(allProduction);
  await Consumption.insertMany(allConsumption);
  await Waste.insertMany(allWaste);

  console.log("\n✅ Seed complete.");
  console.log(`Organization: ${org.name} (${org._id})`);
  console.log(`Branch: ${branch.name} (${branch._id})`);
  console.log(
    `Date range: ${dateNDaysAgo(DAYS_TO_GENERATE).toDateString()} → ${dateNDaysAgo(0).toDateString()}`,
  );
  console.log(
    "\nReproduced pattern: Rice / Friday / Lunch → preparedQty=500 constant, consumedQty varies (~430 avg), high overproduction waste.",
  );
  console.log(
    "This is the exact scenario used for the Phase 9/18 acceptance test.\n",
  );

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
