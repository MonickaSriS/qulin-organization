# QULIN — API Contract (v1)

**Status:** Frozen after Phase 2. Any change requires a reviewed PR with explicit sign-off from both members before either side codes against it.

This document is the single source of truth for:
1. Every MongoDB collection schema (owned by Member 1, `backend/src/models/`)
2. Every REST endpoint — backend (Member 1) and AI service (Member 2)
3. The feature-vector contract between `ml/preprocessing/` and `ai-service/`

---

## 1. Data Models (MongoDB / Mongoose)

### 1.1 Organization

```js
{
  _id: ObjectId,
  name: String,          // required
  createdAt: Date,
  updatedAt: Date
}
```

### 1.2 Branch

```js
{
  _id: ObjectId,
  orgId: ObjectId,        // ref: Organization, required
  name: String,           // required
  location: String,       // optional
  createdAt: Date,
  updatedAt: Date
}
```

### 1.3 User

```js
{
  _id: ObjectId,
  orgId: ObjectId,        // ref: Organization, required
  branchId: ObjectId,     // ref: Branch, optional (org-level admins may have none)
  name: String,           // required
  email: String,          // required, unique
  passwordHash: String,   // required, bcrypt hash — never returned in API responses
  role: String,           // enum: "admin" | "manager", default "manager"
  createdAt: Date,
  updatedAt: Date
}
```

### 1.4 Ingredient (Inventory)

```js
{
  _id: ObjectId,
  orgId: ObjectId,          // required
  branchId: ObjectId,       // required
  name: String,             // required, e.g. "Rice"
  unit: String,             // enum: "kg" | "g" | "l" | "ml" | "unit", required
  currentStock: Number,     // required, >= 0
  costPerUnit: Number,      // required, >= 0
  purchaseDate: Date,       // optional — latest purchase
  expiryDate: Date,         // optional
  createdAt: Date,
  updatedAt: Date
}
```

### 1.5 Production

```js
{
  _id: ObjectId,
  orgId: ObjectId,
  branchId: ObjectId,
  item: String,           // ingredient/food item name, required
  meal: String,           // enum: "breakfast" | "lunch" | "dinner" | "snack", required
  date: Date,             // required
  preparedQty: Number,    // required, >= 0
  createdAt: Date,
  updatedAt: Date
}
```

### 1.6 Consumption

```js
{
  _id: ObjectId,
  orgId: ObjectId,
  branchId: ObjectId,
  item: String,
  meal: String,
  date: Date,
  consumedQty: Number,     // required, >= 0
  customerCount: Number,   // optional, >= 0
  createdAt: Date,
  updatedAt: Date
}
```

### 1.7 Waste

```js
{
  _id: ObjectId,
  orgId: ObjectId,
  branchId: ObjectId,
  item: String,
  date: Date,
  wasteQty: Number,       // required, >= 0
  reason: String,         // enum: "overproduction" | "spoilage" | "preparation" | "plate_waste" | "damaged", required
  createdAt: Date,
  updatedAt: Date
}
```

### 1.8 Recommendation

```js
{
  _id: ObjectId,
  orgId: ObjectId,
  branchId: ObjectId,
  item: String,
  date: Date,               // date the recommendation applies to
  riskScore: Number,        // 0-100, from AI service
  riskBand: String,         // enum: "red" | "orange" | "green"
  cause: String,            // short root-cause label, e.g. "overproduction"
  evidence: String,         // human-readable evidence sentence
  recommendation: String,   // human-readable action, e.g. "Reduce Friday rice prep by 10%"
  suggestedQty: Number,     // optional, e.g. suggested prepared quantity
  status: String,           // enum: "pending" | "accepted" | "rejected", default "pending"
  createdAt: Date,
  updatedAt: Date
}
```

### 1.9 Outcome

```js
{
  _id: ObjectId,
  recommendationId: ObjectId,   // ref: Recommendation, required
  orgId: ObjectId,
  branchId: ObjectId,
  actualPrepared: Number,       // required
  actualConsumed: Number,       // required
  actualWaste: Number,          // required (can be derived: prepared - consumed, but stored explicitly for audit)
  impactPercent: Number,        // computed: waste reduction % vs. the pre-recommendation baseline for that item
  createdAt: Date,
  updatedAt: Date
}
```

> **Decision (per Phase 2 session):** `impactPercent` calculation is owned by **the Node backend** (simple arithmetic over Mongo data — see Section 3, `POST /api/v1/outcomes`), not FastAPI. FastAPI only ever returns predictions/recommendations, never post-hoc measurement.

---

## 2. Feature Vector Contract (ML ↔ Serving)

Owned by Member 2. One shared file, `ml/preprocessing/feature_columns.py`, is imported by **both** `ml/training/*` and `ai-service/app/services/*` so column order can never drift between training and inference.

**Feature columns (fixed order):**

