# QULIN — AI-Powered Food Waste Prevention Platform

An AI-powered food waste prevention system for restaurants, cafeterias, hotels, and institutional kitchens. QULIN combines production, consumption, inventory, purchasing, and historical waste data to predict food waste before it happens, identify root causes, and recommend preventive actions — then measures whether those actions actually worked.

**Core loop:** Measure → Predict → Recommend → Act → Measure Impact

---

## Team

| Member | Ownership |
|---|---|
| **Member 1** | Backend (Node/Express/MongoDB), Auth, Org/Branch structure, Inventory/Production/Consumption/Waste CRUD, Operations frontend, AI proxy layer |
| **Member 2** | AI/ML (Python/FastAPI), Demand + Waste-Risk models, Root-cause & Recommendation engine, Dashboard frontend |

---

## Project Status

- [x] **Phase 0** — Project & GitHub Setup
- [x] **Phase 1** — Environment Setup
- [x] **Phase 2** — Data Model & API Contract Design
- [x] **Phase 3** — Dataset Preparation
- [x] **Phase 4** — Backend Core (Auth, Org, Inventory)
- [x] **Phase 5** — ML Model Development
- [x] **Phase 6** — FastAPI Serving Layer *(first full end-to-end integration verified)*
- [ ] **Phase 7** — Frontend: Operations Module
- [ ] **Phase 8** — Frontend: Dashboard Module
- [ ] **Phase 9** — Outcome Logging & Feedback Loop
- [ ] **Phase 10** — Integration & System Testing
- [ ] **Phase 11** — Optimization
- [ ] **Phase 12** — Final Deployment
- [ ] **Phase 13** — Documentation & Demonstration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Recharts |
| Backend | Node.js + Express, Mongoose, JWT, bcrypt, Zod, axios |
| Database | MongoDB (Atlas free tier) |
| AI Service | Python + FastAPI, Pydantic |
| ML | Scikit-learn, XGBoost, Pandas, Joblib, Jupyter |
| Testing | Jest + Supertest (backend), Pytest + httpx2 (AI service) |

See `docs/api-contract.md` for the frozen API contract (schemas + endpoints, finalized in Phase 2).

---

## Repository Structure

