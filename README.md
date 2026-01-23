# 🌱 FocusGuard

> Grow your focus. One session at a time.

FocusGuard is a modern productivity platform that combines the Pomodoro technique with AI-powered focus insights and gamification. Build better study habits while growing your personal digital garden.

![FocusGuard Banner](https://github.com/talelboussetta/FocusGuard-ML/blob/main/client/focusguard-dashboard/src/assets/images/banner.png)

## ✨ Features

```markdown
# 🌱 FocusGuard

> Grow your focus. One session at a time.

FocusGuard is a productivity platform that combines the Pomodoro technique, local browser-based computer vision, and gamified progress tracking to help users build sustainable focus habits.

![FocusGuard Banner](https://github.com/talelboussetta/FocusGuard-ML/blob/main/client/focusguard-dashboard/src/assets/images/banner.png)

## ✨ Highlights (recent)

- Teams: create and join teams, view team members, and a team leaderboard.
- Team Detail View: per-team member list, basic member stats, and an in-page team chat UI (UI-only; backend chat planned).
- Leaderboard Enhancements: per-team filtering and new endpoints for team leaderboards.
- Backend: new FastAPI routes and services for team management following existing project patterns.

## 🚩 New / Changed Files (developer overview)

- Backend (serv/api):
	- `serv/api/models/team.py` — Team and TeamMember ORM models
	- `serv/api/schemas/team.py` — Pydantic request/response schemas
	- `serv/api/services/team_service.py` — Business logic (create/join/leave/update)
	- `serv/api/routes/team.py` — Team-related HTTP endpoints
	- `serv/api/services/stats_service.py` — leaderboard changes + team filters
	- `serv/api/utils/exceptions.py` — added common API exceptions

- Frontend (client/focusguard-dashboard/src):
	- `pages/TeamPage.tsx` — Create / Join UI
	- `pages/TeamDetailPage.tsx` — Team member list, stats cards, and local chat UI
	- `pages/ProfilePage.tsx` — profile widget linking to user's team
	- `services/api.ts` — `teamAPI` client methods (create/join/get/list)
	- `App.tsx` — routing for `/teams/:teamId`

## 📦 Database / Migrations

- New migrations add the `team` table and `team_members` join table (see `database/init/007_add_session_duration.sql` and project migration files). The team join table is used for team membership and leaderboard aggregation.

## 📡 API Endpoints (examples)

- POST `/api/teams` — create a team (authenticated)
- POST `/api/teams/join` — join a team by ID or invite code (authenticated)
- GET `/api/teams/{team_id}` — get team details and members
- GET `/api/teams/me/current` — get current user's team
- GET `/api/stats/leaderboard/teams` — team leaderboard

Refer to `serv/api/routes/team.py` and `serv/api/routes/stats.py` for full request/response schemas.

## 🚀 Developer Quick Start (unchanged)

Prereqs: Node.js 18+, Python 3.10+, Git

Backend
```bash
cd serv
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

Frontend
```bash
cd client/focusguard-dashboard
npm install
npm run dev
```

Environment variables are the same as before (`VITE_API_URL`, `SECRET_KEY`, `DATABASE_URL`, etc.). See the existing `.env` examples in this repo.

## 🔧 Notes for Contributors

- Team chat is currently a UI-only feature in `TeamDetailPage.tsx`. Implementing persistent/team chat will require a messages table and either WebSocket or polling endpoints.
- Member stats shown in the Team Detail view currently display placeholders in some cases; backend endpoints to aggregate per-member stats are present in `stats_service.py` but may need further tuning.
- There are new custom exceptions in `serv/api/utils/exceptions.py` used across services — keep the pattern when adding new services.

If you're testing the team flows, try these actions in sequence:
1. Create a user and authenticate.
2. POST `/api/teams` to create a team.
3. Have other users POST `/api/teams/join` to join.
4. Visit `/teams/:teamId` in the frontend to view members and the team UI.

## 📝 Changelog (recent)

- Added: Teams backend + frontend pages (create/join/detail).
- Added: Team leaderboard filter and team leaderboard endpoint.
- Fixed: Several frontend TypeScript warnings and minor UI fixes.

---

For more details, inspect the listed files and follow the code patterns used across `serv/api/*` and `client/focusguard-dashboard/src/*`.

<p align="center">Made with 💚 for focused minds everywhere</p>

```
#### Backend (.env)