```python
FEATURE_COLUMNS = [
    "day_of_week",              # int, 0=Monday..6=Sunday
    "is_weekend",                # int, 0/1
    "is_holiday",                 # int, 0/1
    "rolling_7day_avg_consumption", # float
    "prepared_qty_last_week_same_day", # float
    "days_to_expiry",             # float (large number/-1 if not applicable)
    "current_stock_level",        # float
    "item_encoded",               # int/float (encoding scheme decided by M2, documented in model_card.md)
    "meal_encoded",                # int/float
]
```

Any request to `/predict/demand` or `/predict/waste-risk` must supply values the AI service can map to this exact column order. The AI service performs the mapping internally — callers (the backend) send named fields (see Section 3), not raw arrays.

---

## 3. REST Endpoints

All endpoints versioned under `/api/v1/`. All request/response bodies JSON. All error responses use the shape:

```json
{ "error": { "code": "STRING_CODE", "message": "Human readable message" } }
```

### 3.1 Backend (Node/Express) — Owner: Member 1

| Endpoint | Method | Auth | Request Body | Response Body |
|---|---|---|---|---|
| `/api/v1/auth/register` | POST | No | `{ name, email, password, orgName }` | `{ token, user: {id, name, email, role, orgId} }` |
| `/api/v1/auth/login` | POST | No | `{ email, password }` | `{ token, user: {id, name, email, role, orgId} }` |
| `/api/v1/inventory` | GET | JWT | — (query params: `?branchId=`) | `[ Ingredient ]` |
| `/api/v1/inventory` | POST | JWT | `{ name, unit, currentStock, costPerUnit, purchaseDate?, expiryDate? }` | `Ingredient` |
| `/api/v1/inventory/:id` | PUT | JWT | any subset of Ingredient fields | `Ingredient` |
| `/api/v1/inventory/:id` | DELETE | JWT | — | `{ success: true }` |
| `/api/v1/production` | GET | JWT | query: `?branchId=&date=&meal=` | `[ Production ]` |
| `/api/v1/production` | POST | JWT | `{ item, meal, date, preparedQty }` | `Production` |
| `/api/v1/consumption` | GET | JWT | query: `?branchId=&date=&meal=` | `[ Consumption ]` |
| `/api/v1/consumption` | POST | JWT | `{ item, meal, date, consumedQty, customerCount? }` | `Consumption` |
| `/api/v1/waste` | GET | JWT | query: `?branchId=&date=` | `[ Waste ]` |
| `/api/v1/waste` | POST | JWT | `{ item, date, wasteQty, reason }` | `Waste` |
| `/api/v1/ai/dashboard` | GET | JWT | query: `?branchId=&date=` | `{ riskList: [...], recommendations: [...], impact: {...} }` (backend calls FastAPI internally, see 3.3) |
| `/api/v1/outcomes` | POST | JWT | `{ recommendationId, actualPrepared, actualConsumed, actualWaste }` | `Outcome` (includes computed `impactPercent`) |

### 3.2 AI Service (FastAPI) — Owner: Member 2

Authenticated via internal header `X-Internal-Key: <AI_SERVICE_KEY>` — **not** user JWTs. Only the backend calls these directly; end users never hit port 8000.

| Endpoint | Method | Request Body | Response Body |
|---|---|---|---|
| `/predict/demand` | POST | `{ item, meal, date, dayOfWeek, rollingAvg, ...features }` | `{ item, expectedDemand: Number }` |
| `/predict/waste-risk` | POST | same feature bundle as above | `{ item, riskScore: 0-100, band: "red"\|"orange"\|"green" }` |
| `/recommend` | POST | `{ item, riskScore, band, recentFeatureDeltas }` | `{ item, cause: String, evidence: String, recommendation: String, suggestedQty?: Number }` |

### 3.3 Internal Proxy Flow (`GET /api/v1/ai/dashboard`)

```
Frontend → GET /api/v1/ai/dashboard?branchId=X&date=Y  (JWT auth)
              ↓
Backend (aiClient.js):
  1. Pull today's items needing prediction from Mongo (Inventory + recent Production/Consumption)
  2. POST /predict/demand   → FastAPI  (per item)
  3. POST /predict/waste-risk → FastAPI (per item)
  4. POST /recommend         → FastAPI (per high-risk item)
  5. Store results in Recommendation collection
  6. Compute/attach impact data from existing Outcome records
              ↓
Backend responds to frontend with combined { riskList, recommendations, impact }
```

---

## 4. Error Codes (initial set — extend as needed, via PR)

| Code | Meaning | HTTP Status |
|---|---|---|
| `VALIDATION_ERROR` | Request body failed Zod/Pydantic validation | 400 |
| `UNAUTHORIZED` | Missing/invalid JWT | 401 |
| `FORBIDDEN` | Valid JWT, insufficient role/org scope | 403 |
| `NOT_FOUND` | Resource doesn't exist | 404 |
| `AI_SERVICE_UNAVAILABLE` | Backend couldn't reach FastAPI | 502 |
| `INTERNAL_ERROR` | Unhandled exception | 500 |

---

## 5. Open Decisions Log

Record any contract change here with date + reason, so history is traceable without digging through git blame.

| Date | Change | Reason | Approved By |
|---|---|---|---|
| _(Phase 2 session date)_ | Initial contract frozen | — | M1, M2 |