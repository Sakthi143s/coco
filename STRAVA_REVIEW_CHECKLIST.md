# Strava Developer Program Review Checklist

This checklist documents all requirements, API compliance audits, application metadata, and verification items for submitting **CycleClub Analytics** to the **Strava Developer Program**.

---

## 1. Application Identification & Metadata

| Metadata Field | Application Details |
| :--- | :--- |
| **Application Name** | CycleClub Analytics |
| **Application Description** | Production-ready multi-club cycling management platform and Strava-powered performance analytics dashboard. Provides club leaders and endurance athletes with real-time performance tracking, leaderboards, and activity feeds. |
| **Category** | Club / Team Performance Intelligence |
| **Target Audience** | Cycling club riders, team captains, and club administrators |
| **Production Frontend URL (Vercel)** | `https://cycleclub-analytics.vercel.app` |
| **Backend API Base URL (Render)** | `https://cycleclub-backend.onrender.com` |
| **Backend Callback URL (Render)** | `https://cycleclub-backend.onrender.com/api/auth/strava/callback` |
| **Webhook Endpoint URL (Render)** | `https://cycleclub-backend.onrender.com/api/webhooks/strava` |

---

## 2. Connect with Strava & Branding Guidelines Compliance

- [x] **Official "Connect with Strava" Branding**:
  - The application uses official Strava orange (`#FC5200`) buttons with exact text **"Connect with Strava"**.
  - No custom or altered Strava logos/icons that violate Strava Brand Guidelines.
- [x] **Connect Button Locations**:
  1. Primary Navigation Sidebar (`Sidebar.tsx`)
  2. Main Dashboard Empty State & Header (`DashboardPage.tsx`)
  3. Club Rider Directory (`RidersPage.tsx`)
  4. Leaderboard Empty State (`LeaderboardPage.tsx`)
- [x] **"Powered by Strava" Badge & Attribution**:
  - Displayed on the application footer, settings page, and activity tables.
- [x] **"View on Strava" External Activity Links**:
  - Every Strava activity rendered in the dashboard, activity feed, and rider profile links directly back to `https://www.strava.com/activities/{strava_activity_id}` using clear "View on Strava" / "Strava" links.
- [x] **Legal Endorsement & Sponsorship Disclaimer**:
  - Standard mandatory notice displayed in application footer and settings:
    > *"CycleClub Analytics is an independent application and is not developed, sponsored, or endorsed by Strava, Inc."*

---

## 3. Requested Strava API Scopes

| Scope | Justification & Purpose |
| :--- | :--- |
| `read` | Retrieve basic public athlete profile information (`firstname`, `lastname`, `profile` avatar image URL) for user profile creation. |
| `activity:read_all` | Synchronize athlete cycling activities (distance, elevation, moving time, average speed, start date) into the club analytics database. Required for club leaderboard rankings and challenge progress. |
| `profile:read_all` | Read full athlete profile data upon user authorization. |

---

## 4. Webhook Implementation Details

- **Verification Endpoint**: `GET /api/webhooks/strava`
  - Validates `hub.mode == "subscribe"` and `hub.verify_token == STRAVA_VERIFY_TOKEN`.
  - Responds synchronously with `{"hub.challenge": "..."}`.
- **Event Processor**: `POST /api/webhooks/strava`
  - Handles `create`, `update`, `delete` events for activities idempotently using `strava_activity_id`.
  - Handles `deauthorize` events when an athlete revokes access, deleting connection tokens from the backend database immediately.

---

## 5. Security & Privacy Architecture

- [x] **Backend Token Storage Only**:
  - `access_token` and `refresh_token` are stored **ONLY** in the server-side PostgreSQL database (`strava_connections` table).
  - Credentials are **NEVER** returned in any client-side API response schema (`CurrentUserResponse`, `RiderResponse`, `ActivityResponse`).
- [x] **Automatic Token Refresh**:
  - Evaluated on every API request and webhook processing via `get_valid_access_token()`.
  - Automatically refreshes tokens expiring within 5 minutes (300-second buffer) and updates the database.
- [x] **Account Deauthorization & Disconnect**:
  - User can disconnect Strava at any time via `POST /api/auth/strava/disconnect`.
  - Sends a remote deauthorization request to `https://www.strava.com/oauth/deauthorize` and deletes connection credentials from the backend database.

---

## 6. Strava API Agreement & Leaderboard Compliance Audit (Task 13)

### Identified Compliance Issue:
Under Section 2.2 and Data Display Guidelines of the Strava API Agreement, displaying individual users' Strava activity metrics to third parties or fellow club members on a shared leaderboard requires **explicit, informed opt-in consent** from each athlete.

### Compliant Architecture Implemented:

1. **User Database Opt-In Preference (`leaderboard_opt_in`)**:
   - Added `leaderboard_opt_in = Column(Boolean, default=True)` field to `User` model.
   - User can toggle their leaderboard sharing preference at any time in Settings or Rider Profile.
2. **Leaderboard Filtering (`LeaderboardEngine`)**:
   - The leaderboard engine strictly filters rankings by `User.leaderboard_opt_in == True`.
   - If a user opts out of leaderboard sharing, their aggregate metrics are immediately excluded from public club leaderboards.
3. **Explicit Consent Notice**:
   - Displayed prior to Strava OAuth connection informing users that connecting will share aggregate ride distance and elevation on the club leaderboard.

---

## 7. Zero-Data & Empty State Verification

- [x] **Clean Database State**: Running `python cleanup_db.py` creates a clean production schema with 0 mock users, 0 mock activities, 0 fake challenges, and 0 fake leaderboards.
- [x] **Graceful UI Empty States**:
  - **Dashboard**: Displays `0 active riders`, `0 rides today`, `0 km distance`, `0 m elevation`, and `0h moving time` with a prominent "Connect with Strava" CTA button.
  - **Leaderboard**: Displays *"No rides logged yet. Connect your Strava account to start importing activities."*
  - **Activities Feed**: Displays clean empty state with Connect with Strava action.
  - **Riders Directory**: Displays empty roster with Connect with Strava action.

---

## 8. Required Submission Screenshots Checklist

Prepare the following 6 screenshots for the Strava API review portal:

1. **"Connect with Strava" Button Location**: Screenshot showing the official orange `#FC5200` button in the Sidebar and Dashboard.
2. **Strava Authorization Screen**: Screenshot of the standard Strava OAuth consent screen with requested scopes (`read`, `activity:read_all`, `profile:read_all`).
3. **Application Dashboard**: Screenshot of the main dashboard showing imported real activity data, distance cards, and attribution.
4. **Activity List with "View on Strava" Links**: Screenshot showing the Activity Log table with explicit "View on Strava" links linking to `https://www.strava.com/activities/{id}`.
5. **Leaderboard Privacy Controls**: Screenshot of the Settings / Profile page showing the Leaderboard Opt-In toggle and Strava disclaimer.
6. **Account Disconnect & Deauthorization**: Screenshot showing the Disconnect Strava option in Settings/Sidebar.