```
qulin-organization/
├── backend/
│   ├── jest.config.js
│   ├── scripts/
│   │   └── seed-db.js               # synthetic data seeder — Member 1
│   ├── src/
│   │   ├── env.js                    # loads .env — MUST be the first import in server.js (see note below)
│   │   ├── config/                   # db.js (Mongo connection)
│   │   ├── models/                    # Organization, Branch, User, Ingredient, Production,
│   │   │                              #   Consumption, Waste, Recommendation
│   │   ├── routes/                    # auth, inventory, production, consumption, waste, ai
│   │   ├── controllers/               # auth, inventory, production, consumption, waste, ai
│   │   ├── middleware/                # auth.js (JWT verify), errorHandler.js
│   │   ├── validators/                # auth, inventory, production, consumption, waste (Zod)
│   │   ├── utils/                      # AppError.js, asyncHandler.js
│   │   ├── services/                   # aiClient.js — the ONLY file that calls FastAPI
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── inventory.test.js
│   │   ├── ops.test.js               # production, consumption, waste
│   │   └── fixtures/
│   │       └── mockAiResponses.json   # mock FastAPI responses for offline proxy testing
│   ├── package.json
│   └── .env.example
│
├── ai-service/                        # Python/FastAPI AI microservice — Member 2
│   ├── app/
│   │   ├── main.py                     # loads .env, loads models at startup, mounts routers
│   │   ├── schemas/
│   │   │   └── predict.py               # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── security.py               # internal shared-key auth dependency
│   │   │   ├── model_loader.py            # loads .pkl models once at startup
│   │   │   └── feature_mapper.py          # named fields → ordered feature vector
│   │   ├── rootcause/
│   │   │   └── rules.py                   # root-cause + recommendation rule engine
│   │   └── routers/
│   │       ├── demand.py
│   │       ├── waste_risk.py
│   │       └── recommend.py
│   ├── tests/
│   │   └── test_predict.py
│   ├── requirements.txt
│   └── .env.example
│
├── ml/                                 # Training pipeline (offline) — Member 2
│   ├── data/
│   │   ├── generate_sample_data.py        # exports MongoDB → dataset.csv
│   │   └── processed/
│   │       └── dataset.csv                 # flattened synthetic dataset (150 days)
│   ├── notebooks/
│   │   └── eda.ipynb                        # seasonality + waste correlation analysis
│   ├── preprocessing/
│   │   ├── holidays.json                     # static holiday calendar (is_holiday feature)
│   │   ├── feature_columns.py                 # SHARED contract — imported by training + ai-service
│   │   ├── clean.py                            # data cleaning (drops invalid rows)
│   │   └── features.py                          # feature engineering pipeline
│   ├── training/
│   │   ├── train_demand.py                       # XGBoost regressor — predicts consumed_qty
│   │   └── train_waste_risk.py                    # XGBoost regressor — predicts waste ratio
│   ├── evaluation/
│   │   └── metrics_report.md                       # auto-appended after every training run
│   └── models/
│       ├── demand_model.pkl
│       ├── waste_risk_model.pkl
│       └── model_card.md                             # per-model documentation
│
├── frontend/            # React app (added Phase 7-8) — shared, split by module
├── docs/
│   └── api-contract.md  # frozen API contract (Phase 2)
├── tests/integration/   # end-to-end tests (added Phase 9-10) — both
└── config/               # shared non-secret config — both
```

---

## Local Setup

### Prerequisites

