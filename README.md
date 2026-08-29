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
- [ ] **Phase 4** — Backend Core (Auth, Org, Inventory)
- [ ] **Phase 5** — ML Model Development
- [ ] **Phase 6** — FastAPI Serving Layer
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
| Backend | Node.js + Express, Mongoose |
| Database | MongoDB (Atlas free tier) |
| AI Service | Python + FastAPI |
| ML | Scikit-learn, XGBoost, Pandas, Jupyter |
| Auth | JWT |
| Validation | Zod (backend), Pydantic (AI service) |

See `docs/api-contract.md` for the frozen API contract (schemas + endpoints, finalized in Phase 2).

---

## Repository Structure

```
qulin-organization/
├── backend/
│   ├── scripts/
│   │   └── seed-db.js           # synthetic data seeder — Member 1
│   ├── src/
│   │   ├── config/                # db connection, env loader
│   │   ├── models/                 # Organization, Branch, Ingredient,
│   │   │                           #   Production, Consumption, Waste
│   │   ├── routes/                 # (added Phase 4+)
│   │   ├── controllers/            # (added Phase 4+)
│   │   ├── middleware/             # errorHandler.js
│   │   ├── validators/             # (added Phase 4+)
│   │   ├── services/                # (added Phase 6 — aiClient.js)
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── ai-service/                     # Python/FastAPI AI microservice — Member 2
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/                 # (added Phase 6)
│   │   ├── schemas/                  # (added Phase 6)
│   │   ├── services/                  # (added Phase 6)
│   │   └── rootcause/                  # (added Phase 6)
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── ml/                              # Training pipeline (offline) — Member 2
│   ├── data/
│   │   ├── generate_sample_data.py    # exports MongoDB → dataset.csv
│   │   └── processed/
│   │       └── dataset.csv             # flattened synthetic dataset (150 days)
│   ├── notebooks/
│   │   └── eda.ipynb                   # seasonality + waste correlation analysis
│   ├── preprocessing/                  # (added Phase 5)
│   ├── training/                       # (added Phase 5)
│   ├── evaluation/                     # (added Phase 5)
│   └── models/                         # trained .pkl files (added Phase 5)
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

> **Windows DNS note:** if MongoDB connections fail with `ECONNREFUSED` / `querySrv` errors, your network's default DNS resolver may not support the SRV record lookups Atlas's `mongodb+srv://` format relies on. Fix: set your network adapter's DNS to `8.8.8.8` / `8.8.4.4` (Google DNS), then `ipconfig /flushdns` and retry. Hit and resolved during Phase 3 — ask a team member if it recurs.

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

Edit `backend/.env` with your own values:

```
PORT=5000
NODE_ENV=development
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_KEY=<shared secret — must match ai-service/.env>
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

### 3. Seed the database (synthetic demo data)

Generates ~150 days of realistic Production/Consumption/Waste records for one demo Organization/Branch, including the Friday-rice overproduction pattern used as the Phase 9/18 acceptance test scenario.

```bash
# from backend/
npm run seed
```

Expected output ends with:
```
✅ Seed complete.
...
Reproduced pattern: Rice / Friday / Lunch → preparedQty=500 constant, consumedQty varies (~430 avg), high overproduction waste.
```

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
AI_SERVICE_KEY=<shared secret — must match backend/.env exactly>
MONGO_URI=<same MongoDB Atlas connection string as backend/.env>
```

Run the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Verify:

```bash
curl localhost:8000/health
# Expected: {"status":"ok","service":"qulin-ai-service"}
```

> **Important:** `AI_SERVICE_KEY` must be identical in both `backend/.env` and `ai-service/.env`. This is the shared internal secret the backend uses to authenticate calls to the AI service (used starting Phase 6). It is never committed to git — share it directly between team members.

### 5. Export dataset + run EDA (`ml/`)

Requires the database to be seeded first (Step 3).

```bash
# from repo root, with ai-service/.venv activated
python ml/data/generate_sample_data.py
```

Produces `ml/data/processed/dataset.csv` — one row per `(item, meal, date)` with columns:
`date, day_of_week, item, meal, prepared_qty, consumed_qty, waste_qty, waste_reason, stock_level, days_to_expiry, customer_count`

Open `ml/notebooks/eda.ipynb` in VS Code (select the `ai-service/.venv` kernel) to view day-of-week seasonality and prepared/waste correlation analysis.

---

## Git Workflow

```
main            (protected — deploy-ready only)
  └── develop   (protected — integration branch, default branch)
       ├── feature/m1-...
       ├── feature/m2-...
       └── integration/phase-N   (short-lived, joint work — Phases 9-10)
```

- All work happens on `feature/<m1|m2>-<short-desc>` branches, branched from `develop`.
- PRs target `develop`, require 1 approval from the other member, and must state which phase/issue they close.
- `develop → main` only at the end of a fully integration-tested phase, via its own reviewed PR.
- Commit convention: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Never edit the other member's owned files/folders (see Ownership Boundaries below). The only shared files (`docs/api-contract.md`, `frontend/src/shared/*`) follow an additive-only rule — structural changes go through their own small, fast-reviewed PR.

---

## Ownership Boundaries (do not cross without a PR + review)

| Folder | Owner |
|---|---|
| `backend/` | Member 1 |
| `ai-service/` | Member 2 |
| `ml/` | Member 2 |
| `frontend/src/modules/operations/` | Member 1 |
| `frontend/src/modules/dashboard/` | Member 2 |
| `frontend/src/auth/` | Member 1 |
| `frontend/src/shared/` | Both — additive only |
| `docs/api-contract.md` | Both — frozen after Phase 2, changes via reviewed PR only |

---

## Data Model

Six MongoDB collections currently defined (`backend/src/models/`), matching the frozen contract in `docs/api-contract.md`:

`Organization → Branch → Ingredient / Production / Consumption / Waste`

Three more collections (`User`, `Recommendation`, `Outcome`) are documented in the contract and will be implemented in Phase 4 and Phase 9 respectively.

---

## Documentation

- `docs/api-contract.md` — frozen API contract between frontend/backend/AI service (Phase 2)
- `ml/notebooks/eda.ipynb` — exploratory data analysis (Phase 3)
- `ml/evaluation/metrics_report.md` — model training metrics (added Phase 5)
- `ml/models/*/model_card.md` — per-model documentation (added Phase 5)

---

## License

MIT (default — update if your institution requires otherwise).