# Paisa — personal budgeting app (mobile PWA)
Realbyte-style layout (Trans / Stats / Budget / Accounts / More) with a 3D "Money Architecture" view (Survive / Protect / Grow / Live).

Features: daily, calendar and monthly views · search · per-category monthly budgets · receipt photos · net-worth trend · goals · recurring bills · editable allocation targets.

Data lives in a Postgres database (Neon) behind `/api/db`, not in the browser.

## Setup
1. Create a Postgres database. On Vercel: Project → Storage → Neon → Create. This sets `DATABASE_URL` for you.
2. Add an env var `APP_PIN` (any string). The app asks for it on load; leave it unset to disable the lock.
3. Deploy: push to GitHub → Vercel → Import → Deploy.

Local: `npm install`, `vercel link && vercel env pull .env.local`, then `vercel dev` (runs the API and the app together).
The table is created automatically on first request.
