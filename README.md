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
- [ ] **Phase 2** — Data Model & API Contract Design
- [ ] **Phase 3** — Dataset Preparation
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
| ML | Scikit-learn, XGBoost |
| Auth | JWT |
| Validation | Zod (backend), Pydantic (AI service) |

See `docs/api-contract.md` for the frozen API contract (added in Phase 2).

---

## Repository Structure

```
qulin-organization/
├── backend/            # Node/Express API — Member 1
├── ai-service/         # Python/FastAPI AI microservice — Member 2
├── ml/                 # Model training pipeline (offline) — Member 2
├── frontend/           # React app (added in Phase 7-8) — shared, split by module
├── docs/               # Architecture notes, API contract — both
├── scripts/            # Seed/generation scripts — both
├── tests/integration/  # End-to-end tests — both (added Phase 9-10)
└── config/             # Shared non-secret config — both
```

---

## Local Setup

### Prerequisites

- Node.js LTS
- Python 3.11+
- Git (Git Bash recommended on Windows for shell command compatibility)
- A MongoDB Atlas free-tier cluster (or local MongoDB instance)

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

### 3. AI service setup (`ai-service/`)

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
- Never edit the other member's owned files/folders (see Team Responsibility Matrix in project docs). The only shared files (`docs/api-contract.md`, `frontend/src/shared/*`) follow an additive-only rule — structural changes go through their own small, fast-reviewed PR.

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

## Documentation

- `docs/api-contract.md` — frozen API contract between frontend/backend/AI service (added Phase 2)
- `ml/evaluation/metrics_report.md` — model training metrics (added Phase 5)
- `ml/models/*/model_card.md` — per-model documentation (added Phase 5)

---

## License

MIT (default — update if your institution requires otherwise).