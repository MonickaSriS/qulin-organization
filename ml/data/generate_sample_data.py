"""
QULIN — Dataset Export Script
Owner: Member 2

Connects to the same MongoDB used by Member 1's seed-db.js and flattens
Production + Consumption + Waste into a single CSV matching the column
spec agreed in the Phase 3 roadmap:

    date, day_of_week, item, meal, prepared_qty, consumed_qty,
    waste_qty, waste_reason, stock_level, days_to_expiry, customer_count

Usage:
    pip install pymongo pandas python-dotenv
    python ml/data/generate_sample_data.py

Requires a MONGO_URI in ai-service/.env (or ml/.env — see note below).
"""

import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load MONGO_URI — reuse backend's .env value if you have access to it,
# or add MONGO_URI to ai-service/.env with the same Atlas connection string.
load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / "ai-service" / ".env")

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError(
        "MONGO_URI not found. Add it to ai-service/.env "
        "(same Atlas connection string Member 1 is using)."
    )

DB_NAME = "qulin_dev"  # matches the database name in backend/.env's MONGO_URI


def fetch_collections():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    production = list(db.productions.find({}))
    consumption = list(db.consumptions.find({}))
    waste = list(db.wastes.find({}))
    ingredients = list(db.ingredients.find({}))

    client.close()
    return production, consumption, waste, ingredients


def build_dataset(production, consumption, waste, ingredients):
    prod_df = pd.DataFrame(production)
    cons_df = pd.DataFrame(consumption)
    waste_df = pd.DataFrame(waste)
    ing_df = pd.DataFrame(ingredients)

    # Normalize date to just the date part (strip time) for clean joins
    for df in (prod_df, cons_df, waste_df):
        df["date"] = pd.to_datetime(df["date"]).dt.normalize()

    # Merge production + consumption on (item, meal, date)
    merged = pd.merge(
        prod_df[["item", "meal", "date", "preparedQty"]],
        cons_df[["item", "meal", "date", "consumedQty", "customerCount"]],
        on=["item", "meal", "date"],
        how="outer",
    )

    # Waste is recorded per (item, date) — not per meal — so aggregate and
    # left-join; days/items with no waste record get 0 / "none"
    waste_agg = (
        waste_df.groupby(["item", "date"])
        .agg(waste_qty=("wasteQty", "sum"), waste_reason=("reason", lambda x: x.mode()[0] if not x.empty else "none"))
        .reset_index()
    )

    merged = pd.merge(merged, waste_agg, on=["item", "date"], how="left")
    merged["waste_qty"] = merged["waste_qty"].fillna(0)
    merged["waste_reason"] = merged["waste_reason"].fillna("none")

    # Attach current stock + expiry from Ingredient (static snapshot — acceptable
    # for a first-pass dataset; a production system would need daily stock history)
    ing_lookup = ing_df.set_index("name")[["currentStock", "expiryDate"]]
    merged["stock_level"] = merged["item"].map(ing_lookup["currentStock"])
    merged["expiryDate"] = merged["item"].map(ing_lookup["expiryDate"])
    merged["days_to_expiry"] = (
        pd.to_datetime(merged["expiryDate"]) - merged["date"]
    ).dt.days
    merged = merged.drop(columns=["expiryDate"])

    merged["day_of_week"] = merged["date"].dt.day_name()

    # Final column order matching the doc's Phase 3 spec exactly
    final = merged[
        [
            "date", "day_of_week", "item", "meal",
            "preparedQty", "consumedQty", "waste_qty", "waste_reason",
            "stock_level", "days_to_expiry", "customerCount",
        ]
    ].rename(
        columns={
            "preparedQty": "prepared_qty",
            "consumedQty": "consumed_qty",
            "customerCount": "customer_count",
        }
    )

    return final.sort_values(["date", "item", "meal"]).reset_index(drop=True)


def main():
    print("Connecting to MongoDB and fetching collections...")
    production, consumption, waste, ingredients = fetch_collections()
    print(f"Fetched: {len(production)} production, {len(consumption)} consumption, "
          f"{len(waste)} waste, {len(ingredients)} ingredient records.")

    df = build_dataset(production, consumption, waste, ingredients)

    out_path = Path(__file__).resolve().parent / "processed" / "dataset.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)

    print(f"\n✅ Dataset written to {out_path}")
    print(f"Rows: {len(df)}")
    print(f"Null check:\n{df.isnull().sum()}")
    print(f"\nWaste reconciliation check (first 5 rows):")
    print(df.assign(check=df["prepared_qty"] - df["consumed_qty"]).head())


if __name__ == "__main__":
    main()