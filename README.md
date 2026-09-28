# CycleClub Analytics 🚴‍♂️📊

Production-ready multi-club cycling management platform and Strava-powered performance analytics dashboard. Built with React, TypeScript, Tailwind CSS, Recharts, FastAPI, SQLAlchemy, and Supabase PostgreSQL support.

---

## 🌟 Key Features & Architecture

1. **Modern Sports Analytics Dashboard**
   - Live metrics: Total Active Riders, Rides Today, Today's Distance/Elevation, Weekly & Monthly Totals.
   - Live Today Leaderboard with raw metrics (Rank, Rider, Distance, Elevation, Moving Time, Avg Speed).
   - Timeframe filters (`Today`, `This Week`, `This Month`).

2. **Rider Directory & Administration**
   - Admin management table with status filters (`Active`, `Inactive`).
   - Rider detail view, toggle active/inactive status, and remove rider action.
   - Connected Strava Athlete status tracking.

3. **Strava OAuth 2.0 Integration**
   - Flow: `Frontend` → `GET /api/auth/strava` → `Strava OAuth` → `GET /api/auth/strava/callback` → `FastAPI exchange` → `Redirect`.
   - Backend-only secret handling: Access tokens and refresh tokens are securely persisted in the database and **never** exposed to the browser.
   - Built-in `MockStravaService` and `RealStravaService` factory layer allowing seamless zero-config local UI development.

4. **Leaderboard Engine**
   - Separate transparent leaderboards: Daily Distance, Daily Elevation, Weekly Distance, Weekly Elevation, Monthly Distance, Longest Ride, Most Active Riders.
   - Completely transparent, metric-driven ranking algorithm.

5. **Deep Rider Profile Analytics**
   - Total rides, total distance, total elevation, moving time, average speed, longest ride, avg distance per ride.
   - Interactive Recharts: Distance Over Time, Elevation Climbing Trend, Weekly Output, Ride Frequency by Day of Week.

6. **Strava Webhook Architecture**
   - Endpoint: `POST /api/webhooks/strava` with verification support on `GET /api/webhooks/strava`.
   - Asynchronous background event processing for athlete identification, activity fetch/update, and challenge recalculation.

7. **Club Challenges**
   - Group mileage & elevation challenges (e.g. *September Century Quest*, *King of the Mountains*).
   - Participant progress bars and goal completion tracking.

---

## 📁 Project Structure

```text
coco/
├── .env.example                # Configuration template
├── README.md                   # Full documentation & setup guide
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py         # Strava OAuth flow & callbacks
│   │   │   │   ├── dashboard.py    # Summary metrics & today's leaderboard
│   │   │   │   ├── riders.py       # Rider directory & admin management
│   │   │   │   ├── activities.py   # Activity logging & manual sync
│   │   │   │   ├── leaderboards.py # Category & timeframe leaderboards
│   │   │   │   ├── analytics.py    # Rider profile analytics
│   │   │   │   ├── challenges.py   # Club challenge endpoints
│   │   │   │   └── webhooks.py     # Strava activity webhook receiver
│   │   │   └── router.py
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic BaseSettings
│   │   │   ├── database.py     # SQLAlchemy engine & session factory
│   │   │   └── security.py
│   │   ├── integrations/
│   │   │   └── strava/
│   │   │       ├── base.py        # Abstract Strava service interface
│   │   │       ├── mock_strava.py # Mock Strava implementation
│   │   │       ├── real_strava.py # Production Strava API client
│   │   │       └── service.py     # Service factory switch
│   │   ├── models/
│   │   │   └── models.py       # Club, User, Activity, StravaConnection, Challenge
│   │   ├── schemas/
│   │   │   └── schemas.py      # Pydantic v2 schemas
│   │   ├── services/
│   │   │   ├── leaderboard_engine.py
│   │   │   └── analytics_service.py
│   │   ├── main.py             # FastAPI entrypoint
│   │   └── seed.py             # Rich mock database populator
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── analytics/      # Recharts visualizations
    │   │   ├── common/         # MetricCard, Badge components
    │   │   └── layout/         # Sidebar, Header, Layout
    │   ├── pages/              # Dashboard, Riders, Leaderboard, Activities, etc.
    │   ├── services/           # API fetch client
    │   ├── types/              # TypeScript interfaces
    │   ├── App.tsx
    │   └── index.css           # Glassmorphism & dark sports design tokens
    ├── package.json
    └── vite.config.ts
```

---

## ⚡ Quick Start & Local Setup

### 1. Environment Setup
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

### 2. Backend Setup & Database Seeding
```bash
cd backend
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Seed Database with 15 realistic riders and 120+ activities
python -m app.seed

# Run FastAPI Server (runs on http://localhost:8000)
python -m app.main
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔑 Environment Variables Reference

| Key | Default Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `CycleClub Analytics` | Application display title |
| `DATABASE_URL` | `sqlite:///./cycleclub.db` | PostgreSQL string (e.g. Supabase) or SQLite |
| `STRAVA_CLIENT_ID` | `mock_strava_client_id` | Strava OAuth Application ID |
| `STRAVA_CLIENT_SECRET` | `mock_strava_client_secret` | Backend-only Strava client secret |
| `STRAVA_VERIFY_TOKEN` | `cycle_club_webhook_verify_token_123` | Strava Webhook verification token |
| `STRAVA_REDIRECT_URI` | `http://localhost:8000/api/auth/strava/callback` | OAuth redirect callback URI |
| `USE_MOCK_STRAVA` | `true` | Set to `false` for real Strava API calls |

---

## 📡 API Endpoint Documentation

### Authentication & Strava OAuth
- `GET /api/auth/strava` — Returns authorization URL for Strava OAuth flow.
- `GET /api/auth/strava/callback` — Exchanges OAuth code for tokens, persists credentials securely, and redirects to dashboard.

### Dashboard & Analytics
- `GET /api/dashboard/summary` — Overview metrics and today's leaderboard.
- `GET /api/analytics/rider/{rider_id}` — Detailed rider performance analytics, trends, and charts.

### Riders & Management
- `GET /api/riders` — List club riders with optional `status_filter`.
- `POST /api/riders` — Create new rider record.
- `GET /api/riders/{rider_id}` — Get single rider details.
- `PATCH /api/riders/{rider_id}` — Update rider status (`active`/`inactive`) or role.
- `DELETE /api/riders/{rider_id}` — Remove rider.

### Activities
- `GET /api/activities` — Filterable activity feed with pagination.
- `POST /api/activities/sync/{rider_id}` — Manual Strava activity synchronization trigger.

### Leaderboards & Challenges
- `GET /api/leaderboards` — Query parameters: `timeframe` (`today`, `week`, `month`, `all_time`) & `category` (`distance`, `elevation`, `longest_ride`, `most_active`).
- `GET /api/challenges` — List active club challenges.
- `POST /api/challenges/{challenge_id}/join/{rider_id}` — Join challenge.

### Webhooks
- `GET /api/webhooks/strava` — Strava subscription verification challenge handler.
- `POST /api/webhooks/strava` — Strava activity event receiver.

---

## 🔐 Production Deployment & Security Notes

1. **Tokens & Secrets**:
   - `STRAVA_CLIENT_SECRET` is used exclusively on the backend server.
   - Access and refresh tokens are stored in the database (`strava_connections`) and omitted from API responses.
2. **Database Migration**:
   - To connect to Supabase PostgreSQL, set `DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` in `.env`.
