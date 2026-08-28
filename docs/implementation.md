# QULIN — AI-Powered Food Waste Prevention Platform
## Complete Implementation Roadmap (2-Member Team, VS Code)

---

## 1. Project Understanding

**Problem statement.** Kitchens overproduce food, over-purchase ingredients, and let stock spoil because sales, inventory, production and waste data are kept in disconnected logs. Nobody can answer *"what food is likely to become waste, why, and what should change before it happens?"*

**Objective.** Build a closed-loop system: **Measure → Predict → Recommend → Act → Measure Impact**, so predictions get better over time as real outcomes are logged.

**Functional requirements** (from the doc):
- CRUD for ingredients/inventory (stock, cost, expiry, purchase date)
- Record daily production (food item, quantity, meal, date)
- Record daily consumption/sales (quantity actually consumed/sold, customer count)
- Record waste (quantity + reason: overproduction / spoilage / preparation / plate waste / damaged)
- Demand prediction (expected portions needed, per item/meal/day)
- Waste-risk prediction (probability/score a food item becomes waste, e.g. "Rice: 82% 🔴")
- Root-cause identification (why the risk is high — overproduction vs. demand drop, evidence-based)
- Recommendation engine (concrete action: reduce prep by X%, delay purchase, use near-expiry stock first)
- Outcome logging (manager accepts/rejects recommendation → actual prepared/consumed/wasted recorded)
- Impact dashboard (waste reduction %, cost saved, overproduction trend, prediction accuracy over time)
- Multi-tenant organization structure: Organization → Branch → Kitchen → Users/Managers
- Auth (JWT)

**Non-functional requirements** (implied, not stated numerically in the doc — flagged below as missing): reasonable prediction latency for a dashboard load, data correctness over raw throughput, small team / small-kitchen scale (no stated concurrent-user target, no stated uptime SLA — **not specified in source doc**).

**System architecture** (per doc, Section 10/13): React+TS frontend → Node/Express backend (CRUD, auth, orchestration) → MongoDB (all operational data) → Python/FastAPI AI service (demand model, waste-risk model, root-cause + recommendation logic) → results flow back into backend/dashboard → outcomes are re-logged → feed the next training cycle.

**Hardware components:** **None.** Section 12 of the doc explicitly excludes hardware, smart bins, IoT, and computer vision from v1. This roadmap therefore has **no Phase for hardware/firmware**, and Sections 9/11 of the requested output format are marked N/A with justification, per instruction #12 ("include hardware implementation *if required*" — it is not).

**Dataset requirements:** Historical production, consumption/sales, inventory, waste, and purchase records, ideally with day-of-week/meal/event metadata. **The doc gives an illustrative example (Friday rice) but does not specify a real dataset source, size, or format — this is missing information, addressed in Phase 3.**