- Node.js LTS
- Python 3.11+
- Git (Git Bash recommended on Windows for shell command compatibility)
- A MongoDB Atlas free-tier cluster (or local MongoDB instance)
- [Postman](https://www.postman.com/) (recommended for manual API testing)

> **Windows DNS note:** if MongoDB connections fail with `ECONNREFUSED` / `querySrv` errors — in the running server, tests, or the AI service export scripts — your network's DNS resolver may not support the SRV record lookups `mongodb+srv://` relies on.
> 1. Set your network adapter's DNS to `8.8.8.8` / `8.8.4.4`, then `ipconfig /flushdns`.
> 2. This can silently revert after reconnecting to Wi-Fi, switching networks, or a reboot — re-check first if the error reappears.
> 3. Verify with: `nslookup -type=SRV _mongodb._tcp.<your-cluster-host>`
> 4. Also confirm the Atlas cluster itself isn't paused (free-tier clusters auto-pause after inactivity).

### 1. Clone the repository

```bash
git clone https://github.com/<your-username-or-org>/qulin-organization.git
cd qulin-organization
git checkout develop
```

### 2. Backend setup (`backend/`)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```
PORT=5000
NODE_ENV=development
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_KEY=<shared secret — must match ai-service/.env EXACTLY, char-for-char>
```

Run the server:

```bash
npm run dev
```

Verify:

```bash
curl localhost:5000/health
# Expected: {"status":"ok","service":"qulin-backend"}
```

Run the automated test suite:

```bash
npm run test
```

### 3. Seed the database (synthetic demo data)

```bash
# from backend/
npm run seed
```

Generates ~150 days of realistic Production/Consumption/Waste records, including the Friday-rice overproduction pattern used as the Phase 9/18 acceptance test scenario.

> **Note:** the AI dashboard's predictions are only meaningful for an org/branch with real historical Production/Consumption data. A freshly registered org with no logged history will correctly predict low/flat demand — that's expected model behavior, not a bug. Use the seeded demo org's branch (see `db.organizations.findOne({name: "QULIN Demo Cafeteria"})`) to see realistic predictions matching the Friday-rice scenario.

### 4. AI service setup (`ai-service/`)

```bash
cd ai-service
python -m venv .venv
source .venv/Scripts/activate      # Windows Git Bash
# source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\Activate.ps1       # Windows PowerShell

pip install -r requirements.txt
cp .env.example .env
```

Edit `ai-service/.env`:

```
PORT=8000
AI_SERVICE_KEY=<shared secret — must match backend/.env EXACTLY, char-for-char>
MONGO_URI=<same MongoDB Atlas connection string as backend/.env>
```

Run the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Console should show `Loaded models from .../ml/models` before `Application startup complete` — if it errors with `FileNotFoundError`, re-run the Phase 5 training scripts first.

Verify:

```bash
curl localhost:8000/health
```

Run the test suite:

```bash
pytest tests/ -v
```

### 5. Export dataset + run EDA (`ml/`)

```bash
# from repo root, with ai-service/.venv activated
python ml/data/generate_sample_data.py
```

Open `ml/notebooks/eda.ipynb` in VS Code (select the `ai-service/.venv` kernel).

### 6. Train the ML models

```bash
cd ml/training
python train_demand.py
python train_waste_risk.py
```

---

## API Endpoints (live as of Phase 6)

All backend endpoints under `http://localhost:5000/api/v1`. Full contract in `docs/api-contract.md`.

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/auth/register` | POST | No | Creates Organization + default Branch + admin User |
| `/auth/login` | POST | No | Returns JWT |
| `/inventory` | GET/POST/PUT/DELETE | JWT | Org-scoped CRUD |
| `/production` | GET/POST | JWT | Append-only log |
| `/consumption` | GET/POST | JWT | Append-only log |
| `/waste` | GET/POST | JWT | Append-only log |
| `/ai/dashboard` | GET | JWT | **New in Phase 6** — orchestrates FastAPI calls, stores `Recommendation` records |

AI service endpoints (internal only — authenticated via `X-Internal-Key` header, never called by end users) under `http://localhost:8000`:

| Endpoint | Method | Notes |
|---|---|---|
| `/predict/demand` | POST | XGBoost regression → `expectedDemand` |
| `/predict/waste-risk` | POST | XGBoost regression → `riskScore` (0-100) + `band` (red/orange/green) |
| `/recommend` | POST | Rule-based root-cause + recommendation engine |

### Testing the API manually

A Postman collection (`QULIN_API`) is the recommended way to exercise these endpoints:

1. Collection variable `baseUrl` = `http://localhost:5000/api/v1`
2. On `register`/`login`, add to **Scripts → Post-response**:
   ```javascript
   const data = pm.response.json();
   if (data.token) pm.collectionVariables.set("token", data.token);
   ```
3. On authenticated backend requests: header `Authorization: Bearer {{token}}`
4. On direct AI-service requests (for debugging only — not part of normal app flow): header `X-Internal-Key: <your AI_SERVICE_KEY>`

FastAPI also auto-generates an interactive tester at `http://localhost:8000/docs` — useful for quick manual checks of `/predict/*` and `/recommend` without Postman.

---

## ML Models

| Model | Target | File |
|---|---|---|
| Demand | `consumed_qty` | `ml/models/demand_model.pkl` |
| Waste-Risk | `waste_qty / prepared_qty` ratio, bucketed into 🔴/🟠/🟢 bands | `ml/models/waste_risk_model.pkl` |

Full details: `ml/evaluation/metrics_report.md`, `ml/models/model_card.md`.

**Root-cause rules** (`ai-service/app/rootcause/rules.py`) are deliberately hand-written thresholds, not a trained model — matching the source doc's framing of root-cause explanations as inspectable pattern logic, not black-box classification. Current rules (checked in order): overproduction (flat prep + dropping demand) → expiry risk (item near spoiling) → elevated risk with unclear driver → no action needed.

---

## Git Workflow

```
main            (protected — deploy-ready only)
  └── develop   (protected — integration branch, default branch)
       ├── feature/m1-...
       ├── feature/m2-...
       └── integration/phase-N   (short-lived, joint work — Phases 9-10)
```

- Work happens on `feature/<m1|m2>-<short-desc>` branches, branched from `develop`.
- PRs target `develop`, require 1 approval from the other member.
- `develop → main` only at the end of a fully integration-tested phase.
- Commit convention: [Conventional Commits](https://www.conventionalcommits.org/).
- Never edit the other member's owned files/folders. Shared files (`docs/api-contract.md`, `frontend/src/shared/*`) follow an additive-only rule.

---

## Ownership Boundaries

| Folder | Owner |
|---|---|
| `backend/` | Member 1 |
| `ai-service/` | Member 2 |
| `ml/` | Member 2 |
| `frontend/src/modules/operations/` | Member 1 |
| `frontend/src/modules/dashboard/` | Member 2 |
| `frontend/src/auth/` | Member 1 |
| `frontend/src/shared/` | Both — additive only |
| `docs/api-contract.md` | Both — frozen after Phase 2 |
| `ml/preprocessing/feature_columns.py` | Member 2 — imported by both training and `ai-service` to prevent column-order drift |

---

## Data Model

Eight MongoDB collections implemented (`backend/src/models/`):

`Organization → Branch → User / Ingredient / Production / Consumption / Waste / Recommendation`

One more (`Outcome`) is documented in the contract and will be implemented in Phase 9.

**Auth:** Registration creates an Organization, default "Main Branch," and admin User in one step. Passwords hashed with bcrypt (`select: false` on `passwordHash`). JWT payload: `{ id, orgId, branchId, role }`.

---

## Known Issues / Troubleshooting Log

- **MongoDB SRV DNS resolution on Windows:** see the Windows DNS note under Local Setup. Recurs when networks change — re-check DNS settings and Atlas cluster status first.
- **ESM import-hoisting bug (fixed, Phase 6):** `aiClient.js` originally baked `process.env.AI_SERVICE_KEY` into a module-level `axios.create()` call. Because ES Modules hoist all static imports to execute before a module's own top-level code, `aiClient.js` (loaded transitively via `app.js`) was evaluated *before* `server.js`'s `dotenv.config()` call ran — capturing `undefined` as the auth header permanently and causing silent `401`s from the AI service. **Fixed** by (1) reading env vars fresh inside each `aiClient.js` function call instead of at module load, and (2) adding `backend/src/env.js` — a side-effect-only module imported as the literal first line of `server.js` — to guarantee env vars load before any other module evaluates. Worth remembering if new modules read `process.env` at their top level.
- **Sentinel-value bug in root-cause rules (fixed, Phase 6):** `daysToExpiry: -1` (meaning "no expiry date on record") was being caught by the expiry-risk rule's `<= EXPIRY_URGENT_DAYS` check, since `-1 <= 3` is true — falsely flagging any ingredient with no expiry date as "about to expire." Fixed by requiring `0 <= days_to_expiry <= EXPIRY_URGENT_DAYS` in `rules.py`.
- **Pytest `TestClient` lifespan (fixed, Phase 6):** `TestClient(app)` instantiated directly (not as a context manager) skips FastAPI's `lifespan` startup event in current Starlette/httpx versions, so `load_models()` never ran during tests. Fixed by wrapping it in a `pytest.fixture` using `with TestClient(app) as client:`.
- **Low `expectedDemand` for new orgs is expected behavior, not a bug** — see note under Local Setup Step 3.

---

## Documentation

- `docs/api-contract.md` — frozen API contract (Phase 2)
- `ml/notebooks/eda.ipynb` — exploratory data analysis (Phase 3)
- `ml/evaluation/metrics_report.md` — model training metrics (Phase 5)
- `ml/models/model_card.md` — per-model documentation (Phase 5)

---

