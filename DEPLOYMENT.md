# CycleClub Analytics — Production Deployment Guide

This guide details the step-by-step deployment instructions for hosting **CycleClub Analytics** using:
- **Frontend**: [Vercel](https://vercel.com)
- **Backend**: [Render](https://render.com)
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL & Google OAuth 2.0)
- **Integrations**: [Strava v3 API](https://www.strava.com/settings/api)

---

## Architecture Overview

```
                                    +------------------------+
                                    |     Vercel Frontend    |
                                    | (React + TypeScript)   |
                                    +-----------+------------+
                                                |
                                      HTTPS REST API Calls
                                                |
                                                v
+------------------------+          +-----------+------------+          +------------------------+
|      Strava API        | <----->  |     Render Backend     |  <---->  |     Supabase Auth      |
|  (OAuth & Webhooks)    |          |    (FastAPI + Python)   |          |  (PostgreSQL + Google) |
+------------------------+          +------------------------+          +------------------------+
```

---

## 1. Deploy Backend to Render

### Step 1: Create a New Web Service on Render
1. Push your repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Connect your repository.
4. Configure service settings:
   - **Name**: `cycleclub-backend`
   - **Region**: Select closest region (e.g. Oregon/Frankfurt)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 2: Configure Render Environment Variables
Add the following key-value pairs in **Render Dashboard** -> **Environment**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `ENV` | `production` | Enables production mode |
| `APP_NAME` | `CycleClub Analytics` | Application Name |
| `SECRET_KEY` | `your-32-char-random-secret-key` | JWT Security Secret |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Production Vercel domain |
| `DATABASE_URL` | `postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres` | Supabase PostgreSQL Connection String |
| `SUPABASE_URL` | `https://oncdnapacnzayvqxyubf.supabase.co` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJI...` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJI...` | Supabase Service Role Key |
| `SUPABASE_JWT_SECRET` | `8rPLa5p3vmD3j21k7zGNi...` | Supabase JWT Secret |
| `STRAVA_MODE` | `real` | Production real Strava v3 API mode |
| `STRAVA_CLIENT_ID` | `YOUR_STRAVA_CLIENT_ID` | Strava App Client ID |
| `STRAVA_CLIENT_SECRET` | `YOUR_STRAVA_CLIENT_SECRET` | Strava App Client Secret |
| `STRAVA_REDIRECT_URI` | `https://cycleclub-backend.onrender.com/api/auth/strava/callback` | Render Callback URL |
| `STRAVA_VERIFY_TOKEN` | `cycle_club_webhook_verify_token_123` | Strava Webhook Verify Token |

5. Click **Deploy Web Service**. Your backend will be available at: `https://cycleclub-backend.onrender.com`.

---

## 2. Deploy Frontend to Vercel

### Step 1: Import Project to Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/) and click **Add New...** -> **Project**.
2. Select your repository.
3. In **Framework Preset**, choose **Vite**.
4. Set **Root Directory** to `frontend`.

### Step 2: Configure Vercel Environment Variables
Add the following Environment Variables in Vercel settings:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://oncdnapacnzayvqxyubf.supabase.co` | Supabase Public URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJI...` | Supabase Public Anon Key |
| `VITE_API_BASE_URL` | `https://cycleclub-backend.onrender.com/api` | Render Backend API Base URL |

### Step 3: Deploy
Click **Deploy**. Vercel will automatically build the static bundle (`npm run build`) and serve it on a `.vercel.app` URL (e.g., `https://cycleclub-analytics.vercel.app`).

> Note: [`frontend/vercel.json`](file:///c:/Users/sakth/OneDrive/Desktop/projects/coco/frontend/vercel.json) is already included to ensure single-page application (SPA) routing routes all paths to `/index.html`.

---

## 3. Update Strava OAuth & Webhook Settings

Once both Render and Vercel are deployed:

1. Log in to [Strava API Settings](https://www.strava.com/settings/api).
2. Set **Authorization Callback Domain** to your Render backend domain:
   `cycleclub-backend.onrender.com`
3. Register your production webhook endpoint using `curl`:
   ```bash
   curl -X POST https://www.strava.com/api/v3/push_subscriptions \
     -F client_id=YOUR_STRAVA_CLIENT_ID \
     -F client_secret=YOUR_STRAVA_CLIENT_SECRET \
     -F callback_url=https://cycleclub-backend.onrender.com/api/webhooks/strava \
     -F verify_token=cycle_club_webhook_verify_token_123
   ```

---

## 4. Database Initialization

To initialize a clean production database schema without mock data on Supabase:

```bash
cd backend
python cleanup_db.py
```

---

## 5. Verification Steps

- [x] Vercel frontend loads cleanly and handles client-side routes.
- [x] Render backend API responds cleanly at `https://cycleclub-backend.onrender.com/`.
- [x] Google Auth via Supabase redirects back to Vercel application.
- [x] Strava OAuth button initiates authentication and redirects back to Render callback URL, returning user to Vercel dashboard (`?strava_connected=true`).
- [x] Webhooks receive real activity updates from Strava and update Supabase PostgreSQL database.
