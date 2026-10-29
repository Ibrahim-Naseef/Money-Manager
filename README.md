# Paisa — personal budgeting app (mobile-first PWA)
Built around the Money Architecture idea: **Burn, Runway, Build, Play** with a Survive / Protect / Grow / Live salary split.
Data is stored in your browser (IndexedDB via Dexie). No backend, no login, nothing to configure.

## Run
    npm install
    npm run dev

## Deploy
Push to GitHub → vercel.com → Import repo → Deploy (Vite is auto-detected).
On your phone open the URL → browser menu → *Add to Home Screen*.

## Notes
- Edit categories and their group in `src/db.js`.
- Data lives per browser/device. Use *Backup* / *Restore* in the Accounts tab to move or save it.
