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
- [~] **Phase 5** — ML Model Development *(in progress)*
  - [x] Member 1 — Production/Consumption/Waste CRUD
  - [ ] Member 2 — Demand + Waste-Risk model training
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
| Backend | Node.js + Express, Mongoose, JWT, bcrypt, Zod |
| Database | MongoDB (Atlas free tier) |
| AI Service | Python + FastAPI |
| ML | Scikit-learn, XGBoost, Pandas, Jupyter |
| Testing | Jest + Supertest (backend), Pytest (AI service) |

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
│   │   ├── config/                   # db.js (Mongo connection)
│   │   ├── models/                    # Organization, Branch, User, Ingredient,
│   │   │                              #   Production, Consumption, Waste
│   │   ├── routes/                    # auth, inventory, production, consumption, waste
│   │   ├── controllers/               # auth, inventory, production, consumption, waste
│   │   ├── middleware/                # auth.js (JWT verify), errorHandler.js
│   │   ├── validators/                # auth, inventory, production, consumption, waste (Zod)
│   │   ├── utils/                      # AppError.js, asyncHandler.js
│   │   ├── services/                   # (added Phase 6 — aiClient.js)
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── inventory.test.js
│   │   └── ops.test.js               # production, consumption, waste
│   ├── package.json
│   └── .env.example
│
├── ai-service/                        # Python/FastAPI AI microservice — Member 2
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/                    # (added Phase 6)
│   │   ├── schemas/                     # (added Phase 6)
│   │   ├── services/                     # (added Phase 6)
│   │   └── rootcause/                     # (added Phase 6)
│   ├── tests/
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
│   ├── preprocessing/                       # (in progress — Phase 5, Member 2)
│   ├── training/                            # (in progress — Phase 5, Member 2)
│   ├── evaluation/                          # (in progress — Phase 5, Member 2)
│   └── models/                              # trained .pkl files (in progress — Phase 5, Member 2)
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

> **Windows DNS note:** if MongoDB connections fail with `ECONNREFUSED` / `querySrv` errors — in the running server *or* in test runs — your network's default DNS resolver may not support the SRV record lookups Atlas's `mongodb+srv://` format relies on.
> 1. Set your network adapter's DNS to `8.8.8.8` / `8.8.4.4` (Google DNS), then `ipconfig /flushdns`.
> 2. This setting can silently revert after reconnecting to Wi-Fi or switching networks — re-check it if the error reappears.
> 3. Verify with: `nslookup -type=SRV _mongodb._tcp.<your-cluster-host>`
>
> Additionally, if the error only appears under `npm run test` (not `npm run dev`), it's likely Jest running multiple test files in parallel workers, each opening a simultaneous SRV lookup. Fixed here by running Jest with `--runInBand` (serial execution) and raising `serverSelectionTimeoutMS`/`testTimeout` — see `backend/jest.config.js` and `backend/src/config/db.js`.

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

Run the automated test suite (runs serially — see DNS note above for why):

```bash
npm run test
```

### 3. Seed the database (synthetic demo data)

```bash
# from backend/
npm run seed
```

Generates ~150 days of realistic Production/Consumption/Waste records, including the Friday-rice overproduction pattern used as the Phase 9/18 acceptance test scenario.

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

### 5. Export dataset + run EDA (`ml/`)

```bash
# from repo root, with ai-service/.venv activated
python ml/data/generate_sample_data.py
```

Open `ml/notebooks/eda.ipynb` in VS Code (select the `ai-service/.venv` kernel) for seasonality and waste-correlation analysis.

---

## API Endpoints (live as of Phase 5)

All under `http://localhost:5000/api/v1`. Full contract in `docs/api-contract.md`.

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/auth/register` | POST | No | Creates Organization + default Branch + admin User |
| `/auth/login` | POST | No | Returns JWT |
| `/inventory` | GET | JWT | Org-scoped list |
| `/inventory` | POST | JWT | Create ingredient |
| `/inventory/:id` | PUT | JWT | Update ingredient |
| `/inventory/:id` | DELETE | JWT | Delete ingredient |
| `/production` | GET | JWT | Filter by `branchId`, `date`, `meal` |
| `/production` | POST | JWT | Log prepared quantity |
| `/consumption` | GET | JWT | Filter by `branchId`, `date`, `meal` |
| `/consumption` | POST | JWT | Log consumed quantity + customer count |
| `/waste` | GET | JWT | Filter by `branchId`, `date` |
| `/waste` | POST | JWT | Log wasted quantity + reason |

> Production/Consumption/Waste are append-only logs (GET + POST only) per the frozen contract — no PUT/DELETE. If correction of mis-entered logs becomes a real requirement, that's a scoped contract-change PR, not an ad-hoc addition.

### Testing the API manually

A Postman collection (`QULIN_API`) is the recommended way to exercise these endpoints during development:

1. Collection variable `baseUrl` = `http://localhost:5000/api/v1`
2. On `register`/`login` requests, add to **Scripts → Post-response**:
   ```javascript
   const data = pm.response.json();
   if (data.token) {
     pm.collectionVariables.set("token", data.token);
   }
   ```
3. On authenticated requests, set header `Authorization: Bearer {{token}}`

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
- PRs target `develop`, require 1 approval from the other member, and must state which phase/issue they close.
- `develop → main` only at the end of a fully integration-tested phase, via its own reviewed PR.
- Commit convention: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Never edit the other member's owned files/folders (see Ownership Boundaries below). Shared files (`docs/api-contract.md`, `frontend/src/shared/*`) follow an additive-only rule.

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
| `docs/api-contract.md` | Both — frozen after Phase 2, changes via reviewed PR only |

---

## Data Model

Seven MongoDB collections implemented (`backend/src/models/`), matching `docs/api-contract.md`:

`Organization → Branch → User / Ingredient / Production / Consumption / Waste`

Two more (`Recommendation`, `Outcome`) are documented in the contract and will be implemented in Phase 9.

**Auth notes:**
- Registration creates an Organization, a default "Main Branch," and an admin User in one step.
- Passwords hashed with bcrypt (`passwordHash` field has `select: false` — never returned in queries unless explicitly requested).
- JWT payload: `{ id, orgId, branchId, role }`, used to scope every subsequent query to the correct organization (multi-tenant isolation).

---

## Known Issues / Troubleshooting Log

- **MongoDB SRV DNS resolution on Windows:** see the Windows DNS note under Local Setup. Root cause: some ISP/router DNS resolvers don't properly handle the SRV record queries `mongodb+srv://` depends on. Fixed via manual DNS (`8.8.8.8`/`8.8.4.4`) + `--runInBand` for Jest + extended connection timeouts. Recurs if the network changes — re-check DNS settings first if this error reappears.

---

## Documentation

- `docs/api-contract.md` — frozen API contract (Phase 2)
- `ml/notebooks/eda.ipynb` — exploratory data analysis (Phase 3)
- `ml/evaluation/metrics_report.md` — model training metrics (added Phase 5, Member 2 — pending)
- `ml/models/*/model_card.md` — per-model documentation (added Phase 5, Member 2 — pending)

---

## License

MIT (default — update if your institution requires otherwise).