**ML/DL models required:** Two predictive layers — (1) demand prediction (regression), (2) waste-risk prediction (regression/classification + score). Root-cause + recommendation are rule-based logic over model outputs and feature deltas, not a separate trained model (the doc's examples are all threshold/pattern explanations, not black-box classifications).

**APIs/interfaces:** REST API between frontend↔backend (Node/Express) and backend↔AI service (FastAPI). JSON over HTTP throughout. No MQTT/serial — those only apply to hardware projects and aren't relevant here.

**Expected final outcome:** A working web app where a manager logs operational data, sees today's waste-risk scores and root causes, gets 2–3 concrete recommendations, acts on them, and later sees a dashboard proving the measured impact — with the AI improving as more outcome data accumulates.

**Explicitly missing from the source doc (I will not invent these):**
- Real dataset source/size (only an illustrative example is given)
- Number of food items / SKUs the pilot kitchen actually tracks
- Target users' device/browser constraints
- Specific accuracy targets or SLAs
- Deployment environment (cloud provider, on-prem, budget)

These are called out again inline wherever they affect a decision, with a reasonable *default* chosen so you can keep moving, clearly marked as a default, not a spec.

---

## 2. Technology Stack Analysis

| Technology | Purpose | Mentioned in Doc? | Required/Optional |
|---|---|---|---|
| React + TypeScript | Frontend UI | Yes (Sec. 10) | Required |
| Node.js + Express | Backend API/orchestration | Yes (Sec. 10) | Required |
| MongoDB | Primary database | Yes (Sec. 10) | Required |
| Python + FastAPI | AI microservice | Yes (Sec. 10) | Required |
| Scikit-learn / XGBoost | ML models (demand, waste-risk) | Yes (Sec. 10) | Required |
| Chart.js / Recharts | Dashboard visualization | Yes (Sec. 10) | Required |
| JWT | Authentication | Yes (Sec. 10) | Required |

**ADDITIONAL TECHNOLOGY (not in the doc, minimal, justified individually):**

| Additional Tech | Why Required | Where Used | Why Stack Alone Insufficient | Mandatory? |
|---|---|---|---|---|
| **Mongoose (ODM)** | Node.js needs a schema layer over MongoDB or every query becomes untyped raw driver code, which is unmaintainable for 8+ collections across 2 people | `backend/src/models/*` | MongoDB driver alone gives no schema validation, no relations helper, no clean model boundaries between two devs | Mandatory |
| **Pandas / NumPy** | Any scikit-learn/XGBoost pipeline needs a dataframe layer to clean and feature-engineer tabular data | `ml/preprocessing/*`, `ai-service/` | scikit-learn/XGBoost consume arrays/dataframes; you cannot feed raw Mongo JSON directly into them | Mandatory |
| **Docker + docker-compose** | Two people need identical local environments (Node + Python + Mongo) without "works on my machine" | root `docker-compose.yml` | Doc doesn't specify deployment tooling at all — this fills that explicit gap (see missing-info note above) | **Optional** — see Phase 12 for a no-Docker fallback |
| **Joblib** | Standard way to persist a trained scikit-learn/XGBoost model to disk for FastAPI to load | `ml/models/*.pkl` | scikit-learn/XGBoost don't have a built-in "export for serving" step otherwise | Mandatory |
| **Zod (or Joi)** | Request-body validation on Express routes | `backend/src/validators/*` | Express has no built-in validation; without it, bad data corrupts your training set (the whole product depends on data quality) | Mandatory |
| **GitHub Actions (CI)** | Automated test runs on PR | `.github/workflows/ci.yml` | Doc doesn't mention CI; added purely to satisfy your own testing/PR-gate requirements (Sec. 14) with 2 devs and no manual QA capacity | Optional but strongly recommended |

Nothing else is introduced. No IoT/MQTT/serial libraries — hardware is explicitly out of scope per the doc.

---

## 3. System Architecture

```
        ┌────────────────────────┐
        │   React + TS Frontend  │  (Vite, JWT stored client-side, Recharts)
        └───────────┬────────────┘
                     │ REST/JSON (HTTPS)
        ┌───────────▼────────────┐
        │  Node.js + Express API │  (Auth, CRUD, orchestration, Mongoose)
        └───────────┬────────────┘
             │                │
   REST/JSON │                │ Mongo Wire Protocol
             │                │
   ┌─────────▼───────┐   ┌────▼─────────┐
   │ Python FastAPI   │   │   MongoDB    │
   │ AI Service       │   │ (all data)   │
   │ - demand model   │   └──────────────┘
   │ - waste-risk     │
   │ - root cause     │
   │ - recommendation │
   └───────┬──────────┘
           │ loads
   ┌───────▼──────────┐
   │ ml/models/*.pkl   │  (trained offline, versioned in repo/artifact store)
   └───────────────────┘
```

Data/decision flow (per doc Section 9, adapted, hardware branch removed):

```
Manager enters data (inventory, production, consumption, waste)
        ↓
MongoDB (historical + live operational data)
        ↓
Node backend calls FastAPI AI service (batch, e.g. nightly + on-demand)
        ↓
AI Engine: Demand Model → Waste-Risk Model → Root-Cause Rules → Recommendation Rules
        ↓
Recommendations stored in MongoDB, shown on dashboard
        ↓
Manager accepts/rejects/acts
        ↓
Actual outcome logged (production/consumption/waste for that date)
        ↓
Impact measurement (predicted vs actual) computed and stored
        ↓
Next training cycle uses accumulated outcome data
```

---

## 4. Repository & GitHub Setup

**Repo name:** `qulin-organization`

**Steps (run once, by Member 1, who becomes the repo owner/admin):**

```bash
# 1. Create repo on GitHub (via web UI): qulin-organization, private, no template
# 2. Clone locally
git clone https://github.com/<org-or-user>/qulin-organization.git
cd qulin-organization

# 3. Base files
echo "# QULIN Organization" > README.md
git add README.md
git commit -m "chore: initial commit"
git branch -M main
git push -u origin main

# 4. Create develop branch (default working branch)
git checkout -b develop
git push -u origin develop
```

**On GitHub → Settings → Branches:**
- Protect `main`: require PR, require 1 review (the other member), no direct pushes, require CI to pass (once Phase 0 CI exists).
- Protect `develop`: require PR, no direct pushes (self-review allowed for a 2-person team, but PR is still mandatory so history stays clean and CI runs).

**`.gitignore`** (Node + Python + env files):
```
node_modules/
.env
.env.local
__pycache__/
*.pyc
.venv/
venv/
dist/
build/
*.pkl
!ml/models/.gitkeep
.DS_Store
*.log
coverage/
.pytest_cache/
```
(`*.pkl` ignored because trained models are binary artifacts — see Phase 5 for how they're actually shared: via a `ml/models/` folder committed selectively with Git, or a release asset, since no model registry is specified in the doc — default: commit small `.pkl` files directly, override the ignore per-file.)

**License:** Not specified in doc — default to MIT if this is an academic/portfolio project (change if your institution requires otherwise).

**Commit convention (Conventional Commits):**
`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:` — e.g. `feat(backend): add inventory CRUD routes`

**Branch naming:** `feature/<member>-<short-desc>` e.g. `feature/m1-inventory-api`, `feature/m2-waste-risk-model`

**Issues / Project board:** Use GitHub Projects (Kanban): columns `Backlog → In Progress → In Review → Done`. One issue per deliverable in the phase tables below (Section 7). Labels: `member1`, `member2`, `backend`, `frontend`, `ml`, `integration`, `bug`, `blocked`.

**Milestones:** One per Phase (Phase 0 … Phase 13 below), due-dated by your own calendar.

**PR policy:** PR into `develop` only. Title = commit-style. Description must state which phase/issue it closes. The *other* member reviews and approves before merge (squash-merge to keep `develop` history linear). `develop` → `main` only at the end of a completed phase, via its own PR, after integration testing (Section 18).

---

## 5. Project Folder Structure

```
qulin-organization/
│
├── README.md                     # setup + run instructions (both, kept current)
├── .gitignore
├── docker-compose.yml            # optional, both agree before adding
├── .github/workflows/ci.yml      # CI (both)
├── docs/                         # architecture notes, API contracts, diagrams (both)
│   ├── api-contract.md
│   └── architecture.png
│
├── backend/                      # OWNER: Member 1 — Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/               # db connection, env loader
│   │   ├── models/                # Mongoose schemas: Org, Branch, User, Ingredient,
│   │   │                          #   Production, Consumption, Waste, Purchase,
│   │   │                          #   Recommendation, Outcome
│   │   ├── routes/                # auth.routes.js, inventory.routes.js,
│   │   │                          #   production.routes.js, consumption.routes.js,
│   │   │                          #   waste.routes.js, ai.routes.js (proxies to FastAPI),
│   │   │                          #   dashboard.routes.js
│   │   ├── controllers/
│   │   ├── middleware/            # auth.js (JWT verify), errorHandler.js
│   │   ├── validators/            # Zod/Joi schemas per route
│   │   ├── services/              # aiClient.js — the ONLY file that calls FastAPI
│   │   └── app.js / server.js
│   ├── tests/
│   ├── package.json
│   └── .env.example
│
├── ai-service/                    # OWNER: Member 2 — Python + FastAPI (serving layer)
│   ├── app/
│   │   ├── main.py                # FastAPI entrypoint
│   │   ├── routers/                # demand.py, waste_risk.py, recommend.py
│   │   ├── schemas/                 # Pydantic request/response models
│   │   ├── services/                # loads ml/models/*.pkl, runs inference
│   │   └── rootcause/               # root-cause + recommendation rule logic
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── ml/                             # OWNER: Member 2 — training pipeline (offline)
│   ├── data/                       # raw/ + processed/ (gitignored except samples/)
│   ├── notebooks/                  # EDA notebooks
│   ├── preprocessing/              # clean.py, features.py
│   ├── training/                   # train_demand.py, train_waste_risk.py
│   ├── evaluation/                 # metrics.py, evaluate.py
│   └── models/                     # exported .pkl + model_card.md per model
│
├── frontend/                       # SHARED, split by sub-folder (see Section 6)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── operations/         # OWNER: Member 1 — inventory/production/
│   │   │   │                       #   consumption/waste entry forms + tables
│   │   │   └── dashboard/          # OWNER: Member 2 — risk scores, root cause,
│   │   │                           #   recommendations, impact charts
│   │   ├── shared/                 # OWNER: BOTH, additive-only (see rule below)
│   │   │   ├── api/                # axios client, typed API functions
│   │   │   ├── components/         # buttons, tables, layout shell
│   │   │   └── types/              # shared TypeScript interfaces (mirrors API contract)
│   │   ├── auth/                   # OWNER: Member 1 — login, JWT storage, route guards
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── tests/
│   └── integration/                 # end-to-end tests, OWNER: both, written together
│       # in Phase 9
│
├── scripts/                         # seed-db.js, generate-sample-data.py — both
└── config/                          # shared config values (non-secret), both
```

**Shared-folder rule (`frontend/src/shared/`, `docs/`, root configs):** additive edits only (add a new file/type/function). If you must *change* an existing shared file, do it in its own tiny PR, tag the other member as reviewer, and merge before either of you builds on top of it that day. This is the only place conflicts can realistically happen — treat it as a lock, not free territory.

---

## 6. Team Responsibility Matrix

| Module | Member | Files/Folders Owned | Dependencies | Deliverable |
|---|---|---|---|---|
| Org/Auth/User model | M1 | `backend/src/models/{Org,Branch,User}.js`, `backend/src/routes/auth.routes.js` | none | Working JWT auth + org/branch hierarchy |
| Inventory CRUD | M1 | `backend/src/{models,routes,controllers}/inventory.*`, `frontend/src/modules/operations/Inventory*` | Auth | Full inventory CRUD, UI |
| Production tracking | M1 | `.../production.*` (both layers) | Auth, Inventory | Log prep quantities, UI |
| Consumption tracking | M1 | `.../consumption.*` | Auth | Log sold/consumed qty, UI |
| Waste tracking | M1 | `.../waste.*` | Auth, Production, Consumption | Log waste + reason, UI |
| AI proxy layer | M1 | `backend/src/services/aiClient.js`, `backend/src/routes/ai.routes.js` | FastAPI contract (Sec. 13) | Backend calls FastAPI, stores results |
| Dataset prep + EDA | M2 | `ml/data/`, `ml/notebooks/` | Sample/seed data from M1's schemas | Clean historical dataset |
| Demand model | M2 | `ml/training/train_demand.py`, `ml/models/demand_model.pkl` | Dataset | Trained + evaluated model |
| Waste-risk model | M2 | `ml/training/train_waste_risk.py`, `ml/models/waste_risk_model.pkl` | Dataset | Trained + evaluated model |
| Root-cause + recommendation logic | M2 | `ai-service/app/rootcause/` | Model outputs | Rule engine producing explanations + actions |
| FastAPI service | M2 | `ai-service/app/` | Trained models | REST endpoints per Section 13 contract |
| Dashboard UI | M2 | `frontend/src/modules/dashboard/*` | AI proxy endpoints (M1) | Risk list, root cause, recommendations, impact charts |
| Shared UI kit / API client | Both (additive) | `frontend/src/shared/*` | — | Reusable components/types |
| Integration tests | Both | `tests/integration/*` | Both services running | End-to-end pass |

No file is ever edited by both members inside the same phase except `docs/api-contract.md`, which is the explicit hand-off document (Section 13) — treat that one file as the single source of truth both sides code against, agreed before either side writes implementation code.

---

## 7. Phase-Wise Implementation Plan

> Each phase lists: Objective · Prerequisites · M1 tasks · M2 tasks · Deliverables · Files created · Dependencies · Expected output · Testing · Git branch · Definition of Done (DoD).

### Phase 0 — Project & GitHub Setup
- **Objective:** Repo, structure, workflow live and usable.
- **Prerequisites:** None.
- **M1:** Create repo, `main`/`develop`, branch protection, `.gitignore`, README skeleton, GitHub Project board + labels + milestones (Phases 0–13 as milestones).
- **M2:** Draft `docs/api-contract.md` skeleton (empty sections for each endpoint, filled in Phase 4–6), review branch protection settings.
- **Deliverables:** Repo live, both members have local clones, board set up.
- **Files:** `README.md`, `.gitignore`, `docs/api-contract.md` (skeleton).
- **Dependencies:** none.
- **Expected output:** `git clone` works for both; pushing directly to `main` is blocked (verify by trying).
- **Testing:** Manual — confirm branch protection blocks a direct push.
- **Branch:** work directly on `develop` for this phase only (no code yet).
- **DoD:** Both members can clone, see the board, and open an issue.

### Phase 1 — Environment Setup
- **Objective:** Both machines can run Node, Python, MongoDB locally.
- **Prerequisites:** Phase 0.
- **M1:** Install Node LTS, MongoDB Community (local or Atlas free tier — **doc doesn't specify hosting, default: MongoDB Atlas free cluster** since it removes local-install friction for a 2-person team), create `backend/` skeleton (`npm init`, install `express mongoose dotenv cors jsonwebtoken bcrypt zod`).
- **M2:** Install Python 3.11+, create `ai-service/` and `ml/` venvs, `pip install fastapi uvicorn scikit-learn xgboost pandas numpy joblib pydantic pytest`, freeze to `requirements.txt`.
- **Deliverables:** `backend/package.json`, `ai-service/requirements.txt`, `.env.example` in both.
- **Files:** `backend/package.json`, `backend/.env.example`, `ai-service/requirements.txt`, `ai-service/.env.example`.
- **Dependencies:** Phase 0.
- **Expected output:** `npm run dev` starts a hello-world Express server on M1's machine; `uvicorn app.main:app --reload` starts a hello-world FastAPI server on M2's machine.
- **Testing:** `curl localhost:5000/health` and `curl localhost:8000/health` both return 200.
- **Branch:** `feature/m1-env-setup`, `feature/m2-env-setup`, merged to `develop` separately.
- **DoD:** Both dev servers boot cleanly on both machines (cross-check by pulling each other's branch once).

### Phase 2 — Data Model & API Contract Design *(replaces the doc's generic "Hardware Setup" phase — N/A here)*
- **Objective:** Agree on every collection schema and every API endpoint shape before coding diverges.
- **Prerequisites:** Phase 1.
- **M1 & M2 together (1 working session):** Fill `docs/api-contract.md` completely — every Mongoose schema field, every REST endpoint (path, method, request body, response body) for both backend and AI service. Use Section 13 of this document as the starting draft.
- **Deliverables:** Frozen `docs/api-contract.md` v1.
- **Files:** `docs/api-contract.md`.
- **Dependencies:** Phase 1.
- **Expected output:** A document neither of you needs to touch again except via a reviewed PR.
- **Testing:** N/A (design artifact).
- **Branch:** `feature/api-contract`, single PR, both approve.
- **DoD:** Contract merged to `develop`; both members can now build independently against it.

### Phase 3 — Dataset Preparation
- **Objective:** Get a realistic historical dataset to train against.
- **Prerequisites:** Phase 2 (schema agreed).
- **M1:** Build `scripts/seed-db.js` that generates synthetic-but-realistic operational records (production/consumption/waste per item/day/meal) matching the agreed schema, seed 90–180 days of data into MongoDB. **Missing-info note:** the doc gives no real dataset — synthetic generation with realistic noise/day-of-week patterns is the pragmatic default; swap in real pilot-kitchen exports later if you get access to any (e.g. public restaurant waste datasets from Kaggle can supplement, but treat as optional enrichment, not a requirement).
- **M2:** Build `ml/data/generate_sample_data.py` (or consume M1's seeded Mongo data via a one-time export) and do EDA in `ml/notebooks/eda.ipynb` — check for day-of-week seasonality, correlation between prep qty and waste, missing values.
- **Deliverables:** Seeded dev database; `ml/data/processed/dataset.csv`.
- **Files:** `scripts/seed-db.js`, `ml/data/generate_sample_data.py`, `ml/notebooks/eda.ipynb`.
- **Dependencies:** Phase 2.
- **Expected output:** A CSV with columns: `date, day_of_week, item, meal, prepared_qty, consumed_qty, waste_qty, waste_reason, stock_level, days_to_expiry, customer_count`.
- **Testing:** Row count sanity check, no nulls in required columns, waste = prepared − consumed reconciles.
- **Branch:** `feature/m1-seed-data`, `feature/m2-eda`.
- **DoD:** Both can point their own pipeline at the same dataset shape.

### Phase 4 — Backend Core (Auth, Org, Inventory)
- **Objective:** Working auth + inventory API.
- **M1 only.** Build `models/{Org,Branch,User,Ingredient}.js`, `routes/auth.routes.js` (register/login, JWT issue/verify middleware), `routes/inventory.routes.js` (CRUD).
- **M2 (parallel, independent):** Start Phase 5 (model training) using the seeded/EDA'd dataset — does not block on M1.
- **Deliverables:** Auth + Inventory endpoints live, testable via Postman/Thunder Client.
- **Files:** as listed in Section 6.
- **Dependencies:** Phase 3 (schema/data present).
- **Expected output:** `POST /auth/register`, `POST /auth/login` → JWT; `GET/POST/PUT/DELETE /inventory` behind auth middleware.
- **Testing:** Jest + Supertest unit tests per route (happy path + 401 without token + validation error).
- **Branch:** `feature/m1-auth-inventory` → PR → `develop`.
- **DoD:** All routes covered by tests, PR merged, reviewed by M2.

### Phase 5 — ML Model Development (Demand + Waste-Risk)
- **Objective:** Two trained, evaluated models saved to disk.
- **M2 only.** See full pipeline in Section 10 below.
- **M1 (parallel):** Build Production/Consumption/Waste CRUD (mirrors Phase 4 pattern) — independent of M2.
- **Deliverables:** `ml/models/demand_model.pkl`, `ml/models/waste_risk_model.pkl`, `ml/evaluation/metrics_report.md`.
- **Dependencies:** Phase 3 dataset.
- **Expected output:** Metrics report with MAE/RMSE (demand) and precision/recall/F1 (waste-risk).
- **Testing:** Train/val/test split evaluation (Section 10).
- **Branch:** `feature/m2-model-training` → PR → `develop`.
- **DoD:** Both `.pkl` files committed, metrics documented, reviewed by M1 (sanity-level review, not ML-expert review).

### Phase 6 — FastAPI Serving Layer
- **Objective:** Models callable over REST.
- **M2 only.** Build `ai-service/app/` per Section 13 contract: `POST /predict/demand`, `POST /predict/waste-risk`, `POST /recommend` (root-cause + recommendation logic reading model output + recent feature deltas).
- **M1 (parallel):** Build `backend/src/services/aiClient.js` + `routes/ai.routes.js` **against the contract, using a mock FastAPI response** (JSON fixture) — no need to wait for M2's real service to be running.
- **Deliverables:** Live FastAPI service; backend proxy layer built against the same contract.
- **Dependencies:** Phase 5 (trained models), Phase 2 (contract).
- **Expected output:** `curl -X POST localhost:8000/predict/waste-risk -d '{...}'` returns a score + factors.
- **Testing:** Pytest per endpoint (schema validation, known-input known-output regression test).
- **Branch:** `feature/m2-fastapi-service`, `feature/m1-ai-proxy`.
- **DoD:** Both merged; **first real integration point** — M1 points `aiClient.js` at M2's running service and confirms the mock fixture matches the real response shape exactly (Section 18 walks this through).

### Phase 7 — Frontend: Operations Module
- **Objective:** Manager-facing data-entry UI.
- **M1 only.** `frontend/src/modules/operations/` — Inventory table+form, Production entry, Consumption entry, Waste entry (with reason dropdown), all calling `backend` (not AI service directly).
- **M2 (parallel):** Start Phase 8.
- **Deliverables:** Working forms + tables, connected to real backend.
- **Dependencies:** Phase 4 (backend routes).
- **Expected output:** A manager can add an ingredient, log today's production/consumption/waste, and see it reflected in a table.
- **Testing:** React Testing Library — form validation, successful submit, error state.
- **Branch:** `feature/m1-frontend-operations`.
- **DoD:** Merged, manually walked through by M2 as reviewer.

### Phase 8 — Frontend: Dashboard Module
- **Objective:** Risk scores, root cause, recommendations, impact charts.
- **M2 only.** `frontend/src/modules/dashboard/` — Waste-risk list (color-coded, per Section 11 mock), root-cause explanation panel, recommendation cards with Accept/Reject, impact charts (Recharts) for waste↓, cost↓, overproduction↓, prediction accuracy.
- **M1 (parallel):** Build `frontend/src/auth/` (login page, JWT storage, protected routes) and polish `shared/components`.
- **Deliverables:** Full dashboard screen matching the doc's Section 11 "one-screen" spec.
- **Dependencies:** Phase 6 (AI endpoints proxied by backend), Phase 4 (auth).
- **Expected output:** Dashboard renders real risk scores from the real model.
- **Testing:** RTL component tests + a manual walk-through against the Section 11 mock.
- **Branch:** `feature/m2-frontend-dashboard`.
- **DoD:** Merged, reviewed by M1.

### Phase 9 — Outcome Logging & Feedback Loop
- **Objective:** Close the loop — accepted recommendations lead to logged actuals, predicted-vs-actual gets measured.
- **Both, split cleanly:** M1 builds `Recommendation`/`Outcome` schema + routes (backend); M2 builds the impact-measurement calculation (`predicted vs actual`, waste-reduction %) as a FastAPI endpoint or a scheduled Node job (**decide in the Phase 2 contract session** who owns the calculation — default: Node backend owns it since it's simple arithmetic over Mongo data, not ML).
- **Deliverables:** Accept/reject on a recommendation writes an `Outcome` record; a later dashboard call recomputes impact.
- **Dependencies:** Phases 6, 8.
- **Expected output:** The Section 6 worked example (500→450 portions, 78.6% waste reduction) reproducible end-to-end in the running app.
- **Testing:** Integration test in `tests/integration/`.
- **Branch:** `feature/m1-outcomes`, `feature/m2-impact-calc`.
- **DoD:** Both merged, integration test passing.

### Phase 10 — Integration & System Testing
See Sections 14/18 in full. **Both**, on branch `integration/phase-10`.

### Phase 11 — Optimization
- **Objective:** Fix slow queries, redundant re-renders, oversized model inference latency.
- **M1:** Mongo indexes on `(org, date)` and `(item, date)`; pagination on list endpoints.
- **M2:** Cache FastAPI predictions for a given day (avoid recomputation on every dashboard refresh); confirm model inference stays well under 1s per request (**doc gives no explicit latency SLA — default target: <500ms per prediction call**, generous for XGBoost on tabular data).
- **Branch:** `feature/m1-perf`, `feature/m2-perf`.

### Phase 12 — Final Deployment
See Section 19.

### Phase 13 — Documentation & Demonstration
- **Both:** Finalize `README.md` (setup, run, architecture diagram), `docs/`, record a demo walkthrough following the Section 6 worked example end-to-end.

---

## 8. Member 1 Detailed Roadmap

| Phase | Task | File/Module | Tech | Input | Output | Depends On | Branch | Testing |
|---|---|---|---|---|---|---|---|---|
| 0 | Repo/board setup | root | GitHub | — | Live repo | — | `develop` | manual |
| 1 | Node env | `backend/` | Node/Express | — | Hello-world server | Ph.0 | `feature/m1-env-setup` | curl /health |
| 2 | Schema/contract session | `docs/api-contract.md` | — | Doc | Frozen contract | Ph.1 | `feature/api-contract` | review |
| 3 | Seed data | `scripts/seed-db.js` | Node/Mongoose | Contract | Seeded Mongo | Ph.2 | `feature/m1-seed-data` | row counts |
| 4 | Auth + Inventory API | `backend/src/{models,routes}/{auth,inventory}.*` | Express/Mongoose/JWT/Zod | Contract | Live endpoints | Ph.3 | `feature/m1-auth-inventory` | Jest/Supertest |
| 5 | Production/Consumption/Waste API | same pattern | Express/Mongoose | Ph.4 pattern | Live endpoints | Ph.4 | `feature/m1-ops-crud` | Jest/Supertest |
| 6 | AI proxy layer | `backend/src/services/aiClient.js`, `routes/ai.routes.js` | Axios/Express | Contract + mock JSON | Proxy endpoints | Ph.2 (parallel to M2 Ph.6) | `feature/m1-ai-proxy` | Jest w/ mocked FastAPI |
| 7 | Operations frontend | `frontend/src/modules/operations/*` | React/TS | Backend API | Working forms/tables | Ph.5 | `feature/m1-frontend-operations` | RTL |
| 8 | Auth frontend + shared UI | `frontend/src/auth/*`, `shared/components` | React/TS | Ph.4 | Login/guard, shared kit | Ph.4 | `feature/m1-auth-frontend` | RTL |
| 9 | Recommendation/Outcome API | `backend/src/models/{Recommendation,Outcome}.js` + routes | Express/Mongoose | Ph.6 | Outcome logging | Ph.6, Ph.8(M2) | `feature/m1-outcomes` | Jest/Supertest |
| 10 | Integration testing | `tests/integration/*` | Jest/Supertest | Full stack | Passing E2E | all above | `integration/phase-10` | integration suite |
| 11 | Backend perf | Mongo indexes, pagination | Mongoose | Ph.10 | Faster queries | Ph.10 | `feature/m1-perf` | load test w/ seeded 180d |
| 12 | Deploy backend | `backend/` deploy config | per Sec.19 | — | Live backend | Ph.11 | `develop`→`main` | smoke test |
| 13 | Docs | README, diagrams | Markdown | — | Final docs | all | `develop`→`main` | peer read |

## 9. Member 2 Detailed Roadmap

| Phase | Task | File/Module | Tech | Input | Output | Depends On | Branch | Testing |
|---|---|---|---|---|---|---|---|---|
| 0 | API contract skeleton | `docs/api-contract.md` | — | — | Draft doc | — | `develop` | — |
| 1 | Python env | `ai-service/`, `ml/` | Python/FastAPI | — | Hello-world server | Ph.0 | `feature/m2-env-setup` | curl /health |
| 2 | Schema/contract session | (joint) | — | Doc | Frozen contract | Ph.1 | `feature/api-contract` | review |
| 3 | Dataset + EDA | `ml/data/`, `ml/notebooks/eda.ipynb` | Pandas | M1's seeded data | Clean dataset | Ph.2 | `feature/m2-eda` | null/row checks |
| 5 | Train demand model | `ml/training/train_demand.py` | scikit-learn/XGBoost | Ph.3 dataset | `demand_model.pkl` | Ph.3 | `feature/m2-model-training` | MAE/RMSE report |
| 5 | Train waste-risk model | `ml/training/train_waste_risk.py` | scikit-learn/XGBoost | Ph.3 dataset | `waste_risk_model.pkl` | Ph.3 | same branch | precision/recall/F1 report |
| 6 | FastAPI serving | `ai-service/app/{routers,services,schemas}` | FastAPI/Pydantic | Ph.5 models, contract | Live `/predict/*`, `/recommend` | Ph.5, Ph.2 | `feature/m2-fastapi-service` | Pytest |
| 6 | Root-cause + recommendation rules | `ai-service/app/rootcause/*` | Python | Model outputs | Explanations + actions | Ph.6 | same branch | Pytest w/ fixtures |
| 8 | Dashboard frontend | `frontend/src/modules/dashboard/*` | React/TS/Recharts | Ph.6 endpoints (via backend) | Risk list, charts | Ph.6, Ph.9(M1 auth) | `feature/m2-frontend-dashboard` | RTL |
| 9 | Impact calculation | Node job or FastAPI endpoint (decide in Ph.2) | Python/Node | Outcome data | Impact % | Ph.9(M1) | `feature/m2-impact-calc` | unit test w/ worked example |
| 10 | Integration testing | `tests/integration/*` | Pytest/Jest | Full stack | Passing E2E | all above | `integration/phase-10` | integration suite |
| 11 | Inference perf + caching | `ai-service/app/services/cache.py` | Python | Ph.10 | <500ms predictions | Ph.10 | `feature/m2-perf` | timing test |
| 12 | Deploy AI service | `ai-service/` deploy config | per Sec.19 | — | Live AI service | Ph.11 | `develop`→`main` | smoke test |
| 13 | Docs | model cards, README | Markdown | — | Final docs | all | `develop`→`main` | peer read |

---

## 10. ML/DL Training Pipeline

### Dataset
- **Source:** Phase-3 synthetic-but-realistic seed data (default, since the doc specifies none); swap in real records if a pilot kitchen shares exports later.
- **Structure:** one row per `(item, meal, date)` — see Phase 3 column list.
- **Split:** Time-based, not random — train on the first 70% of dates, validate on the next 15%, test on the final 15%. (Random splitting would leak future patterns into training, which is wrong for a forecasting problem.)
- **Labeling:** Demand model target = `consumed_qty` (regression). Waste-risk model target = `waste_qty / prepared_qty` as a continuous risk ratio, *or* a binary `high_waste` label at a threshold (e.g. >15% of prepared qty wasted) if you want a classifier — **default: train a regressor and bucket the output into 🔴🟠🟢 bands for display**, since the doc shows a percentage score, not a class label.

### Preprocessing (`ml/preprocessing/`)
- Clean: drop/flag rows with negative quantities, impossible dates.
- Feature engineering: `day_of_week`, `is_weekend`, `is_holiday` (manual calendar flag list — **doc gives no holiday data source**, default: maintain a small static JSON of known holidays), `rolling_7day_avg_consumption` per item, `days_to_expiry`, `current_stock_level`, `prepared_qty_last_week_same_day`.
- Encoding: one-hot or target-encode `item` and `meal` (categorical).
- No image/audio data — no resizing/augmentation needed (not that kind of model).

### Model
- **Algorithm:** XGBoost Regressor for both demand and waste-risk (doc names XGBoost explicitly; scikit-learn `RandomForestRegressor` as a documented fallback/baseline to compare against).
- **Why:** Tabular, structured, relatively small data (hundreds–low thousands of rows) — gradient-boosted trees are the standard strong baseline here and handle mixed categorical/numeric features well without heavy tuning.
- **Input shape:** feature vector per row (engineered features above).
- **Output shape:** single scalar (predicted consumption, or predicted waste ratio).
- **Loss:** squared error (regression default).
- **Optimizer:** XGBoost's built-in gradient boosting (not SGD/Adam — this isn't a neural net).
- **Learning rate:** start `0.05–0.1`, tune via validation MAE.
- **Batch size / epochs:** N/A in the neural-net sense — use `n_estimators` (start 200–500) with early stopping on the validation set instead.
- **Evaluation metrics:** Demand → MAE, RMSE, MAPE. Waste-risk → if regression: MAE/RMSE on the ratio; if bucketed into classes for the report card: precision/recall/F1/confusion matrix per risk band.

### Training workflow (`ml/training/train_*.py`)
```
load processed dataset
  → time-based split
  → fit XGBRegressor on train
  → early-stop using eval_set=[(X_val, y_val)]
  → evaluate on test split
  → save metrics to ml/evaluation/metrics_report.md
  → joblib.dump(model, "ml/models/<name>.pkl")
```
- **Experiment tracking:** simple — log each run's params + metrics as a new row in `ml/evaluation/metrics_report.md` (a full MLflow setup is unnecessary at this scale and isn't in the doc's stack).
- **Checkpointing:** not needed for tree models (training is fast); just re-save the `.pkl` on each improved run.
- **Overfitting detection:** compare train vs. validation MAE; large gap ⇒ reduce `max_depth`, increase regularization (`reg_lambda`), reduce `n_estimators`.
- **Hyperparameter tuning:** `GridSearchCV` or `RandomizedSearchCV` over `max_depth`, `learning_rate`, `n_estimators`, `min_child_weight`.

### Deployment
- Export via `joblib.dump()` to `ml/models/*.pkl`, committed to the repo (small files) or attached to a GitHub Release if they exceed a few MB.
- FastAPI's `services/` layer loads the `.pkl` once at startup (not per-request) and serves inference through `/predict/*`.
- Latency: default target <500ms per request (see Phase 11) — trivial for XGBoost on a handful of features.
- Memory/compute: negligible — a small XGBoost model easily runs on any laptop-class server; no GPU needed.

---

## 11. Hardware Implementation

**Not applicable.** The source document explicitly lists hardware, smart bins, and IoT under "What we are NOT implementing" (Section 12 of the doc). No components, wiring, pin configuration, or firmware are part of this project's scope, so this section is intentionally empty rather than populated with invented hardware.

---

## 12. Software Implementation

```
Input (manager form entry)
 ↓
Data Acquisition (React forms → Express REST API)
 ↓
Preprocessing (feature engineering in ai-service, mirrors ml/preprocessing)
 ↓
ML Inference (XGBoost demand + waste-risk models via FastAPI)
 ↓
Decision Logic (root-cause rules + recommendation rules, ai-service/app/rootcause)
 ↓
Backend/Controller (Node/Express stores predictions + recommendations in MongoDB)
 ↓
UI/Output (React dashboard: risk list, root cause, recommendations, impact charts)
```

- **APIs:** REST, JSON, versioned under `/api/v1/` on both services.
- **Modules:** see Section 5 folder structure.
- **Communication protocol:** HTTP/HTTPS only (no MQTT/serial — no hardware).
- **Data formats:** JSON for all API traffic; CSV for offline ML dataset files.
- **Database:** MongoDB (documents per Section 6 model list).
- **Authentication:** JWT issued by Node backend on login, verified via middleware on every protected route; the AI service trusts the backend as an internal caller (backend-to-AI calls use a shared internal API key, not user JWTs — simpler and correct since end users never call FastAPI directly).
- **Error handling:** Express centralized `errorHandler.js` middleware returning `{error: {code, message}}`; FastAPI uses Pydantic validation errors + custom `HTTPException` handlers in the same shape, so the frontend has one error-parsing path.

---

## 13. Integration Contracts

This is the document both of you fill in and freeze during **Phase 2**. Draft below — copy into `docs/api-contract.md` and adjust as you finalize field names.

| Interface | Owner | Input | Output | Format | Location |
|---|---|---|---|---|---|
| `POST /api/v1/auth/register` | M1 | `{name, email, password, orgName}` | `{token, user}` | JSON | backend |
| `POST /api/v1/auth/login` | M1 | `{email, password}` | `{token, user}` | JSON | backend |
| `GET/POST/PUT/DELETE /api/v1/inventory` | M1 | Ingredient fields | Ingredient doc(s) | JSON | backend |
| `GET/POST /api/v1/production` | M1 | `{item, meal, date, preparedQty}` | Production doc | JSON | backend |
| `GET/POST /api/v1/consumption` | M1 | `{item, meal, date, consumedQty, customerCount}` | Consumption doc | JSON | backend |
| `GET/POST /api/v1/waste` | M1 | `{item, date, wasteQty, reason}` | Waste doc | JSON | backend |
| `POST /predict/demand` | M2 | `{item, meal, date, dayOfWeek, rollingAvg, ...features}` | `{expectedDemand}` | JSON | ai-service |
| `POST /predict/waste-risk` | M2 | same feature bundle | `{item, riskScore(0-100), band("🔴/🟠/🟢")}` | JSON | ai-service |
| `POST /recommend` | M2 | risk output + recent feature deltas | `{cause, evidence, recommendation}` | JSON | ai-service |
| `GET /api/v1/ai/dashboard` (proxy) | M1 (calls M2 internally) | org/date range | risk list + recs + charts data | JSON | backend |
| `POST /api/v1/outcomes` | M1 | `{recommendationId, actualPrepared, actualConsumed, actualWaste}` | Outcome doc + computed impact% | JSON | backend |

Model input/output contract (`ml/models/*.pkl` ↔ `ai-service`): feature vector column order must match exactly what `ml/preprocessing/features.py` produces — **M2 keeps one shared `feature_columns.py` imported by both training and serving code** so this never drifts.

No MQTT topics, no serial format, no sensor data format — not applicable (no hardware).

---

## 14. Git Branch & Collaboration Strategy

```
main            (protected, deploy-ready only)
  └── develop   (protected, integration branch)
       ├── feature/m1-...
       ├── feature/m2-...
       └── integration/phase-N   (short-lived, both push here for Phase 9/10 joint work)
```

- **Protected:** `main` (only merges from `develop` via reviewed PR), `develop` (only merges from `feature/*` via reviewed PR).
- **Who merges:** the reviewer (the *other* member) clicks merge after approving — never merge your own PR without the other's approval, even for small changes.
- **PR requirements:** description states which phase/issue it closes; CI green; 1 approval.
- **Commit naming:** Conventional Commits (Section 4).
- **Branch naming:** `feature/<m1|m2>-<kebab-desc>`.
- **Syncing:** each morning, `git checkout develop && git pull`, then `git checkout your-feature-branch && git merge develop` (or rebase if you're comfortable with it) before continuing work, so you're never more than a day of drift behind.
- **Avoiding shared-file conflicts:** don't touch the other member's owned folders (Section 6 table). For the one genuinely shared file (`docs/api-contract.md`, and `frontend/src/shared/*`), follow the additive-only rule in Section 5.
- **Handling a merge conflict when it does happen:** stop, call/message the other member, resolve together over screen-share rather than guessing — with clean ownership boundaries this should be rare (limited to the shared folder).
- **Integration branches:** used only in Phase 9 and Phase 10, where both members' work must run together; short-lived, deleted after merging into `develop`.

---

## 15. Dependency & Parallelization Matrix

| Task | Member | Depends On | Can Start Independently? | Integration Required? |
|---|---|---|---|---|
| Env setup | Both | — | Yes | No |
| API contract | Both | Env setup | No (joint session) | — |
| Seed data / EDA | M1 / M2 | Contract | Yes, in parallel | No |
| Auth + Inventory API | M1 | Seed data | Yes | No |
| Model training | M2 | Dataset | Yes (parallel to M1's backend work) | No |
| Production/Consumption/Waste API | M1 | Auth+Inventory | Yes | No |
| FastAPI serving | M2 | Trained models | Yes | No |
| AI proxy (backend) | M1 | Contract (mocked FastAPI) | Yes, in parallel with M2's Phase 6 | **Yes**, once both done |
| Operations frontend | M1 | Backend CRUD | Yes | No |
| Dashboard frontend | M2 | AI proxy endpoints | Partially — build against mock data first | **Yes** |
| Outcome logging / impact calc | Both | Phases 6, 8 | Split cleanly | **Yes** |
| Integration testing | Both | Everything above | No | **Yes** |
| Deployment | Both | Integration testing passed | No | **Yes** |

**Critical path:** Env → Contract → (Auth API ∥ Dataset/Model training) → FastAPI serving → AI proxy integration → Dashboard → Outcome loop → Integration testing → Deploy.

**Parallel path (maximizes 2-person speed):** From the moment the contract is frozen, M1's entire backend+operations-frontend track and M2's entire ML+AI-service track run fully in parallel and only need to sync at two points: (1) Phase 6 integration (AI proxy ↔ real FastAPI), (2) Phase 9 (outcome loop).

---

## 16. Testing Strategy

| Test type | What's tested | Who | Input | Expected result | Pass/Fail criteria |
|---|---|---|---|---|---|
| Unit (backend) | Each route/controller | M1 | mocked req/res | Correct status + body | Jest assertions pass |
| Unit (ai-service) | Each router/service | M2 | fixture feature vectors | Correct score/shape | Pytest assertions pass |
| Module (ML) | Training script | M2 | sample dataset | Model trains, metrics computed | No exceptions, metrics within sane range |
| Model testing | Trained model quality | M2 | held-out test split | MAE/F1 above baseline | Beats naive baseline (e.g. "predict last week's value") |
| API testing | Each endpoint contract | Both | Postman/Thunder Client collection | Matches `docs/api-contract.md` exactly | Manual checklist pass |
| Communication testing | Backend ↔ FastAPI | M1 | real request | Backend correctly proxies + stores | Response persisted in Mongo matches FastAPI output |
| Integration testing | Full flow: log data → get recommendation → accept → log outcome → see impact | Both | Section 6 worked example inputs | 78.6%-style reduction computed correctly | Numbers match hand-calculated expectation |
| System testing | Full app via UI | Both | manual click-through | No broken flow | Every screen in Section 11 mock reachable |
| Performance testing | Dashboard load, prediction latency | M2 (models), M1 (queries) | 180-day seeded dataset | <500ms predictions, <1s dashboard load | Section 11 target met |
| Stress testing | Many concurrent form submissions | M1 | scripted parallel requests | No data corruption | All writes land correctly |
| Failure testing | FastAPI down, bad input, DB disconnect | Both | kill service / malformed JSON | Graceful error, no crash | User sees a clear error, app doesn't 500-loop |
| Final acceptance | Section 6 example reproduced live | Both | live demo | Matches doc's worked example | Demo runs start-to-finish without manual DB edits |

No hardware/sensor testing rows — not applicable.

---

## 17. Debugging Strategy

- **API failures (backend):** check `backend` logs first → confirm route is mounted in `app.js` → confirm Mongoose model matches the request shape → confirm JWT middleware isn't rejecting a valid token (clock skew / expired token are common).
- **Communication failures (backend ↔ FastAPI):** confirm `AI_SERVICE_URL` env var is correct → `curl` the FastAPI endpoint directly, bypassing Node, to isolate which side is broken → check the internal API key header matches.
- **Model prediction failures:** confirm the feature vector sent matches `feature_columns.py` exactly (order + names) → check for NaN/missing fields in the request → reload `.pkl` and test with a known-good fixture from `ai-service/tests/`.
- **Git conflicts:** almost always in the shared folder — resolve together live, never solo-guess on someone else's owned files.
- **Dependency/version issues:** pin exact versions in `package.json`/`requirements.txt`; if "works on my machine," diff `node -v`/`python --version` and reinstall from the committed lockfile (`package-lock.json`, `requirements.txt` with pinned versions).

Simple decision tree:
```
Something's broken
 ├─ Is it in the browser console? → frontend bug, check network tab for the failing request
 ├─ Is the request reaching the backend (check backend logs)?
 │    ├─ No  → frontend API client / CORS / URL issue
 │    └─ Yes → is it a DB error or a logic error? check Mongoose error message
 ├─ Is the backend correctly calling FastAPI?
 │    ├─ curl FastAPI directly — does it work standalone? → if yes, it's the proxy layer
 │    └─ if FastAPI itself errors → check feature vector shape / model load
 └─ Still stuck → reproduce with the smallest possible input, add a fixture test for it
```

---

## 18. Final Integration Procedure

```
M1 module complete → unit tests pass → PR to develop → M2 reviews → merge
M2 module complete → unit tests pass → PR to develop → M1 reviews → merge
                          ↓
        Create integration/phase-10 branch from develop
                          ↓
   Both run backend + ai-service + frontend together locally
   (or via docker-compose if you adopted it in Phase 1)
                          ↓
        Walk the Section 6 worked example end-to-end:
        seed Friday data → get waste-risk + recommendation →
        accept it → log actual outcome → confirm impact % on dashboard
                          ↓
              Fix any integration bugs found
                          ↓
        PR integration/phase-10 → develop, both approve
                          ↓
              Full regression pass (Section 16 table)
                          ↓
        Release candidate: PR develop → main, both approve
                          ↓
                    Final testing on main
                          ↓
                  Tag release (e.g. v1.0.0)
```

---

## 19. Final Deployment

**Doc gives no deployment target — defaults chosen for a 2-person student/portfolio project, clearly flagged as defaults:**

- **Database:** MongoDB Atlas free tier (already used in dev, Phase 1).
- **Backend:** Render or Railway free/hobby tier (Node service, env vars for `MONGO_URI`, `JWT_SECRET`, `AI_SERVICE_URL`, `AI_SERVICE_KEY`).
- **AI service:** Render/Railway as a second service (Python, `uvicorn app.main:app --host 0.0.0.0 --port $PORT`), with `ml/models/*.pkl` committed or pulled from a GitHub Release at build time.
- **Frontend:** Vercel or Netlify (React/Vite build, `VITE_API_URL` pointing at the deployed backend).
- **If Docker was adopted (Phase 1 optional):** a single `docker-compose.yml` can instead run all three services + Mongo together on any VM (e.g. a free-tier cloud instance), which simplifies demo-day reliability at the cost of one extra setup step.

Steps: deploy backend → deploy AI service → set backend's `AI_SERVICE_URL` to the deployed AI service → deploy frontend with `VITE_API_URL` pointing at the deployed backend → run the Phase 18 worked example against the live deployment → tag `v1.0.0`.

---

## 20. Complete Project Checklist

**Hardware:** N/A — not part of this project (see Section 11).

**Software**
- [ ] Node + Python envs running on both machines
- [ ] MongoDB reachable (local or Atlas)
- [ ] Backend: auth, inventory, production, consumption, waste routes live
- [ ] AI proxy layer connected to real FastAPI service
- [ ] Frontend: operations module, dashboard module, auth/login
- [ ] Outcome logging + impact calculation working

**ML/DL**
- [ ] Dataset generated/collected and cleaned
- [ ] Feature engineering pipeline (`feature_columns.py`) shared between training and serving
- [ ] Demand model trained, evaluated (MAE/RMSE reported)
- [ ] Waste-risk model trained, evaluated (precision/recall/F1 or MAE reported)
- [ ] Models exported (`.pkl`) and loaded by FastAPI at startup
- [ ] Root-cause + recommendation rules implemented and tested

**GitHub**
- [ ] Repo created, `main`/`develop` protected
- [ ] Branch naming + commit convention followed
- [ ] Issues + Project board reflect all phases
- [ ] Every PR reviewed by the other member
- [ ] `docs/api-contract.md` frozen after Phase 2, updated only via reviewed PR

**Testing**
- [ ] Unit tests (backend, ai-service)
- [ ] API contract tests
- [ ] Integration test (Section 6 worked example, end-to-end)
- [ ] Performance check (<500ms predictions, <1s dashboard load)
- [ ] Failure-mode tests (service down, bad input)

**Final Deliverables**
- [ ] Source code (`main` branch, tagged release)
- [ ] Trained models (`ml/models/*.pkl` + `model_card.md` per model)
- [ ] Documentation (`README.md`, `docs/api-contract.md`, architecture diagram)
- [ ] Test results (metrics report + integration test output)
- [ ] Live demo / recorded walkthrough
- [ ] Final report (if required by your course/institution — not specified in doc)

---

## 21. Day-by-Day / Step-by-Step Master Execution Plan

1. Understand requirements — **Both**, sequential (this document).
2. Create GitHub repo, branches, protections — **M1**, sequential.
3. Set up GitHub Project board, milestones, labels — **M1**, sequential.
4. Node + Express env setup — **M1**, parallel with 5.
5. Python + FastAPI env setup — **M2**, parallel with 4.
6. Joint API-contract + schema design session — **Both**, sequential (blocks everything downstream).
7. Seed/synthetic dataset generation — **M1**, parallel with 8.
8. EDA on seeded dataset — **M2**, parallel with 7 (waits for 7's first output).
9. Auth + Inventory API — **M1**, sequential after 6/7.
10. Preprocessing/feature engineering pipeline — **M2**, sequential after 8.
11. Train demand model — **M2**, sequential after 10.
12. Train waste-risk model — **M2**, parallel with 11 (or right after).
13. Production/Consumption/Waste API — **M1**, parallel with 11–12.
14. FastAPI serving layer (`/predict/*`) — **M2**, sequential after 11–12.
15. Root-cause + recommendation rules — **M2**, sequential after 14.
16. Backend AI-proxy layer (built against mock first) — **M1**, parallel with 14–15.
17. Wire proxy to real FastAPI service — **Both**, sequential, first integration checkpoint.
18. Operations frontend (forms/tables) — **M1**, parallel with 19.
19. Dashboard frontend (risk list, charts, recommendations) — **M2**, parallel with 18, sequential after 17.
20. Auth frontend + shared UI kit — **M1**, sequential after 9.
21. Outcome logging (backend) — **M1**, sequential after 17.
22. Impact-measurement calculation — **M2** (or M1, per Phase-2 decision), sequential after 21.
23. Integration testing (full worked example, end-to-end) — **Both**, sequential, second integration checkpoint.
24. Bug fixes from integration testing — **Both**, as needed.
25. Performance optimization (indexes, caching, latency check) — **Both**, parallel, split by service.
26. Deploy backend — **M1**, sequential.
27. Deploy AI service — **M2**, parallel with 26 (independent deploy targets).
28. Deploy frontend, point at both live services — **Both**, sequential after 26–27.
29. Final acceptance test on live deployment — **Both**, sequential.
30. Documentation finalization (README, architecture diagram, model cards) — **Both**, parallel, split by area.
31. Record/deliver final demo — **Both**, sequential.
32. Tag release `v1.0.0`, merge `develop` → `main` — **Both**, sequential, final step.

---

## 22. Risks, Bottlenecks & Solutions

| Risk/Bottleneck | Why it happens | Solution |
|---|---|---|
| No real dataset available | Doc only gives an illustrative example | Use the Phase-3 synthetic generator with realistic day-of-week/seasonal noise; treat any real pilot data as a later drop-in, not a blocker |
| API contract drifts after Phase 2 | Someone changes a field shape mid-build without telling the other | Freeze the contract file behind a mandatory-review PR; any change requires the other member's explicit sign-off before either side codes against it |
| M1 blocked waiting for M2's real FastAPI service | Sequential dependency in Phase 6 | M1 builds against a mocked JSON fixture matching the frozen contract from day one — never literally waits |
| M2 blocked waiting for M1's backend for dashboard data | Sequential dependency in Phase 8 | M2 builds the dashboard against static fixture JSON first, swaps in the real proxy endpoint once available (same mocking pattern) |
| Model underperforms on synthetic data | Synthetic data may be too clean/patterned, giving misleadingly good metrics | Deliberately inject noise and a few "surprise" days (unexpected demand spikes/drops) into the generator so the model isn't trivially solving a pattern it created itself |
| Merge conflicts despite folder ownership | Both touch `frontend/src/shared/` at the same time | Additive-only rule (Section 5) + small, fast-reviewed PRs for any shared-file change |
| Scope creep toward donation features / extra "nice to have" AI features | Doc mentions donation integration as a later possibility | Explicitly deferred — not in Section 20's checklist; revisit only after v1.0.0 is tagged |
| Deployment target ambiguity | Doc specifies no hosting provider | Defaults chosen in Section 19 (Atlas/Render/Vercel) — swap freely, nothing in the architecture depends on a specific provider |
| Two-person team runs out of time before all 13 phases | Full scope is large for 2 people | The critical path (Section 15) is the minimum viable end-to-end loop; Phase 11 (optimization) and parts of Phase 13 (extra docs) are the first things to trim if time runs short — the acceptance test in Phase 18/23 is the non-negotiable milestone |

---

*End of roadmap. Next action: run Section 21, Step 1 — you've just done it by reading this document. Step 2 starts with M1 creating the GitHub repo.*
